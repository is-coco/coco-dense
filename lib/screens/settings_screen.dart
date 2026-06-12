import 'package:flutter/material.dart';
import 'dart:convert';
import '../services/sync_service.dart';
import '../services/update_service.dart';
import '../services/vault_service.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});
  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> with SingleTickerProviderStateMixin {
  late TabController _tab;
  // Sync
  final _serverCtl = TextEditingController(text: SyncService.instance.config.serverUrl);
  final _userCtl = TextEditingController(text: SyncService.instance.config.username);
  final _passCtl = TextEditingController(text: SyncService.instance.config.appPassword);
  final _pathCtl = TextEditingController(text: SyncService.instance.config.remotePath);
  bool _testing = false, _uploading = false, _downloading = false, _obscurePwd = true;
  String? _testResult;
  // Data key
  final _dkCtl = TextEditingController();
  bool _dkRemember = false, _dkActive = false;
  // Recovery
  final _recQ = TextEditingController(), _recA = TextEditingController();
  bool _recOk = false;
  // Change pwd
  final _oldPwd = TextEditingController(), _newPwd = TextEditingController(), _confPwd = TextEditingController();

  @override
  void initState() { super.initState(); _tab = TabController(length: 5, vsync: this); _load(); }
  Future<void> _load() async {
    final dk = await VaultService.instance.getDataKeyStatus();
    final rc = await VaultService.instance.getRecoveryStatus();
    if (mounted) setState(() { _dkActive = dk['sessionActive'] ?? false; _recOk = rc['configured'] ?? false; });
  }
  @override
  void dispose() {
    _tab.dispose(); _serverCtl.dispose(); _userCtl.dispose(); _passCtl.dispose(); _pathCtl.dispose();
    _dkCtl.dispose(); _recQ.dispose(); _recA.dispose(); _oldPwd.dispose(); _newPwd.dispose(); _confPwd.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(leading: IconButton(icon: const Icon(Icons.arrow_back_rounded, size: 22), onPressed: () => Navigator.pop(context)),
        title: const Text('设置', style: TextStyle(fontSize: 16)),
        bottom: TabBar(controller: _tab, isScrollable: true, tabAlignment: TabAlignment.start,
          labelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600), unselectedLabelStyle: const TextStyle(fontSize: 12),
          tabs: const [Tab(text: '云同步'), Tab(text: '数据钥匙'), Tab(text: '安全'), Tab(text: '备份'), Tab(text: '更新')])),
      body: TabBarView(controller: _tab, children: [_syncTab(cs), _dkTab(cs), _secTab(cs), _backupTab(cs), _updateTab(cs)]),
    );
  }

  Widget _syncTab(ColorScheme cs) => ListView(padding: const EdgeInsets.all(14), children: [
    _card(cs, [
      _input('服务器', _serverCtl, Icons.dns_outlined, hint: 'https://dav.jianguoyun.com/dav/'),
      _input('用户名', _userCtl, Icons.person_outline, hint: '坚果云邮箱'),
      _input('应用密码', _passCtl, Icons.key, obscure: _obscurePwd, suffix: IconButton(icon: Icon(_obscurePwd ? Icons.visibility : Icons.visibility_off, size: 16, color: cs.onSurface.withOpacity(0.3)), onPressed: () => setState(() => _obscurePwd = !_obscurePwd))),
      _input('路径', _pathCtl, Icons.folder_outlined, hint: '/CocoDense/vault.json'),
      const SizedBox(height: 10),
      Row(children: [
        Expanded(child: OutlinedButton.icon(onPressed: _testing ? null : _test, icon: _testing ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2)) : const Icon(Icons.wifi_tethering, size: 15), label: const Text('测试', style: TextStyle(fontSize: 13)))),
        const SizedBox(width: 8),
        Expanded(child: FilledButton.icon(onPressed: _saveSync, icon: const Icon(Icons.save_outlined, size: 15), label: const Text('保存', style: TextStyle(fontSize: 13)))),
      ]),
      if (_testResult != null) Padding(padding: const EdgeInsets.only(top: 8),
        child: Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          decoration: BoxDecoration(color: (_testResult == '连接成功' ? Colors.green : cs.error).withOpacity(0.08), borderRadius: BorderRadius.circular(6)),
          child: Row(children: [Icon(_testResult == '连接成功' ? Icons.check_circle : Icons.error, size: 15, color: _testResult == '连接成功' ? Colors.green : cs.error),
            const SizedBox(width: 6), Text(_testResult!, style: TextStyle(fontSize: 12, color: _testResult == '连接成功' ? Colors.green : cs.error))]))),
    ]),
    const SizedBox(height: 12),
    _card(cs, [
      _action(Icons.cloud_upload, '上传到云端', _uploading ? null : _upload, loading: _uploading),
      Divider(height: 1, color: cs.outline.withOpacity(0.1)),
      _action(Icons.cloud_download, '从云端下载', _downloading ? null : _download, loading: _downloading),
    ]),
  ]);

  Widget _dkTab(ColorScheme cs) => ListView(padding: const EdgeInsets.all(14), children: [
    Container(padding: const EdgeInsets.all(12), decoration: BoxDecoration(color: cs.primary.withOpacity(0.06), borderRadius: BorderRadius.circular(10)),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [Icon(Icons.vpn_key, size: 18, color: cs.primary), const SizedBox(width: 10),
        Expanded(child: Text('数据钥匙是保护数据的关键密钥。留空则使用主密码。勾选"本机记住"后无需每次输入。\n所有数据以 AES-256-GCM 加密。', style: TextStyle(fontSize: 12, color: cs.onSurface.withOpacity(0.6), height: 1.5)))])),
    const SizedBox(height: 14),
    _card(cs, [
      Row(children: [Icon(_dkActive ? Icons.check_circle : Icons.radio_button_unchecked, size: 16, color: _dkActive ? Colors.green : cs.onSurface.withOpacity(0.3)),
        const SizedBox(width: 8), Text(_dkActive ? '已激活' : '未设置', style: TextStyle(fontSize: 13, color: cs.onSurface.withOpacity(0.6)))]),
      const SizedBox(height: 12),
      _input('数据钥匙', _dkCtl, Icons.vpn_key, hint: '留空使用主密码'),
      Row(children: [Checkbox(value: _dkRemember, onChanged: (v) => setState(() => _dkRemember = v ?? false), visualDensity: VisualDensity.compact),
        Text('本机记住', style: TextStyle(fontSize: 13, color: cs.onSurface.withOpacity(0.6)))]),
      const SizedBox(height: 10),
      Row(children: [
        Expanded(child: OutlinedButton(onPressed: () async { await VaultService.instance.clearDataKey(); setState(() { _dkActive = false; _dkCtl.clear(); }); }, child: const Text('清除', style: TextStyle(fontSize: 13)))),
        const SizedBox(width: 8),
        Expanded(child: FilledButton(onPressed: () async {
          if (_dkCtl.text.trim().isEmpty) { ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('请输入'))); return; }
          await VaultService.instance.saveDataKey(_dkCtl.text.trim(), remember: _dkRemember); setState(() => _dkActive = true);
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('已保存')));
        }, child: const Text('保存', style: TextStyle(fontSize: 13)))),
      ]),
      const SizedBox(height: 8),
      SizedBox(width: double.infinity, child: OutlinedButton.icon(onPressed: () {
        _dkCtl.text = base64Url.encode(List.generate(24, (i) => (DateTime.now().millisecondsSinceEpoch + i * 37) % 256)).replaceAll('=', '');
        setState(() {});
      }, icon: const Icon(Icons.auto_fix_high, size: 15), label: const Text('随机生成', style: TextStyle(fontSize: 13)))),
    ]),
  ]);

  Widget _secTab(ColorScheme cs) => ListView(padding: const EdgeInsets.all(14), children: [
    Text('安全问题', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: cs.onSurface.withOpacity(0.7))),
    const SizedBox(height: 8),
    _card(cs, [
      if (_recOk) Padding(padding: const EdgeInsets.only(bottom: 8), child: Row(children: [Icon(Icons.check_circle, size: 16, color: Colors.green), const SizedBox(width: 6), Text('已配置', style: TextStyle(fontSize: 13, color: cs.onSurface.withOpacity(0.6)))])),
      _input('问题', _recQ, Icons.help_outline, hint: '例如：你的出生城市？'),
      _input('答案', _recA, Icons.edit_outlined, hint: '输入答案'),
      SizedBox(width: double.infinity, child: FilledButton(onPressed: () async {
        if (_recQ.text.trim().isEmpty || _recA.text.trim().isEmpty) return;
        await VaultService.instance.saveRecovery(_recQ.text.trim(), _recA.text.trim());
        setState(() => _recOk = true); ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('已保存')));
      }, child: const Text('保存', style: TextStyle(fontSize: 13)))),
    ]),
    const SizedBox(height: 20),
    Text('修改主密码', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: cs.onSurface.withOpacity(0.7))),
    const SizedBox(height: 8),
    _card(cs, [
      _input('当前密码', _oldPwd, Icons.lock_outline, obscure: true),
      _input('新密码', _newPwd, Icons.lock_outline, obscure: true),
      _input('确认', _confPwd, Icons.lock_outline, obscure: true),
      SizedBox(width: double.infinity, child: FilledButton(onPressed: () async {
        if (_newPwd.text != _confPwd.text) { ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('不一致'))); return; }
        final ok = await VaultService.instance.changeMasterPassword(_oldPwd.text, _newPwd.text);
        if (ok) { ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('已修改'))); _oldPwd.clear(); _newPwd.clear(); _confPwd.clear(); }
        else { ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('密码错误'))); }
      }, child: const Text('修改', style: TextStyle(fontSize: 13)))),
    ]),
  ]);

  Widget _backupTab(ColorScheme cs) => ListView(padding: const EdgeInsets.all(14), children: [
    Text('导出', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: cs.onSurface.withOpacity(0.7))),
    const SizedBox(height: 8),
    _card(cs, [_action(Icons.file_download_outlined, '导出加密文件', () async {
      final data = await VaultService.instance.exportVault();
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('已导出 (${data.length} 字节)')));
    })]),
  ]);

  // --- Update Tab ---
  UpdateInfo? _updateInfo;
  bool _checkingUpdate = false;
  bool _downloadingUpdate = false;
  double _downloadProgress = 0;

  Widget _updateTab(ColorScheme cs) {
    return ListView(padding: const EdgeInsets.all(14), children: [
      // 当前版本
      _card(cs, [
        Row(children: [
          Icon(Icons.info_outline, size: 18, color: cs.primary),
          const SizedBox(width: 10),
          Text('当前版本: v${UpdateService.currentVersion}', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: cs.onSurface.withOpacity(0.8))),
        ]),
      ]),
      const SizedBox(height: 12),
      // 检查更新按钮
      SizedBox(width: double.infinity, height: 40,
        child: FilledButton.icon(
          onPressed: _checkingUpdate ? null : _checkUpdate,
          icon: _checkingUpdate ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Icon(Icons.refresh, size: 18),
          label: Text(_checkingUpdate ? '检查中...' : '检查更新', style: const TextStyle(fontSize: 14)),
        )),
      // 更新信息
      if (_updateInfo != null) ...[
        const SizedBox(height: 16),
        if (_updateInfo!.available) ...[
          _card(cs, [
            Row(children: [
              Icon(Icons.system_update, size: 20, color: cs.primary),
              const SizedBox(width: 10),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('发现新版本 v${_updateInfo!.latestVersion}', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: cs.onSurface)),
                if (_updateInfo!.assetName.isNotEmpty)
                  Text('${_updateInfo!.assetName} (${UpdateService.formatSize(_updateInfo!.assetSize)})', style: TextStyle(fontSize: 12, color: cs.onSurface.withOpacity(0.5))),
              ])),
            ]),
            // 更新日志
            if (_updateInfo!.notes.isNotEmpty) ...[
              const SizedBox(height: 12),
              Container(width: double.infinity, padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(color: cs.surfaceContainerHighest.withOpacity(0.3), borderRadius: BorderRadius.circular(8)),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('更新日志', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: cs.onSurface.withOpacity(0.6))),
                  const SizedBox(height: 6),
                  Text(_updateInfo!.notes, style: TextStyle(fontSize: 12, color: cs.onSurface.withOpacity(0.7), height: 1.5)),
                ])),
            ],
            const SizedBox(height: 14),
            // 下载进度
            if (_downloadingUpdate) ...[
              LinearProgressIndicator(value: _downloadProgress > 0 ? _downloadProgress : null, borderRadius: BorderRadius.circular(4)),
              const SizedBox(height: 8),
              Text(_downloadProgress > 0 ? '下载中 ${(_downloadProgress * 100).toStringAsFixed(0)}%' : '准备下载...', style: TextStyle(fontSize: 12, color: cs.onSurface.withOpacity(0.5))),
              const SizedBox(height: 8),
              SizedBox(width: double.infinity, child: OutlinedButton(onPressed: () { setState(() { _downloadingUpdate = false; _downloadProgress = 0; }); }, child: const Text('取消'))),
            ] else
              SizedBox(width: double.infinity, height: 40,
                child: FilledButton.icon(
                  onPressed: _downloadAndInstall,
                  icon: const Icon(Icons.download, size: 18),
                  label: const Text('下载并安装', style: TextStyle(fontSize: 14)),
                )),
          ]),
        ] else
          _card(cs, [
            Row(children: [
              Icon(Icons.check_circle, size: 20, color: const Color(0xFF34C759)),
              const SizedBox(width: 10),
              Text('已是最新版本', style: TextStyle(fontSize: 14, color: cs.onSurface.withOpacity(0.7))),
            ]),
          ]),
      ],
    ]);
  }

  Future<void> _checkUpdate() async {
    setState(() { _checkingUpdate = true; _updateInfo = null; });
    final info = await UpdateService.checkUpdate();
    if (mounted) setState(() { _checkingUpdate = false; _updateInfo = info; });
  }

  Future<void> _downloadAndInstall() async {
    if (_updateInfo == null) return;
    setState(() { _downloadingUpdate = true; _downloadProgress = 0; });
    final path = await UpdateService.downloadUpdate(_updateInfo!, onProgress: (p) {
      if (mounted) setState(() => _downloadProgress = p);
    });
    if (mounted) {
      setState(() { _downloadingUpdate = false; _downloadProgress = 0; });
      if (path != null) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('下载完成，正在打开安装包...')));
        await UpdateService.openInstaller(path);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('下载失败，请手动下载')));
      }
    }
  }

  // Helpers
  void _saveSync() {
    SyncService.instance.configure(SyncConfig(serverUrl: _serverCtl.text.trim(), username: _userCtl.text.trim(), appPassword: _passCtl.text.trim(), remotePath: _pathCtl.text.trim().isEmpty ? '/CocoDense/vault.json' : _pathCtl.text.trim()));
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('已保存')));
  }
  Future<void> _test() async { setState(() { _testing = true; _testResult = null; }); _saveSync(); final ok = await SyncService.instance.testConnection(); if (mounted) setState(() { _testing = false; _testResult = ok ? '连接成功' : '连接失败'; }); }
  Future<void> _upload() async { setState(() => _uploading = true); final ok = await SyncService.instance.uploadVault(await VaultService.instance.encryptCurrentVault()); if (mounted) { setState(() => _uploading = false); ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(ok ? '已上传' : '失败'))); } }
  Future<void> _download() async {
    setState(() => _downloading = true);
    try {
      final p = await SyncService.instance.downloadVault(VaultService.instance.masterPassword ?? '', dataKey: VaultService.instance.dataKey ?? '').timeout(const Duration(seconds: 60));
      if (mounted) {
        setState(() => _downloading = false);
        if (p != null) {
          VaultService.instance.applyDownloadedVault(p);
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('已下载并应用')));
        } else {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('下载失败')));
        }
      }
    } catch (e) {
      if (mounted) { setState(() => _downloading = false); ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('下载超时: $e'))); }
    }
  }

  Widget _card(ColorScheme cs, List<Widget> children) => Container(padding: const EdgeInsets.all(12), margin: const EdgeInsets.only(bottom: 12),
    decoration: BoxDecoration(color: cs.surface, borderRadius: BorderRadius.circular(10), border: Border.all(color: cs.outline.withOpacity(0.2))),
    child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: children));

  Widget _input(String label, TextEditingController ctl, IconData icon, {String? hint, bool obscure = false, Widget? suffix}) {
    final cs = Theme.of(context).colorScheme;
    return Padding(padding: const EdgeInsets.only(bottom: 10),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label, style: TextStyle(fontSize: 11, color: cs.onSurface.withOpacity(0.45))),
        const SizedBox(height: 4),
        SizedBox(height: 38, child: TextField(controller: ctl, obscureText: obscure, style: const TextStyle(fontSize: 13),
          decoration: InputDecoration(prefixIcon: Icon(icon, size: 15, color: cs.onSurface.withOpacity(0.3)), suffixIcon: suffix, hintText: hint,
            isDense: true, contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: cs.outline.withOpacity(0.3)))))),
      ]));
  }

  Widget _action(IconData icon, String title, VoidCallback? onTap, {bool loading = false}) {
    final cs = Theme.of(context).colorScheme;
    return InkWell(onTap: onTap, borderRadius: BorderRadius.circular(8),
      child: Padding(padding: const EdgeInsets.symmetric(vertical: 8),
        child: Row(children: [
          Icon(icon, size: 18, color: cs.primary), const SizedBox(width: 10),
          Expanded(child: Text(title, style: TextStyle(fontSize: 13, color: cs.onSurface.withOpacity(0.7)))),
          if (loading) const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
          else Icon(Icons.chevron_right, size: 18, color: cs.onSurface.withOpacity(0.2)),
        ])));
  }
}
