import 'dart:convert';
import 'dart:math';
import 'dart:typed_data';
import 'package:encrypt/encrypt.dart';
import 'package:pointycastle/export.dart';

class VaultCrypto {
  static const int ivLength = 12;
  static const int keyLength = 32;
  static const int saltLength = 16;
  static const int pbkdf2Rounds = 250000;
  static const String vaultFormatV2 = 'coco-dense-envelope-v2';
  static const String vaultFormatV3 = 'coco-dense-envelope-v3';

  static Uint8List randomBytes(int length) {
    final random = Random.secure();
    return Uint8List.fromList(List.generate(length, (_) => random.nextInt(256)));
  }

  static Uint8List deriveKey(String password, String saltBase64, {int rounds = pbkdf2Rounds}) {
    final salt = base64.decode(saltBase64);
    final pbkdf2 = PBKDF2KeyDerivator(HMac(SHA256Digest(), 64));
    pbkdf2.init(Pbkdf2Parameters(salt, rounds, keyLength));
    return pbkdf2.process(Uint8List.fromList(utf8.encode(password)));
  }

  static Map<String, dynamic> encryptBufferWithPassword(String password, Uint8List buffer) {
    final salt = randomBytes(saltLength);
    final iv = randomBytes(ivLength);
    final key = deriveKey(password, base64.encode(salt));
    final cipher = GCMBlockCipher(AESEngine());
    cipher.init(true, AEADParameters(KeyParameter(key), 128, iv, Uint8List(0)));
    final encrypted = cipher.process(buffer);
    return {
      'version': 1, 'kdf': 'pbkdf2', 'rounds': pbkdf2Rounds,
      'salt': base64.encode(salt), 'iv': base64.encode(iv),
      'tag': base64.encode(encrypted.sublist(encrypted.length - 16)),
      'data': base64.encode(encrypted.sublist(0, encrypted.length - 16)),
    };
  }

  static Uint8List decryptBufferWithPassword(String password, Map<String, dynamic> wrapped) {
    final key = deriveKey(password, wrapped['salt'], rounds: wrapped['rounds'] ?? pbkdf2Rounds);
    final iv = base64.decode(wrapped['iv']);
    final tag = base64.decode(wrapped['tag']);
    final data = base64.decode(wrapped['data']);
    final combined = Uint8List(data.length + tag.length);
    combined.setRange(0, data.length, data);
    combined.setRange(data.length, combined.length, tag);
    final cipher = GCMBlockCipher(AESEngine());
    cipher.init(false, AEADParameters(KeyParameter(key), 128, iv, Uint8List(0)));
    return cipher.process(combined);
  }

  static Map<String, dynamic> encryptWithVaultKey(Uint8List vaultKey, Map<String, dynamic> payload) {
    final iv = randomBytes(ivLength);
    final plaintext = utf8.encode(jsonEncode(payload));
    final cipher = GCMBlockCipher(AESEngine());
    cipher.init(true, AEADParameters(KeyParameter(vaultKey), 128, iv, Uint8List(0)));
    final encrypted = cipher.process(Uint8List.fromList(plaintext));
    return {
      'version': 1, 'alg': 'aes-256-gcm',
      'iv': base64.encode(iv),
      'tag': base64.encode(encrypted.sublist(encrypted.length - 16)),
      'data': base64.encode(encrypted.sublist(0, encrypted.length - 16)),
    };
  }

  static Map<String, dynamic> decryptWithVaultKey(Uint8List vaultKey, Map<String, dynamic> wrapped) {
    final iv = base64.decode(wrapped['iv']);
    final tag = base64.decode(wrapped['tag']);
    final data = base64.decode(wrapped['data']);
    final combined = Uint8List(data.length + tag.length);
    combined.setRange(0, data.length, data);
    combined.setRange(data.length, combined.length, tag);
    final cipher = GCMBlockCipher(AESEngine());
    cipher.init(false, AEADParameters(KeyParameter(vaultKey), 128, iv, Uint8List(0)));
    final decrypted = cipher.process(combined);
    return jsonDecode(utf8.decode(decrypted));
  }

  static bool isEnvelopeVault(Map<String, dynamic> vault) =>
    vault['version'] == 2 && vault['format'] == vaultFormatV2 && vault['key'] != null;

  static bool isDataKeyVault(Map<String, dynamic> vault) =>
    vault['version'] == 3 && vault['format'] == vaultFormatV3 && vault['auth'] != null && vault['key'] != null;

  // 核心修改：返回值包含 vaultKey
  static Map<String, dynamic> decryptVault(String masterPassword, Map<String, dynamic> vault, {String dataKey = ''}) {
    if (isDataKeyVault(vault)) {
      if (!_verifyDataKeyVaultMaster(masterPassword, vault)) throw Exception('密码错误');
      final dk = dataKey.trim();
      if (dk.isEmpty) throw Exception('请输入数据钥匙');
      late final Uint8List vaultKey;
      try { vaultKey = decryptBufferWithPassword(dk, Map<String, dynamic>.from(vault['key'])); } catch (_) { throw Exception('数据钥匙不正确'); }
      final result = _decryptWithVaultKeyFull(vaultKey, vault);
      result['vaultKey'] = vaultKey;
      result['key'] = vault['key']; // 保存加密后的 key 包装
      return result;
    }

    if (isEnvelopeVault(vault)) {
      final vaultKey = decryptBufferWithPassword(masterPassword, Map<String, dynamic>.from(vault['key']));
      final result = _decryptWithVaultKeyFull(vaultKey, vault);
      result['vaultKey'] = vaultKey;
      result['key'] = vault['key'];
      return result;
    }

    return _decryptLegacy(masterPassword, vault);
  }

  static bool _verifyDataKeyVaultMaster(String masterPassword, Map<String, dynamic> vault) {
    try { decryptBufferWithPassword(masterPassword, Map<String, dynamic>.from(vault['auth']['wrapped'])); return true; } catch (_) { return false; }
  }

  static Map<String, dynamic> _decryptWithVaultKeyFull(Uint8List vaultKey, Map<String, dynamic> vault) {
    final meta = decryptWithVaultKey(vaultKey, Map<String, dynamic>.from(vault['meta']));
    final settings = vault['settings'] != null ? decryptWithVaultKey(vaultKey, Map<String, dynamic>.from(vault['settings'])) : <String, dynamic>{};
    final entries = (vault['entries'] as List? ?? []).map((item) {
      return decryptWithVaultKey(vaultKey, Map<String, dynamic>.from(item['sealed']));
    }).toList();
    return {
      'version': meta['version'] ?? 1,
      'createdAt': meta['createdAt'] ?? DateTime.now().toIso8601String(),
      'updatedAt': meta['updatedAt'] ?? DateTime.now().toIso8601String(),
      'entries': entries, 'settings': settings,
    };
  }

  static Map<String, dynamic> _decryptLegacy(String masterPassword, Map<String, dynamic> vault) {
    final key = deriveKey(masterPassword, vault['salt'], rounds: vault['rounds'] ?? pbkdf2Rounds);
    final iv = base64.decode(vault['iv']);
    final tag = base64.decode(vault['tag']);
    final data = base64.decode(vault['data']);
    final combined = Uint8List(data.length + tag.length);
    combined.setRange(0, data.length, data);
    combined.setRange(data.length, combined.length, tag);
    final cipher = GCMBlockCipher(AESEngine());
    cipher.init(false, AEADParameters(KeyParameter(key), 128, iv, Uint8List(0)));
    final decrypted = cipher.process(combined);
    return jsonDecode(utf8.decode(decrypted));
  }

  static String generateDataKeySecret() => base64Url.encode(randomBytes(32)).replaceAll('=', '');
}
