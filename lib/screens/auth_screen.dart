import 'package:flutter/material.dart';
import '../services/vault_service.dart';

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

  @override
  void initState() { super.initState(); _checkDk(); }
  Future<void> _checkDk() async {
    if (widget.hasVault && await VaultService.instance.requiresDataKey()) {
      if (mounted) setState(() => _needDk = true);
    }
  }
  @override
  void dispose() { _pwdCtl.dispose(); _dkCtl.dispose(); super.dispose(); }

  Future<void> _unlock() async {
    final pwd = _pwdCtl.text.trim();
    if (pwd.isEmpty) { setState(() => _error = '请输入主密码'); return; }
    setState(() { _loading = true; _error = null; });
    final r = await VaultService.instance.unlockWithDetail(pwd, dataKey: _dkCtl.text.trim());
    if (r.success) { widget.onUnlocked(); }
    else { setState(() { _loading = false; _error = r.error ?? '解锁失败'; if (_error!.contains('数据钥匙')) _needDk = true; }); }
  }

  @override
  Widget build(BuildContext context) {
    const accent = Color(0xFF007AFF);
    const text = Color(0xFF1D1D1F);
    const muted = Color(0xFF6E6E73);
    const line = Color(0x1A3C3C43);
    const field = Color(0xEBFFFFFF);
    const danger = Color(0xFFFF3B30);

    return Scaffold(backgroundColor: const Color(0xFFFBFCFE),
      body: SafeArea(child: Center(child: SingleChildScrollView(padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
        child: ConstrainedBox(constraints: const BoxConstraints(maxWidth: 380),
          child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
            // Logo
            Container(width: 44, height: 44, decoration: BoxDecoration(color: accent.withOpacity(0.1), borderRadius: BorderRadius.circular(13)),
              child: const Icon(Icons.shield_rounded, size: 21, color: accent)),
            const SizedBox(height: 20),
            Text(widget.hasVault ? '解锁保险箱' : '创建保险箱', style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w700, color: text, letterSpacing: -0.4)),
            const SizedBox(height: 6),
            Text(widget.hasVault ? '输入主密码以继续' : '设置主密码保护您的数据', style: const TextStyle(fontSize: 13, color: muted)),
            const SizedBox(height: 24),
            // Password
            _label('主密码'),
            const SizedBox(height: 6),
            _pwdField(_pwdCtl, widget.hasVault ? '主密码' : '设置主密码', _showPwd, () => setState(() => _showPwd = !_showPwd), _needDk ? null : _unlock),
            if (_needDk) ...[
              const SizedBox(height: 14),
              _label('数据钥匙'),
              const SizedBox(height: 6),
              _pwdField(_dkCtl, '数据钥匙', _showDk, () => setState(() => _showDk = !_showDk), _unlock),
            ],
            if (_error != null) ...[
              const SizedBox(height: 10),
              Container(width: double.infinity, padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                decoration: BoxDecoration(color: danger.withOpacity(0.08), borderRadius: BorderRadius.circular(8)),
                child: Row(children: [const Icon(Icons.error_outline, size: 14, color: danger), const SizedBox(width: 6),
                  Expanded(child: Text(_error!, style: const TextStyle(fontSize: 12, color: danger)))])),
            ],
            const SizedBox(height: 20),
            SizedBox(width: double.infinity, height: 36,
              child: FilledButton(onPressed: _loading ? null : _unlock,
                child: _loading ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : Text(widget.hasVault ? '解锁' : '创建保险箱'))),
            const SizedBox(height: 16),
            const Center(child: Text('AES-256-GCM 加密保护', style: TextStyle(fontSize: 11, color: Color(0xFFA1A1A6)))),
          ]))))));
  }

  Widget _label(String t) => Text(t, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF1D1D1F)));

  Widget _pwdField(TextEditingController ctl, String hint, bool obscure, VoidCallback toggle, VoidCallback? onSub) {
    return TextField(controller: ctl, obscureText: obscure, autofocus: true, style: const TextStyle(fontSize: 14),
      decoration: InputDecoration(hintText: hint,
        prefixIcon: const Icon(Icons.lock_outline, size: 16, color: Color(0xFF6E6E73)),
        suffixIcon: GestureDetector(onTap: toggle, child: Icon(obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined, size: 16, color: const Color(0xFF6E6E73))),
        filled: true, fillColor: const Color(0xEBFFFFFF),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0x1A3C3C43))),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0x1A3C3C43))),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF007AFF), width: 1.5)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10), isDense: true),
      onSubmitted: onSub != null ? (_) => onSub() : null);
  }
}
