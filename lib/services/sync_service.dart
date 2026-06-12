import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../crypto/vault_crypto.dart';

class SyncConfig {
  final String serverUrl, username, appPassword, remotePath;
  SyncConfig({this.serverUrl = '', this.username = '', this.appPassword = '', this.remotePath = '/CocoDense/vault.json'});
  bool get isConfigured => serverUrl.isNotEmpty && username.isNotEmpty && appPassword.isNotEmpty;
}

class SyncService {
  static SyncService? _instance;
  static SyncService get instance => _instance ??= SyncService._();
  SyncService._();

  SyncConfig _config = SyncConfig();
  SyncConfig get config => _config;
  void configure(SyncConfig c) { _config = c; }

  String _url(String path) {
    final base = _config.serverUrl.endsWith('/') ? _config.serverUrl : '${_config.serverUrl}/';
    return '$base${path.split('/').where((s) => s.isNotEmpty).map(Uri.encodeComponent).join('/')}';
  }

  Map<String, String> get _auth => {'Authorization': 'Basic ${base64Encode(utf8.encode('${_config.username}:${_config.appPassword}'))}'};

  Future<bool> testConnection() async {
    if (!_config.isConfigured) return false;
    try {
      final r = await http.get(Uri.parse(_url(_config.remotePath)), headers: _auth).timeout(const Duration(seconds: 15));
      return r.statusCode == 200 || r.statusCode == 404;
    } catch (_) { return false; }
  }

  Future<Map<String, dynamic>?> downloadVault(String masterPassword, {String dataKey = ''}) async {
    if (!_config.isConfigured) return null;
    try {
      final r = await http.get(Uri.parse(_url(_config.remotePath)), headers: _auth).timeout(const Duration(seconds: 30));
      if (r.statusCode == 200) {
        final raw = jsonDecode(r.body);
        return compute(_decrypt, {'password': masterPassword, 'vault': raw, 'dataKey': dataKey});
      }
      return null;
    } catch (_) { return null; }
  }

  Future<bool> uploadVault(Map<String, dynamic> wrapped) async {
    if (!_config.isConfigured) return false;
    try {
      await _ensureDir();
      final r = await http.put(Uri.parse(_url(_config.remotePath)), headers: {..._auth, 'Content-Type': 'application/json'}, body: jsonEncode(wrapped)).timeout(const Duration(seconds: 30));
      return r.statusCode == 200 || r.statusCode == 201 || r.statusCode == 204;
    } catch (_) { return false; }
  }

  Future<void> _ensureDir() async {
    final parts = _config.remotePath.split('/').where((s) => s.isNotEmpty).toList();
    if (parts.length <= 1) return;
    parts.removeLast();
    var cur = '';
    for (final p in parts) {
      cur = '$cur/$p';
      try { final c = http.Client(); try { final req = http.Request('MKCOL', Uri.parse(_url('$cur/'))); req.headers.addAll(_auth); await c.send(req).timeout(const Duration(seconds: 10)); } finally { c.close(); } } catch (_) {}
    }
  }
}

Map<String, dynamic> _decrypt(Map<String, dynamic> args) =>
  VaultCrypto.decryptVault(args['password'] as String, Map<String, dynamic>.from(args['vault']), dataKey: args['dataKey'] as String? ?? '');
