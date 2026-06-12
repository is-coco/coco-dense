import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/foundation.dart';
import 'package:path_provider/path_provider.dart';
import '../crypto/vault_crypto.dart';
import '../models/vault_entry.dart';

class UnlockResult {
  final bool success;
  final String? error;
  const UnlockResult.success() : success = true, error = null;
  const UnlockResult.error(this.error) : success = false;
}

// --- isolate 函数 ---

// 解密 vault，返回 payload + vaultKey
Map<String, dynamic> _decryptIsolate(Map<String, dynamic> args) {
  final result = VaultCrypto.decryptVault(args['password'] as String, Map<String, dynamic>.from(args['vault']), dataKey: args['dataKey'] as String? ?? '');
  // vaultKey 是 Uint8List，不能直接传回主 isolate，需要编码
  if (result['vaultKey'] != null) {
    result['vaultKeyB64'] = base64Encode(result['vaultKey'] as Uint8List);
  }
  return result;
}

// 用缓存的 vaultKey 加密（不需要 PBKDF2）
Map<String, dynamic> _encryptWithCachedKey(Map<String, dynamic> args) {
  final vaultKey = base64Decode(args['vaultKeyB64'] as String);
  final payload = Map<String, dynamic>.from(args['payload']);
  final now = DateTime.now().toIso8601String();
  return {
    'version': 2, 'format': VaultCrypto.vaultFormatV2,
    'key': args['encryptedKey'] as Map<String, dynamic>, // 复用原来的加密 key
    'meta': VaultCrypto.encryptWithVaultKey(vaultKey, {'version': payload['version'] ?? 1, 'createdAt': payload['createdAt'] ?? now, 'updatedAt': now}),
    'settings': VaultCrypto.encryptWithVaultKey(vaultKey, payload['settings'] ?? {}),
    'entries': ((payload['entries'] as List?) ?? []).map((entry) => {
      'id': entry['id'] ?? '', 'updatedAt': entry['updatedAt'] ?? '', 'deletedAt': entry['deletedAt'] ?? '',
      'sealed': VaultCrypto.encryptWithVaultKey(vaultKey, Map<String, dynamic>.from(entry)),
    }).toList(),
  };
}

// 首次加密（需要 PBKDF2）
Map<String, dynamic> _encryptFull(Map<String, dynamic> args) {
  final password = args['password'] as String;
  final payload = Map<String, dynamic>.from(args['payload']);
  final vaultKey = VaultCrypto.randomBytes(32);
  final now = DateTime.now().toIso8601String();
  final wrapped = {
    'version': 2, 'format': VaultCrypto.vaultFormatV2,
    'key': VaultCrypto.encryptBufferWithPassword(password, vaultKey),
    'meta': VaultCrypto.encryptWithVaultKey(vaultKey, {'version': payload['version'] ?? 1, 'createdAt': payload['createdAt'] ?? now, 'updatedAt': now}),
    'settings': VaultCrypto.encryptWithVaultKey(vaultKey, payload['settings'] ?? {}),
    'entries': ((payload['entries'] as List?) ?? []).map((entry) => {
      'id': entry['id'] ?? '', 'updatedAt': entry['updatedAt'] ?? '', 'deletedAt': entry['deletedAt'] ?? '',
      'sealed': VaultCrypto.encryptWithVaultKey(vaultKey, Map<String, dynamic>.from(entry)),
    }).toList(),
  };
  // 返回加密后的 key 和 vaultKey 以便缓存
  wrapped['_vaultKeyB64'] = base64Encode(vaultKey);
  return wrapped;
}

class VaultService {
  static VaultService? _instance;
  static VaultService get instance => _instance ??= VaultService._();
  VaultService._();

  List<VaultEntry> _entries = [];
  Map<String, dynamic> _settings = {};
  String? _masterPassword;
  String? _dataKey;
  bool _unlocked = false;
  bool _saving = false;

  // 缓存 vaultKey，避免重复 PBKDF2
  String? _cachedVaultKeyB64;
  Map<String, dynamic>? _cachedEncryptedKey;

  List<VaultEntry> get entries => List.unmodifiable(_entries.where((e) => e.deletedAt.isEmpty));
  bool get isUnlocked => _unlocked;
  String? get masterPassword => _masterPassword;
  String? get dataKey => _dataKey;

  // --- Folders ---
  List<Folder> get folders {
    final raw = _settings['folders'];
    if (raw is List) return raw.map((e) => Folder.fromJson(Map<String, dynamic>.from(e))).toList();
    return [];
  }
  void saveFolders(List<Folder> list) { _settings['folders'] = list.map((f) => f.toJson()).toList(); _saveVault(); }
  Folder? getFolder(String id) { try { return folders.firstWhere((f) => f.id == id); } catch (_) { return null; } }
  String getFolderName(String id) => id.isEmpty ? '未分组' : (getFolder(id)?.name ?? '未分组');
  Folder createFolder(String name) {
    final id = '${name.toLowerCase().replaceAll(RegExp(r'[^a-z0-9]+'), '-')}-${DateTime.now().millisecondsSinceEpoch.toRadixString(36)}';
    final f = Folder(id: id, name: name);
    saveFolders([...folders, f]);
    return f;
  }
  void renameFolder(String id, String name) { saveFolders(folders.map((f) => f.id == id ? f.copyWith(name: name) : f).toList()); }
  void deleteFolder(String id) {
    saveFolders(folders.where((f) => f.id != id).toList());
    for (var i = 0; i < _entries.length; i++) {
      if (_entries[i].folderId == id) _entries[i] = _entries[i].copyWith(folderId: '', updatedAt: DateTime.now().toIso8601String());
    }
    _saveVault();
  }
  void moveEntryToFolder(String entryId, String folderId) {
    final i = _entries.indexWhere((e) => e.id == entryId);
    if (i >= 0) { _entries[i] = _entries[i].copyWith(folderId: folderId, updatedAt: DateTime.now().toIso8601String()); _saveVault(); }
  }

  Map<String, dynamic> get settings => Map.unmodifiable(_settings);
  void updateSettings(Map<String, dynamic> u) { _settings.addAll(u); _saveVault(); }

  // --- Recovery ---
  Map<String, dynamic>? _recoveryData;
  Future<Map<String, dynamic>> getRecoveryStatus() async {
    final dir = await getApplicationSupportDirectory();
    final file = File('${dir.path}/recovery.json');
    if (!file.existsSync()) return {'configured': false};
    try { _recoveryData = jsonDecode(file.readAsStringSync()); return {'configured': true, 'questions': _recoveryData?['questions'] ?? []}; } catch (_) { return {'configured': false, 'corrupted': true}; }
  }
  Future<void> saveRecovery(String q, String a) async {
    final dir = await getApplicationSupportDirectory();
    final wrapped = VaultCrypto.encryptBufferWithPassword(_masterPassword!, Uint8List.fromList(utf8.encode(a.trim().toLowerCase())));
    File('${dir.path}/recovery.json').writeAsStringSync(jsonEncode({'version': 1, 'questions': [q], 'wrapped': wrapped, 'updatedAt': DateTime.now().toIso8601String()}));
  }

  // --- Data Key ---
  Future<Map<String, dynamic>> getDataKeyStatus() async {
    final dir = await getApplicationSupportDirectory();
    return {'sessionActive': _dataKey != null && _dataKey!.isNotEmpty, 'remembered': File('${dir.path}/data-key.json').existsSync()};
  }
  Future<void> saveDataKey(String dk, {bool remember = false}) async {
    _dataKey = dk; _saveVault();
    if (remember) {
      final dir = await getApplicationSupportDirectory();
      File('${dir.path}/data-key.json').writeAsStringSync(jsonEncode({'version': 1, 'secret': base64Encode(utf8.encode(dk)), 'updatedAt': DateTime.now().toIso8601String()}));
    }
  }
  Future<void> clearDataKey() async {
    _dataKey = null; _saveVault();
    final dir = await getApplicationSupportDirectory();
    final f = File('${dir.path}/data-key.json');
    if (f.existsSync()) f.deleteSync();
  }
  Future<String?> loadRememberedDataKey() async {
    final dir = await getApplicationSupportDirectory();
    final f = File('${dir.path}/data-key.json');
    if (!f.existsSync()) return null;
    try { return utf8.decode(base64Decode(jsonDecode(f.readAsStringSync())['secret'])); } catch (_) { return null; }
  }

  // --- Import/Export ---
  Future<String> exportVault() async => jsonEncode(await _encryptCurrent());
  Future<bool> changeMasterPassword(String old, String pwd) async {
    if (old != _masterPassword) return false;
    _masterPassword = pwd; _cachedVaultKeyB64 = null; _cachedEncryptedKey = null; _saveVault(); return true;
  }

  // --- Core ---
  Future<String> get _vaultPath async => '${(await getApplicationSupportDirectory()).path}/vault.json';
  Future<bool> hasVaultFile() async => File(await _vaultPath).existsSync();
  Future<bool> requiresDataKey() async {
    final path = await _vaultPath;
    final f = File(path);
    if (!f.existsSync()) return false;
    try { return VaultCrypto.isDataKeyVault(Map<String, dynamic>.from(jsonDecode(f.readAsStringSync()))); } catch (_) { return false; }
  }
  Future<bool> unlock(String password, {String dataKey = ''}) async => (await unlockWithDetail(password, dataKey: dataKey)).success;

  Future<UnlockResult> unlockWithDetail(String password, {String dataKey = ''}) async {
    final path = await _vaultPath;
    final file = File(path);
    if (!file.existsSync()) { _createNew(password, dataKey); return const UnlockResult.success(); }
    try {
      final raw = file.readAsStringSync();
      final result = await compute(_decryptIsolate, {'password': password, 'vault': jsonDecode(raw), 'dataKey': dataKey});
      _loadPayload(result);
      _masterPassword = password;
      _dataKey = dataKey;
      _unlocked = true;
      // 缓存 vaultKey，后续保存不再跑 PBKDF2
      if (result['vaultKeyB64'] != null) {
        _cachedVaultKeyB64 = result['vaultKeyB64'] as String;
        _cachedEncryptedKey = Map<String, dynamic>.from(result['key'] as Map);
      }
      return const UnlockResult.success();
    } catch (e) {
      final msg = e.toString();
      if (msg.contains('数据钥匙不正确')) return const UnlockResult.error('数据钥匙不正确');
      if (msg.contains('请输入数据钥匙')) return const UnlockResult.error('请输入数据钥匙');
      return const UnlockResult.error('主密码错误');
    }
  }

  void _createNew(String pwd, String dk) {
    _entries = []; _settings = {}; _masterPassword = pwd; _dataKey = dk; _unlocked = true;
    _cachedVaultKeyB64 = null; _cachedEncryptedKey = null;
    _saveVault();
  }

  void _loadPayload(Map<String, dynamic> p) {
    _entries = (p['entries'] as List? ?? []).map((e) => VaultEntry.fromJson(Map<String, dynamic>.from(e))).toList();
    _settings = Map<String, dynamic>.from(p['settings'] ?? {});
  }

  // 保存：有缓存 vaultKey 就用 AES-only，没有才跑 PBKDF2
  Future<void> _saveVault() async {
    if (!_unlocked || _masterPassword == null || _saving) return;
    _saving = true;
    try {
      final path = await _vaultPath;
      final wrapped = await _encryptCurrent();
      // 清理内部字段
      wrapped.remove('_vaultKeyB64');
      File(path).writeAsStringSync(jsonEncode(wrapped));
    } finally {
      _saving = false;
    }
  }

  Future<Map<String, dynamic>> _encryptCurrent() async {
    final payload = {
      'version': 1, 'createdAt': DateTime.now().toIso8601String(), 'updatedAt': DateTime.now().toIso8601String(),
      'entries': _entries.map((e) => e.toJson()).toList(), 'settings': _settings,
    };
    // 有缓存 vaultKey → 只用 AES，不跑 PBKDF2（快 100 倍）
    if (_cachedVaultKeyB64 != null && _cachedEncryptedKey != null) {
      final result = await compute(_encryptWithCachedKey, {
        'vaultKeyB64': _cachedVaultKeyB64!, 'encryptedKey': _cachedEncryptedKey!, 'payload': payload,
      });
      return result;
    }
    // 首次加密（新建 vault），需要 PBKDF2
    final result = await compute(_encryptFull, {'password': _masterPassword!, 'payload': payload});
    // 缓存新生成的 vaultKey
    if (result['_vaultKeyB64'] != null) {
      _cachedVaultKeyB64 = result['_vaultKeyB64'] as String;
      _cachedEncryptedKey = Map<String, dynamic>.from(result['key'] as Map);
    }
    return result;
  }

  Future<Map<String, dynamic>> encryptCurrentVault() => _encryptCurrent();

  void applyDownloadedVault(Map<String, dynamic> payload) { _loadPayload(payload); _saveVault(); }

  void addEntry(VaultEntry e) { _entries.insert(0, e); _saveVault(); }
  void updateEntry(VaultEntry e) { final i = _entries.indexWhere((x) => x.id == e.id); if (i >= 0) { _entries[i] = e; _saveVault(); } }
  void deleteEntry(String id) {
    final i = _entries.indexWhere((e) => e.id == id);
    if (i >= 0) { _entries[i] = _entries[i].copyWith(deletedAt: DateTime.now().toIso8601String(), updatedAt: DateTime.now().toIso8601String()); _saveVault(); }
  }
  void lock() {
    _entries = []; _settings = {}; _masterPassword = null; _dataKey = null; _unlocked = false;
    _cachedVaultKeyB64 = null; _cachedEncryptedKey = null;
  }
}
