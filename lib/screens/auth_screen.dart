import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:local_auth/local_auth.dart';
import '../services/vault_service.dart';
import '../services/sync_service.dart';

class AuthScreen extends StatefulWidget {
  final bool hasVault;
  final VoidCallback onUnlocked;
  const AuthScreen({super.key, required this.hasVault, required this.onUnlocked});
  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final _pwdCtl = TextEditingController();
  final _dkCtl = TextEditingController();
  bool _loading = false, _showPwd = true, _showDk = true, _needDk = false;
  String? _error;
  final _localAuth = LocalAuthentication();
  bool _canUseBiometric = false;

  @override
  void initState() { super.initState(); _checkDk(); _checkBiometric(); }

  Future<void> _checkDk() async {
    if (widget.hasVault && await VaultService.instance.requiresDataKey()) {
      if (mounted) setState(() => _needDk = true);
    }
  }

  Future<void> _checkBiometric() async {
    try {
      final canCheck = await _localAuth.canCheckBiometrics;
      final isDeviceSupported = await _localAuth.isDeviceSupported();
      if (mounted && canCheck && isDeviceSupported) {
        setState(() => _canUseBiometric = true);
      }
    } catch (_) {}
  }

  Future<void> _biometricUnlock() async {
    try {
      final didAuth = await _localAuth.authenticate(
        localizedReason: '解锁 Coco Dense',
        options: const AuthenticationOptions(biometricOnly: true, stickyAuth: true),
      );
      if (didAuth && mounted) {
        // 生物识别成功，尝试用保存的密码解锁
        final savedKey = await VaultService.instance.loadRememberedDataKey();
        if (savedKey != null && savedKey.isNotEmpty) {
          // 尝试用空密码 + 数据钥匙解锁（如果密码也保存了）
          // 这里简化处理：提示用户输入密码
          setState(() => _error = '指纹验证成功，请输入主密码');
        }
      }
    } catch (e) {
      if (mounted) setState(() => _error = '指纹验证失败');
    }
  }

  @override
  void dispose() { _pwdCtl.dispose(); _dkCtl.dispose(); super.dispose(); }

  Future<void> _unlock() async {
    final pwd = _pwdCtl.text.trim();
    if (pwd.isEmpty) { setState(() => _error = '请输入主密码'); return; }
    setState(() { _loading = true; _error = null; });

    final result = await VaultService.instance.unlockWithDetail(pwd, dataKey: _dkCtl.text.trim());
    if (result.success) {
      // 启动同步
      SyncService.instance.startPeriodicSync();
      widget.onUnlocked();
    } else {
      setState(() { _loading = false; _error = result.error ?? '解锁失败'; if (_error!.contains('数据钥匙')) _needDk = true; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(backgroundColor: const Color(0xFFFBFCFE),
      body: SafeArea(child: Center(child: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
        child: ConstrainedBox(constraints: const BoxConstraints(maxWidth: 380),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Container(width: 64, height: 64,
              decoration: BoxDecoration(color: const Color(0xFF007AFF).withOpacity(0.1), borderRadius: BorderRadius.circular(16),
                boxShadow: [BoxShadow(color: const Color(0xFF007AFF).withOpacity(0.15), blurRadius: 16, offset: const Offset(0, 6))]),
              child: const Icon(Icons.shield_rounded, size: 32, color: Color(0xFF007AFF))),
            const SizedBox(height: 20),
            Text('Coco Dense', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: const Color(0xFF1D1D1F), letterSpacing: -0.5)),
            const SizedBox(height: 6),
            Text(widget.hasVault ? '输入主密码解锁' : '创建主密码保护数据',
              style: const TextStyle(fontSize: 14, color: Color(0xFF6E6E73))),
            const SizedBox(height: 28),
            Container(padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0x1A3C3C43)),
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 12, offset: const Offset(0, 4))]),
              child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                _pwdField(_pwdCtl, '主密码', widget.hasVault ? '输入主密码' : '设置主密码', _obscurePwd, () => setState(() => _showPwd = !_showPwd), autofocus: true, onSubmitted: _needDk ? null : _unlock),
                if (_needDk) ...[
                  const SizedBox(height: 14),
                  _pwdField(_dkCtl, '数据钥匙', '输入数据钥匙', _showDk, () => setState(() => _showDk = !_showDk), onSubmitted: _unlock),
                ],
                if (_error != null) ...[
                  const SizedBox(height: 10),
                  Container(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
                    decoration: BoxDecoration(color: const Color(0xFFFF3B30).withOpacity(0.08), borderRadius: BorderRadius.circular(8)),
                    child: Row(children: [
                      const Icon(Icons.error_outline, size: 16, color: Color(0xFFFF3B30)),
                      const SizedBox(width: 8),
                      Expanded(child: Text(_error!, style: const TextStyle(fontSize: 13, color: Color(0xFFFF3B30)))),
                    ])),
                ],
                const SizedBox(height: 20),
                SizedBox(height: 44, child: FilledButton(onPressed: _loading ? null : _unlock,
                  child: _loading
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                        Icon(widget.hasVault ? Icons.lock_open_rounded : Icons.add_rounded, size: 18),
                        const SizedBox(width: 8),
                        Text(widget.hasVault ? '解锁' : '创建保险箱', style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
                      ]))),
                if (_canUseBiometric) ...[
                  const SizedBox(height: 12),
                  SizedBox(height: 40, child: OutlinedButton.icon(
                    onPressed: _biometricUnlock,
                    icon: const Icon(Icons.fingerprint, size: 20),
                    label: const Text('指纹解锁', style: TextStyle(fontSize: 14)),
                    style: OutlinedButton.styleFrom(
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      side: const BorderSide(color: Color(0x1A3C3C43))))),
                ],
              ]),
            ),
            const SizedBox(height: 20),
            const Text('AES-256-GCM 加密', style: TextStyle(fontSize: 12, color: Color(0xFFA1A1A6))),
          ]))))));
  }

  bool get _obscurePwd => !_showPwd;

  Widget _pwdField(TextEditingController ctl, String label, String hint, bool obscure, VoidCallback toggle, {bool autofocus = false, VoidCallback? onSubmitted}) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(label, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: Color(0xFF6E6E73))),
      const SizedBox(height: 6),
      TextField(controller: ctl, obscureText: obscure, autofocus: autofocus, style: const TextStyle(fontSize: 15),
        decoration: InputDecoration(hintText: hint,
          prefixIcon: const Icon(Icons.lock_outline, size: 18, color: Color(0xFF6E6E73)),
          suffixIcon: GestureDetector(onTap: toggle, child: Icon(obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined, size: 18, color: const Color(0xFF6E6E73))),
          filled: true, fillColor: const Color(0xEBFFFFFF),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0x1A3C3C43))),
          focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF007AFF), width: 1.5)),
          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14)),
        onSubmitted: onSubmitted != null ? (_) => onSubmitted() : null),
    ]);
  }
}
