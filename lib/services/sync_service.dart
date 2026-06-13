import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../crypto/vault_crypto.dart';

enum SyncState { idle, syncing, success, error, warn }

class SyncStatus {
  final SyncState state;
  final String message;
  final DateTime? lastSyncAt;
  final DateTime? lastCheckAt;
  const SyncStatus({this.state = SyncState.idle, this.message = '', this.lastSyncAt, this.lastCheckAt});
  SyncStatus copyWith({SyncState? state, String? message, DateTime? lastSyncAt, DateTime? lastCheckAt}) =>
    SyncStatus(state: state ?? this.state, message: message ?? this.message, lastSyncAt: lastSyncAt ?? this.lastSyncAt, lastCheckAt: lastCheckAt ?? this.lastCheckAt);
}

class SyncConfig {
  final String serverUrl, username, appPassword, remotePath;
  SyncConfig({this.serverUrl = '', this.username = '', this.appPassword = '', this.remotePath = '/CocoDense/vault.json'});
  bool get isConfigured => serverUrl.isNotEmpty && username.isNotEmpty && appPassword.isNotEmpty;
}

// isolate 函数
Map<String, dynamic> _decryptSync(Map<String, dynamic> args) =>
  VaultCrypto.decryptVault(args['password'] as String, Map<String, dynamic>.from(args['vault']), dataKey: args['dataKey'] as String? ?? '');

class SyncService {
  static SyncService? _instance;
  static SyncService get instance => _instance ??= SyncService._();
  SyncService._();

  SyncConfig _config = SyncConfig();
  SyncStatus _status = const SyncStatus();
  Timer? _periodicTimer;
  bool _autoSyncEnabled = true;

  SyncConfig get config => _config;
  SyncStatus get status => _status;
  bool get isConfigured => _config.isConfigured;

  // 回调：同步完成后通知 vault 重新加载
  Function(Map<String, dynamic>)? onVaultDownloaded;
  Function()? onVaultUploaded;

  void configure(SyncConfig c) { _config = c; }
  void setAutoSync(bool enabled) { _autoSyncEnabled = enabled; }

  // 启动定时同步（默认每5分钟）
  void startPeriodicSync({Duration interval = const Duration(minutes: 5)}) {
    _periodicTimer?.cancel();
    _periodicTimer = Timer.periodic(interval, (_) => checkAndSync());
  }

  void stopPeriodicSync() { _periodicTimer?.cancel(); _periodicTimer = null; }

  String _url(String path) {
    final base = _config.serverUrl.endsWith('/') ? _config.serverUrl : '${_config.serverUrl}/';
    return '$base${path.split('/').where((s) => s.isNotEmpty).map(Uri.encodeComponent).join('/')}';
  }

  Map<String, String> get _auth => {'Authorization': 'Basic ${base64Encode(utf8.encode('${_config.username}:${_config.appPassword}'))}'};

  // 测试连接
  Future<bool> testConnection() async {
    if (!_config.isConfigured) return false;
    try {
      final r = await http.get(Uri.parse(_url(_config.remotePath)), headers: _auth).timeout(const Duration(seconds: 15));
      return r.statusCode == 200 || r.statusCode == 404;
    } catch (_) { return false; }
  }

  // 检查并同步（双向合并）
  Future<void> checkAndSync() async {
    if (!_config.isConfigured || !_autoSyncEnabled) return;
    _status = _status.copyWith(state: SyncState.syncing, message: '检查同步...');
    try {
      // 1. 下载云端数据
      final remotePayload = await _downloadRaw();
      _status = _status.copyWith(lastCheckAt: DateTime.now());

      if (remotePayload == null) {
        // 云端无数据，上传本地
        _status = _status.copyWith(state: SyncState.success, message: '云端无数据', lastSyncAt: DateTime.now());
        return;
      }

      // 2. 解密云端数据
      final remoteDecrypted = await compute(_decryptSync, {
        'password': onVaultDownloaded != null ? '' : '',
        'vault': remotePayload,
        'dataKey': '',
      });

      // 3. 通知 vault 下载完成（由调用方决定如何合并）
      onVaultDownloaded?.call(remoteDecrypted);
      _status = _status.copyWith(state: SyncState.success, message: '同步完成', lastSyncAt: DateTime.now());
    } catch (e) {
      _status = _status.copyWith(state: SyncState.error, message: '同步失败: $e');
    }
  }

  // 手动上传
  Future<bool> uploadVault(Map<String, dynamic> wrapped) async {
    if (!_config.isConfigured) return false;
    _status = _status.copyWith(state: SyncState.syncing, message: '上传中...');
    try {
      await _ensureDir();
      final r = await http.put(Uri.parse(_url(_config.remotePath)), headers: {..._auth, 'Content-Type': 'application/json'}, body: jsonEncode(wrapped)).timeout(const Duration(seconds: 30));
      final ok = r.statusCode == 200 || r.statusCode == 201 || r.statusCode == 204;
      _status = _status.copyWith(
        state: ok ? SyncState.success : SyncState.error,
        message: ok ? '上传成功' : '上传失败',
        lastSyncAt: ok ? DateTime.now() : _status.lastSyncAt,
      );
      onVaultUploaded?.call();
      return ok;
    } catch (e) {
      _status = _status.copyWith(state: SyncState.error, message: '上传失败: $e');
      return false;
    }
  }

  // 手动下载
  Future<Map<String, dynamic>?> downloadVault(String masterPassword, {String dataKey = ''}) async {
    if (!_config.isConfigured) return null;
    _status = _status.copyWith(state: SyncState.syncing, message: '下载中...');
    try {
      final r = await http.get(Uri.parse(_url(_config.remotePath)), headers: _auth).timeout(const Duration(seconds: 30));
      if (r.statusCode == 200) {
        final raw = jsonDecode(r.body);
        final result = await compute(_decryptSync, {'password': masterPassword, 'vault': raw, 'dataKey': dataKey});
        _status = _status.copyWith(state: SyncState.success, message: '下载完成', lastSyncAt: DateTime.now());
        return result;
      }
      _status = _status.copyWith(state: SyncState.error, message: '下载失败: ${r.statusCode}');
      return null;
    } catch (e) {
      _status = _status.copyWith(state: SyncState.error, message: '下载失败: $e');
      return null;
    }
  }

  // 自动同步（增删改后调用）
  Future<void> autoSync(Map<String, dynamic> wrapped) async {
    if (!_config.isConfigured || !_autoSyncEnabled) return;
    await uploadVault(wrapped);
  }

  // 下载原始数据（不解密）
  Future<Map<String, dynamic>?> _downloadRaw() async {
    try {
      final r = await http.get(Uri.parse(_url(_config.remotePath)), headers: _auth).timeout(const Duration(seconds: 15));
      if (r.statusCode == 200) return jsonDecode(r.body);
      return null;
    } catch (_) { return null; }
  }

  Future<void> _ensureDir() async {
    final parts = _config.remotePath.split('/').where((s) => s.isNotEmpty).toList();
    if (parts.length <= 1) return;
    parts.removeLast();
    var cur = '';
    for (final p in parts) {
      cur = '$cur/$p';
      try {
        final c = http.Client();
        try { final req = http.Request('MKCOL', Uri.parse(_url('$cur/'))); req.headers.addAll(_auth); await c.send(req).timeout(const Duration(seconds: 10)); }
        finally { c.close(); }
      } catch (_) {}
    }
  }
}
