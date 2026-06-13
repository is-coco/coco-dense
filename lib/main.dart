import 'package:flutter/material.dart';
import 'services/vault_service.dart';
import 'screens/auth_screen.dart';
import 'screens/vault_screen.dart';

void main() => runApp(const CocoDenseApp());

class CocoDenseApp extends StatelessWidget {
  const CocoDenseApp({super.key});
  @override
  Widget build(BuildContext context) {
    return MaterialApp(title: 'Coco Dense', debugShowCheckedModeBanner: false,
      theme: _theme(), darkTheme: _theme(), themeMode: ThemeMode.system, home: const AppRoot());
  }

  ThemeData _theme() {
    // 完全照搬电脑版 Electron CSS 变量
    const page = Color(0xFFEEF1F5);
    const window = Color(0xDDFFFFFF);      // rgba(255,255,255,0.86)
    const sidebar = Color(0xC7F4F6F9);     // rgba(244,246,249,0.78)
    const surface = Color(0xD1FFFFFF);      // rgba(255,255,255,0.82)
    const field = Color(0xEBFFFFFF);        // rgba(255,255,255,0.92)
    const text = Color(0xFF1D1D1F);
    const muted = Color(0xFF6E6E73);
    const line = Color(0x1A3C3C43);         // rgba(60,60,67,0.1)
    const lineStrong = Color(0x2E3C3C43);   // rgba(60,60,67,0.18)
    const accent = Color(0xFF007AFF);
    const accentSoft = Color(0x1A007AFF);   // rgba(0,122,255,0.1)
    const danger = Color(0xFFFF3B30);

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: const ColorScheme.light(
        primary: accent, onPrimary: Colors.white,
        primaryContainer: accentSoft, onPrimaryContainer: accent,
        error: danger, onError: Colors.white,
        surface: window, onSurface: text,
        surfaceContainerHighest: sidebar,
        outline: line, outlineVariant: line,
      ),
      scaffoldBackgroundColor: page,
      fontFamily: '.AppleSystemUIFont',
      textTheme: const TextTheme(
        headlineLarge: TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: text, letterSpacing: -0.4),
        headlineMedium: TextStyle(fontSize: 17, fontWeight: FontWeight.w600, color: text),
        titleMedium: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: text),
        bodyLarge: TextStyle(fontSize: 14, fontWeight: FontWeight.w400, color: text, height: 1.5),
        bodyMedium: TextStyle(fontSize: 13, fontWeight: FontWeight.w400, color: muted),
        bodySmall: TextStyle(fontSize: 12, fontWeight: FontWeight.w400, color: muted),
        labelSmall: TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: muted),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: window, foregroundColor: text, elevation: 0, scrolledUnderElevation: 0.5,
        titleTextStyle: TextStyle(fontSize: 17, fontWeight: FontWeight.w600, color: text, fontFamily: '.AppleSystemUIFont'),
        iconTheme: IconThemeData(color: text, size: 20),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true, fillColor: field,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: line)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: line)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: accent, width: 1.5)),
        errorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: danger)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
        isDense: true,
        labelStyle: const TextStyle(fontSize: 13, color: muted),
        hintStyle: const TextStyle(fontSize: 13, color: Color(0xFFA1A1A6)),
        errorStyle: const TextStyle(fontSize: 12),
      ),
      filledButtonTheme: FilledButtonThemeData(style: FilledButton.styleFrom(
        backgroundColor: accent, foregroundColor: Colors.white,
        minimumSize: const Size(0, 34), padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        textStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600), elevation: 0,
      )),
      outlinedButtonTheme: OutlinedButtonThemeData(style: OutlinedButton.styleFrom(
        foregroundColor: text, minimumSize: const Size(0, 34), padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 8),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        side: const BorderSide(color: line), textStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
      )),
      textButtonTheme: TextButtonThemeData(style: TextButton.styleFrom(
        foregroundColor: accent, minimumSize: const Size(0, 30), padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        textStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
      )),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating, backgroundColor: text,
        contentTextStyle: const TextStyle(color: Colors.white, fontSize: 13),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
      dividerTheme: const DividerThemeData(color: line, thickness: 0.5, space: 0),
      cardTheme: CardThemeData(
        color: window, elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10), side: const BorderSide(color: line)),
        margin: EdgeInsets.zero,
      ),
      listTileTheme: ListTileThemeData(
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        minVerticalPadding: 6,
      ),
      tooltipTheme: TooltipThemeData(
        decoration: BoxDecoration(color: text, borderRadius: BorderRadius.circular(8)),
        textStyle: const TextStyle(color: Colors.white, fontSize: 12),
      ),
      tabBarTheme: const TabBarThemeData(
        labelColor: accent, unselectedLabelColor: muted,
        labelStyle: TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
        unselectedLabelStyle: TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
        indicatorColor: accent, dividerColor: line,
      ),
    );
  }
}

class AppRoot extends StatefulWidget {
  const AppRoot({super.key});
  @override
  State<AppRoot> createState() => _AppRootState();
}

class _AppRootState extends State<AppRoot> with WidgetsBindingObserver {
  bool _init = false, _hasVault = false;
  DateTime? _lastActivity;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _check();
    _startAutoLockTimer();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused || state == AppLifecycleState.inactive) {
      // 进入后台时记录时间
      _lastActivity = DateTime.now();
    }
    if (state == AppLifecycleState.resumed) {
      // 回来时检查是否超时
      _checkAutoLock();
    }
  }

  void _startAutoLockTimer() {
    // 每30秒检查一次
    Future.doWhile(() async {
      await Future.delayed(const Duration(seconds: 30));
      if (!mounted) return false;
      _checkAutoLock();
      return true;
    });
  }

  void _checkAutoLock() {
    if (!VaultService.instance.isUnlocked) return;
    final last = _lastActivity;
    if (last == null) return;
    final elapsed = DateTime.now().difference(last);
    // 5分钟无活动自动锁定
    if (elapsed.inMinutes >= 5) {
      VaultService.instance.lock();
      setState(() {});
    }
  }

  Future<void> _check() async {
    final h = await VaultService.instance.hasVaultFile();
    if (mounted) setState(() { _hasVault = h; _init = true; });
  }

  void _handleActivity() {
    _lastActivity = DateTime.now();
  }

  @override
  Widget build(BuildContext context) {
    if (!_init) return const Scaffold(body: Center(child: CircularProgressIndicator()));
    if (VaultService.instance.isUnlocked) {
      _handleActivity();
      return VaultScreen(onLocked: () => setState(() {}));
    }
    return AuthScreen(hasVault: _hasVault, onUnlocked: () => setState(() {}));
  }
}
