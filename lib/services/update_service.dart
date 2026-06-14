import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';

class UpdateInfo {
  final bool available;
  final String latestVersion;
  final String currentVersion;
  final String notes;
  final String assetName;
  final String assetUrl;
  final int assetSize;
  const UpdateInfo({this.available = false, this.latestVersion = '', this.currentVersion = '', this.notes = '', this.assetName = '', this.assetUrl = '', this.assetSize = 0});
}

class UpdateService {
  static const String _repoUrl = 'https://api.github.com/repos/is-coco/coco-dense/releases/latest';
  static const String currentVersion = '0.5.0';
  static const List<String> _mirrors = ['https://ghfast.top/', 'https://ghproxy.cn/'];

  static Future<UpdateInfo> checkUpdate() async {
    try {
      final resp = await http.get(Uri.parse(_repoUrl), headers: {'Accept': 'application/vnd.github.v3+json'}).timeout(const Duration(seconds: 15));
      if (resp.statusCode != 200) return const UpdateInfo();
      final data = jsonDecode(resp.body);
      final tagName = (data['tag_name'] ?? '').toString().replaceFirst('v', '');
      final body = (data['body'] ?? '').toString();
      final assets = (data['assets'] as List?) ?? [];

      String assetName = '', assetUrl = '';
      int assetSize = 0;
      for (final asset in assets) {
        final name = (asset['name'] ?? '').toString();
        if (name.endsWith('.apk')) {
          assetName = name;
          assetUrl = (asset['browser_download_url'] ?? '').toString();
          assetSize = asset['size'] ?? 0;
          break;
        }
      }
      if (assetUrl.isEmpty) return const UpdateInfo();

      return UpdateInfo(
        available: _compareVersions(currentVersion, tagName) < 0,
        latestVersion: tagName, currentVersion: currentVersion,
        notes: body, assetName: assetName, assetUrl: assetUrl, assetSize: assetSize,
      );
    } catch (_) { return const UpdateInfo(); }
  }

  static int _compareVersions(String a, String b) {
    final pa = a.split('.').map((s) => int.tryParse(s) ?? 0).toList();
    final pb = b.split('.').map((s) => int.tryParse(s) ?? 0).toList();
    final len = pa.length > pb.length ? pa.length : pb.length;
    for (var i = 0; i < len; i++) {
      final va = i < pa.length ? pa[i] : 0;
      final vb = i < pb.length ? pb[i] : 0;
      if (vb > va) return -1;
      if (vb < va) return 1;
    }
    return 0;
  }

  static String formatSize(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
  }

  static Future<String?> downloadUpdate(UpdateInfo info, {ValueChanged<double>? onProgress}) async {
    try {
      final dir = await getTemporaryDirectory();
      final filePath = '${dir.path}/${info.assetName}';
      var success = false;
      try { success = await _download(info.assetUrl, filePath, info.assetSize, onProgress); } catch (_) {}
      if (!success) {
        for (final mirror in _mirrors) {
          try { success = await _download('$mirror${info.assetUrl}', filePath, info.assetSize, onProgress); if (success) break; } catch (_) {}
        }
      }
      if (success && File(filePath).existsSync()) return filePath;
      return null;
    } catch (_) { return null; }
  }

  static Future<bool> _download(String url, String savePath, int totalSize, ValueChanged<double>? onProgress) async {
    final request = http.Request('GET', Uri.parse(url));
    final response = await http.Client().send(request).timeout(const Duration(seconds: 60));
    if (response.statusCode != 200) return false;
    final file = File(savePath);
    final sink = file.openWrite();
    int downloaded = 0;
    await for (final chunk in response.stream) {
      sink.add(chunk);
      downloaded += chunk.length;
      if (totalSize > 0 && onProgress != null) onProgress(downloaded / totalSize);
    }
    await sink.flush();
    await sink.close();
    return true;
  }

  // Android: 打开 APK 安装包
  static Future<void> openInstaller(String filePath) async {
    if (Platform.isAndroid) {
      // Android 需要通过 intent 打开 APK
      // 简单方案：用 url_launcher 的 file:// 方案
      // 这里先用 Process.run 尝试
      try {
        await Process.run('am', ['start', '-a', 'android.intent.action.VIEW', '-d', 'file://$filePath', '-t', 'application/vnd.android.package-archive']);
      } catch (_) {
        // fallback: 用户手动打开
      }
    } else if (Platform.isMacOS) {
      await Process.run('open', [filePath]);
    }
  }
}
