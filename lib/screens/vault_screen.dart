import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../models/vault_entry.dart';
import '../services/vault_service.dart';
import '../services/sync_service.dart';
import 'entry_detail_screen.dart';
import 'settings_screen.dart';

class VaultScreen extends StatefulWidget {
  final VoidCallback onLocked;
  const VaultScreen({super.key, required this.onLocked});
  @override
  State<VaultScreen> createState() => _VaultScreenState();
}

class _VaultScreenState extends State<VaultScreen> {
  String _query = '';
  String _filterTag = '';
  String _filterPriority = '';
  final Set<String> _collapsed = {};
  List<VaultEntry>? _cache;
  Timer? _syncStatusTimer;

  @override
  void initState() {
    super.initState();
    // 加载保存的同步配置
    SyncService.instance.loadConfig().then((_) {
      // 启动定时同步
      SyncService.instance.startPeriodicSync();
      // 解锁后自动拉取同步
      _autoPull();
    });
    // 定时刷新同步状态
    _syncStatusTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      if (mounted) setState(() {});
    });
  }

  Future<void> _autoPull() async {
    if (!SyncService.instance.isConfigured) return;
    final payload = await SyncService.instance.downloadVault(
      VaultService.instance.masterPassword ?? '',
      dataKey: VaultService.instance.dataKey ?? '',
    );
    if (payload != null && mounted) {
      VaultService.instance.applyDownloadedVault(payload);
      setState(() {});
    }
  }

  @override
  void dispose() {
    _syncStatusTimer?.cancel();
    super.dispose();
  }

  List<VaultEntry> get _entries {
    _cache ??= _compute();
    return _cache!;
  }

  List<VaultEntry> _compute() {
    var list = VaultService.instance.entries.toList();
    if (_query.isNotEmpty) {
      final q = _query.toLowerCase();
      list = list.where((e) => e.site.toLowerCase().contains(q) || e.account.toLowerCase().contains(q)).toList();
    }
    if (_filterTag.isNotEmpty) list = list.where((e) => e.tagList.contains(_filterTag)).toList();
    if (_filterPriority.isNotEmpty) list = list.where((e) => e.priority == _filterPriority).toList();
    list.sort((a, b) {
      if (a.pinned != b.pinned) return a.pinned ? -1 : 1;
      if (a.favorite != b.favorite) return a.favorite ? -1 : 1;
      const pScore = {'red': 3, 'yellow': 2, 'green': 1, '': 0};
      final pa = pScore[a.priority] ?? 1;
      final pb = pScore[b.priority] ?? 1;
      if (pa != pb) return pb.compareTo(pa);
      return b.lastUsedAt.compareTo(a.lastUsedAt);
    });
    return list;
  }

  void _invalidate() { _cache = null; setState(() {}); }

  Set<String> get _allTags {
    final tags = <String>{};
    for (final e in VaultService.instance.entries) { tags.addAll(e.tagList); }
    return tags;
  }

  void _open(VaultEntry e, {bool isNew = false}) async {
    await Navigator.push(context, MaterialPageRoute(builder: (_) => EntryDetailScreen(
      entry: e, isNew: isNew,
      onSaved: (u) { isNew ? VaultService.instance.addEntry(u) : VaultService.instance.updateEntry(u); },
      onDeleted: () { if (!isNew) VaultService.instance.deleteEntry(e.id); },
    )));
    _invalidate();
  }

  @override
  Widget build(BuildContext context) {
    const text = Color(0xFF1D1D1F);
    const muted = Color(0xFF6E6E73);
    const line = Color(0x1A3C3C43);
    const accent = Color(0xFF007AFF);
    const page = Color(0xFFEEF1F5);
    final entries = _entries;

    return Scaffold(backgroundColor: page,
      body: SafeArea(child: Column(children: [
        _header(accent, text, muted),
        _syncStatusBar(muted),
        _searchBar(line, text),
        if (_filterTag.isNotEmpty || _filterPriority.isNotEmpty) _activeFilters(accent),
        const Divider(height: 1, color: line),
        Expanded(child: (entries.isEmpty && VaultService.instance.folders.isEmpty) ? _empty(muted) : _list(entries)),
      ])),
    );
  }

  // 同步状态栏
  Widget _syncStatusBar(Color muted) {
    final status = SyncService.instance.status;
    final state = status.state;
    Color dotColor;
    String label;
    switch (state) {
      case SyncState.syncing:
        dotColor = const Color(0xFFFFB800);
        label = status.message.isNotEmpty ? status.message : '同步中...';
      case SyncState.success:
        dotColor = const Color(0xFF34C759);
        label = '已同步';
      case SyncState.error:
        dotColor = const Color(0xFFFF3B30);
        label = status.message.isNotEmpty ? status.message : '同步失败';
      case SyncState.warn:
        dotColor = const Color(0xFFFFB800);
        label = status.message.isNotEmpty ? status.message : '需要同步';
      default:
        dotColor = const Color(0xFF34C759);
        label = SyncService.instance.isConfigured ? '已连接' : '未配置同步';
    }

    final lastSync = status.lastSyncAt;
    final lastCheck = status.lastCheckAt;
    final timeStr = lastSync != null ? _formatTime(lastSync) : '--';
    final checkStr = lastCheck != null ? _formatTime(lastCheck) : '--';

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
      color: const Color(0xC0FFFFFF),
      child: Row(children: [
        Container(width: 8, height: 8,
          decoration: BoxDecoration(color: dotColor, borderRadius: BorderRadius.circular(4),
            boxShadow: [BoxShadow(color: dotColor.withOpacity(0.3), blurRadius: 4, spreadRadius: 1)])),
        const SizedBox(width: 8),
        Expanded(child: Text(label, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: muted))),
        Text('同步: $timeStr', style: TextStyle(fontSize: 10, color: muted.withOpacity(0.7))),
        const SizedBox(width: 8),
        Text('检查: $checkStr', style: TextStyle(fontSize: 10, color: muted.withOpacity(0.7))),
      ]),
    );
  }

  String _formatTime(DateTime t) {
    return '${t.month.toString().padLeft(2, '0')}/${t.day.toString().padLeft(2, '0')} ${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}';
  }

  Widget _header(Color accent, Color text, Color muted) {
    return Padding(padding: const EdgeInsets.fromLTRB(14, 8, 8, 4),
      child: Row(children: [
        Container(width: 26, height: 26, decoration: BoxDecoration(color: accent.withOpacity(0.1), borderRadius: BorderRadius.circular(7)),
          child: const Icon(Icons.shield_rounded, size: 14, color: Color(0xFF007AFF))),
        const SizedBox(width: 8),
        Text('Coco Dense', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: text, letterSpacing: -0.3)),
        const Spacer(),
        _hBtn(Icons.sync_rounded, '同步', () => _manualSync()),
        _hBtn(Icons.create_new_folder_outlined, '新建分组', _showCreateFolderDialog),
        _hBtn(Icons.add_rounded, '新增', () => _open(VaultEntry(id: '${DateTime.now().millisecondsSinceEpoch.toRadixString(36)}-${DateTime.now().microsecond}', createdAt: '', updatedAt: DateTime.now().toIso8601String()), isNew: true)),
        _hBtn(Icons.settings_outlined, '设置', () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SettingsScreen())).then((_) => _invalidate())),
        _hBtn(Icons.lock_outline_rounded, '锁定', () { VaultService.instance.lock(); widget.onLocked(); }),
      ]),
    );
  }

  Future<void> _manualSync() async {
    if (!SyncService.instance.isConfigured) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('请先配置云同步')));
      return;
    }
    // 先上传
    final wrapped = await VaultService.instance.encryptCurrentVault();
    await SyncService.instance.uploadVault(wrapped);
    // 再下载合并
    await _autoPull();
    setState(() {});
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('同步完成')));
  }

  Widget _hBtn(IconData icon, String tooltip, VoidCallback onTap) {
    return Tooltip(message: tooltip,
      child: SizedBox(width: 32, height: 32, child: InkWell(onTap: onTap, borderRadius: BorderRadius.circular(8),
        child: Icon(icon, size: 18, color: const Color(0xFF6E6E73)))));
  }

  Widget _searchBar(Color line, Color text) {
    return Padding(padding: const EdgeInsets.fromLTRB(12, 4, 12, 6),
      child: SizedBox(height: 32, child: TextField(style: TextStyle(fontSize: 13, color: text),
        decoration: InputDecoration(hintText: '搜索...', prefixIcon: const Icon(Icons.search, size: 16, color: Color(0xFFA1A1A6)),
          filled: true, fillColor: const Color(0xEBFFFFFF),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: line)),
          focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Color(0xFF007AFF), width: 1)),
          contentPadding: const EdgeInsets.symmetric(vertical: 0), isDense: true),
        onChanged: (v) { _query = v; _cache = null; setState(() {}); })));
  }

  Widget _activeFilters(Color accent) {
    return Padding(padding: const EdgeInsets.fromLTRB(12, 0, 12, 4),
      child: Row(children: [
        if (_filterTag.isNotEmpty) _chip(_filterTag, () => setState(() => _filterTag = '')),
        if (_filterPriority.isNotEmpty) _chip(
          _filterPriority == 'red' ? '高优先级' : _filterPriority == 'yellow' ? '中优先级' : '低优先级',
          () => setState(() => _filterPriority = '')),
      ]));
  }

  Widget _chip(String label, VoidCallback onRemove) {
    return Container(margin: const EdgeInsets.only(right: 6), padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(color: const Color(0xFF007AFF).withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Text(label, style: const TextStyle(fontSize: 11, color: Color(0xFF007AFF))),
        const SizedBox(width: 4),
        GestureDetector(onTap: onRemove, child: const Icon(Icons.close, size: 12, color: Color(0xFF007AFF))),
      ]));
  }

  Widget _empty(Color muted) {
    return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
      const Icon(Icons.lock_outline_rounded, size: 44, color: Color(0x1A007AFF)),
      const SizedBox(height: 10),
      Text('暂无记录', style: TextStyle(fontSize: 14, color: muted)),
    ]));
  }

  Widget _list(List<VaultEntry> entries) {
    final folders = VaultService.instance.folders;
    final byFolder = <String, List<VaultEntry>>{};
    for (final e in entries) { byFolder.putIfAbsent(e.folderId, () => []).add(e); }
    final items = <_Item>[];
    for (final f in folders) {
      final fe = byFolder[f.id] ?? [];
      if (fe.isEmpty && _query.isNotEmpty) continue;
      final collapsed = _collapsed.contains(f.id);
      items.add(_Item.folder(f, fe.length, collapsed));
      if (!collapsed) items.addAll(fe.map((e) => _Item.entry(e)));
    }
    final ungrouped = byFolder[''] ?? [];
    if (ungrouped.isNotEmpty) {
      if (folders.isNotEmpty) items.add(_Item.header('未分组'));
      items.addAll(ungrouped.map((e) => _Item.entry(e)));
    }
    return DragTarget<VaultEntry>(
      onWillAcceptWithDetails: (details) => true,
      onAcceptWithDetails: (details) {
        final entry = details.data;
        if (entry.folderId.isNotEmpty) {
          VaultService.instance.moveEntryToFolder(entry.id, '');
          _invalidate();
          HapticFeedback.lightImpact();
        }
      },
      builder: (context, candidateData, rejectedData) {
        return Container(
          color: candidateData.isNotEmpty ? const Color(0xFFFF3B30).withOpacity(0.05) : Colors.transparent,
          child: ListView.builder(padding: const EdgeInsets.only(bottom: 60), itemCount: items.length,
            itemBuilder: (ctx, i) { final item = items[i];
              if (item.isFolder) return _folderTile(item.folder!, item.count, item.collapsed);
              if (item.isHeader) return Padding(padding: const EdgeInsets.fromLTRB(14, 12, 14, 4),
                child: Text(item.label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF6E6E73))));
              return _entryTile(item.entry!);
            }),
        );
      },
    );
  }

  Widget _folderTile(Folder f, int count, bool collapsed) {
    return DragTarget<VaultEntry>(
      onWillAcceptWithDetails: (details) => true,
      onAcceptWithDetails: (details) {
        final entry = details.data;
        VaultService.instance.moveEntryToFolder(entry.id, f.id);
        _invalidate();
        HapticFeedback.lightImpact();
      },
      builder: (context, candidateData, rejectedData) {
        final isHovering = candidateData.isNotEmpty;
        return Container(
          decoration: BoxDecoration(
            color: isHovering ? const Color(0xFF007AFF).withOpacity(0.08) : Colors.transparent,
            borderRadius: BorderRadius.circular(8),
            border: isHovering ? Border.all(color: const Color(0xFF007AFF).withOpacity(0.3)) : null,
          ),
          child: InkWell(
            onTap: () => setState(() { collapsed ? _collapsed.remove(f.id) : _collapsed.add(f.id); }),
            onLongPress: () => _showFolderActions(f),
            child: Padding(
              padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
              child: Row(children: [
                AnimatedRotation(turns: collapsed ? -0.25 : 0, duration: const Duration(milliseconds: 200),
                  child: Icon(Icons.expand_more, size: 18, color: const Color(0xFF6E6E73).withOpacity(0.6))),
                const SizedBox(width: 4),
                Icon(collapsed ? Icons.folder_outlined : Icons.folder_open_outlined, size: 16, color: const Color(0xFF007AFF).withOpacity(0.6)),
                const SizedBox(width: 6),
                Expanded(child: Row(children: [
                  Text(f.name, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF1D1D1F))),
                  if (f.priority != 'green' && f.priority.isNotEmpty) ...[
                    const SizedBox(width: 6),
                    Container(width: 6, height: 6, decoration: BoxDecoration(
                      color: f.priority == 'red' ? const Color(0xFFFF3B30) : const Color(0xFFFFB800),
                      borderRadius: BorderRadius.circular(3))),
                  ],
                ])),
                Container(padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(color: const Color(0x0D007AFF), borderRadius: BorderRadius.circular(10)),
                  child: Text('\$count', style: const TextStyle(fontSize: 11, color: Color(0xFF6E6E73)))),
              ]),
            ),
          ),
        );
      },
    );
  }


  void _showFolderActions(Folder f) {
    showModalBottomSheet(context: context, backgroundColor: Colors.transparent, builder: (ctx) => Container(
      margin: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14)),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Padding(padding: const EdgeInsets.fromLTRB(16, 14, 16, 8),
          child: Row(children: [
            Icon(Icons.folder_outlined, size: 18, color: const Color(0xFF007AFF).withOpacity(0.6)),
            const SizedBox(width: 8),
            Expanded(child: Text(f.name, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600))),
          ])),
        const Divider(height: 1, color: Color(0x1A3C3C43)),
        _sheetItem(Icons.edit_outlined, '重命名', const Color(0xFF007AFF), () { Navigator.pop(ctx); _renameFolder(f); }),
        _sheetItem(Icons.delete_outline, '删除', const Color(0xFFFF3B30), () { Navigator.pop(ctx); VaultService.instance.deleteFolder(f.id); _invalidate(); }),
        _priorityPicker(f.priority, (p) {
          Navigator.pop(ctx);
          VaultService.instance.saveFolders(VaultService.instance.folders.map((x) => x.id == f.id ? x.copyWith(priority: p) : x).toList());
          _invalidate();
        }),
        const SizedBox(height: 8),
        _cancelBtn(ctx),
      ])));
  }

  Widget _priorityPicker(String current, ValueChanged<String> onChanged) {
    final options = [
      _Prio('', '无', Colors.white, Colors.grey.shade300),
      _Prio('green', '低', const Color(0xFF34C759), const Color(0xFF34C759)),
      _Prio('yellow', '中', const Color(0xFFFFB800), const Color(0xFFFFB800)),
      _Prio('red', '高', const Color(0xFFFF3B30), const Color(0xFFFF3B30)),
    ];
    return Padding(padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      child: Row(children: [
        const Text('优先级  ', style: TextStyle(fontSize: 12, color: Color(0xFF6E6E73))),
        ...options.map((o) {
          final selected = current == o.value || (current.isEmpty && o.value == '');
          return GestureDetector(onTap: () => onChanged(o.value),
            child: Container(margin: const EdgeInsets.only(right: 8), padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(color: selected ? o.color.withOpacity(0.12) : Colors.transparent,
                borderRadius: BorderRadius.circular(14), border: Border.all(color: selected ? o.borderColor.withOpacity(0.6) : o.borderColor.withOpacity(0.2))),
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                Container(width: 6, height: 6, decoration: BoxDecoration(
                  color: o.value.isEmpty ? Colors.transparent : o.color, borderRadius: BorderRadius.circular(3),
                  border: o.value.isEmpty ? Border.all(color: Colors.grey.shade400) : null)),
                const SizedBox(width: 4),
                Text(o.label, style: TextStyle(fontSize: 11, color: o.value.isEmpty ? const Color(0xFF6E6E73) : o.color, fontWeight: selected ? FontWeight.w600 : FontWeight.w400)),
              ])));
        }),
      ]));
  }

  void _showCreateFolderDialog() {
    final ctl = TextEditingController();
    bool submitted = false;
    showDialog(context: context, barrierDismissible: true, builder: (ctx) => AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      title: const Text('新建分组', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
      content: TextField(controller: ctl, autofocus: true, style: const TextStyle(fontSize: 14),
        decoration: InputDecoration(hintText: '分组名称',
          filled: true, fillColor: const Color(0x0D007AFF),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10))),
      actions: [
        TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('取消')),
        FilledButton(onPressed: () {
          if (submitted) return;
          submitted = true;
          _submitCreateFolder(ctl.text);
          Navigator.pop(ctx);
        }, child: const Text('创建')),
      ]));
  }

  void _submitCreateFolder(String name) {
    final trimmed = name.trim();
    if (trimmed.isEmpty) { int i = 1; while (VaultService.instance.folders.any((f) => f.name == '分组$i')) i++; VaultService.instance.createFolder('分组$i'); }
    else { VaultService.instance.createFolder(trimmed); }
    _invalidate();
  }

  void _renameFolder(Folder f) {
    final ctl = TextEditingController(text: f.name);
    bool submitted = false;
    showDialog(context: context, builder: (ctx) => AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      title: const Text('重命名'),
      content: TextField(controller: ctl, autofocus: true),
      actions: [
        TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('取消')),
        TextButton(onPressed: () {
          if (submitted) return;
          submitted = true;
          if (ctl.text.trim().isNotEmpty) { VaultService.instance.renameFolder(f.id, ctl.text.trim()); _invalidate(); }
          Navigator.pop(ctx);
        }, child: const Text('确定')),
      ]));
  }

  Widget _entryTile(VaultEntry e) {
    final initial = e.site.isNotEmpty ? e.site[0].toUpperCase() : '?';
    final pColor = e.priority == 'red' ? const Color(0xFFFF3B30) : e.priority == 'yellow' ? const Color(0xFFFFB800) : const Color(0xFF34C759);
    return LongPressDraggable<VaultEntry>(
      data: e,
      delay: const Duration(milliseconds: 300),
      feedback: Material(
        elevation: 8,
        shadowColor: const Color(0xFF007AFF).withOpacity(0.2),
        borderRadius: BorderRadius.circular(8),
        child: Container(
          width: 180,
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Row(children: [
            Container(width: 26, height: 26,
              decoration: BoxDecoration(color: const Color(0xFF007AFF), borderRadius: BorderRadius.circular(6)),
              child: Center(child: Text(initial, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Colors.white)))),
            const SizedBox(width: 8),
            Expanded(child: Text(e.site.isEmpty ? '未命名' : e.site, maxLines: 1, overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: Color(0xFF1D1D1F)))),
          ]),
        ),
      ),
      childWhenDragging: Container(
        margin: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: const Color(0xFF007AFF).withOpacity(0.04),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: const Color(0xFF007AFF).withOpacity(0.15), width: 1),
        ),
        child: Row(children: [
          Container(width: 34, height: 34,
            decoration: BoxDecoration(color: const Color(0xFF007AFF).withOpacity(0.06), borderRadius: BorderRadius.circular(9)),
            child: Center(child: Text(initial, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: const Color(0xFF007AFF).withOpacity(0.4))))),
          const SizedBox(width: 10),
          Expanded(child: Text(e.site.isEmpty ? '未命名' : e.site,
            style: TextStyle(fontSize: 14, color: const Color(0xFF1D1D1F).withOpacity(0.3)))),
        ]),
      ),
      child: InkWell(
        onTap: () => _open(e),
        onLongPress: () => _showEntryActions(e),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
          child: Row(crossAxisAlignment: CrossAxisAlignment.center, children: [
            Container(width: 34, height: 34,
              decoration: BoxDecoration(color: const Color(0xFF007AFF).withOpacity(0.1), borderRadius: BorderRadius.circular(9)),
              child: Center(child: Text(initial, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF007AFF))))),
            const SizedBox(width: 10),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
              Row(children: [
                if (e.pinned) const Padding(padding: EdgeInsets.only(right: 3), child: Icon(Icons.push_pin, size: 11, color: Color(0xFF007AFF))),
                if (e.favorite) const Padding(padding: EdgeInsets.only(right: 3), child: Icon(Icons.star, size: 11, color: Color(0xFFFFB800))),
                Expanded(child: Text(e.site.isEmpty ? '未命名' : e.site, maxLines: 1, overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: Color(0xFF1D1D1F)))),
              ]),
              Text(e.account, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12, color: Color(0xFF6E6E73))),
              if (e.tags.isNotEmpty) Padding(
                padding: const EdgeInsets.only(top: 2),
                child: Text(e.tags, maxLines: 1, overflow: TextOverflow.ellipsis,
                  style: TextStyle(fontSize: 10, color: const Color(0xFF007AFF).withOpacity(0.5)))),
            ])),
            if (e.priority != 'green' && e.priority.isNotEmpty)
              Container(width: 6, height: 6, margin: const EdgeInsets.only(left: 6),
                decoration: BoxDecoration(color: pColor, borderRadius: BorderRadius.circular(3))),
            const SizedBox(width: 4),
            const Icon(Icons.chevron_right, size: 16, color: Color(0xFFA1A1A6)),
          ]),
        ),
      ),
    );
  }


  void _showEntryActions(VaultEntry e) {
    showModalBottomSheet(context: context, backgroundColor: Colors.transparent, builder: (ctx) => Container(
      margin: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14)),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Padding(padding: const EdgeInsets.fromLTRB(16, 14, 16, 8),
          child: Row(children: [
            Container(width: 32, height: 32, decoration: BoxDecoration(color: const Color(0xFF007AFF).withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
              child: Center(child: Text(e.site.isNotEmpty ? e.site[0].toUpperCase() : '?', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF007AFF))))),
            const SizedBox(width: 10),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(e.site.isEmpty ? '未命名' : e.site, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
              Text(e.account, style: const TextStyle(fontSize: 12, color: Color(0xFF6E6E73))),
            ])),
          ])),
        const Divider(height: 1, color: Color(0x1A3C3C43)),
        _sheetItem(e.pinned ? Icons.push_pin_outlined : Icons.push_pin, e.pinned ? '取消置顶' : '置顶', const Color(0xFF007AFF), () {
          Navigator.pop(ctx); VaultService.instance.updateEntry(e.copyWith(pinned: !e.pinned, updatedAt: DateTime.now().toIso8601String())); _invalidate(); }),
        _sheetItem(e.favorite ? Icons.star_outline : Icons.star, e.favorite ? '取消收藏' : '收藏', e.favorite ? const Color(0xFFFFB800) : const Color(0xFF007AFF), () {
          Navigator.pop(ctx); VaultService.instance.updateEntry(e.copyWith(favorite: !e.favorite, updatedAt: DateTime.now().toIso8601String())); _invalidate(); }),
        _sheetItem(Icons.folder_outlined, '移到分组', const Color(0xFF007AFF), () { Navigator.pop(ctx); _moveToFolder(e); }),
        _priorityPicker(e.priority, (p) {
          Navigator.pop(ctx); VaultService.instance.updateEntry(e.copyWith(priority: p, updatedAt: DateTime.now().toIso8601String())); _invalidate();
        }),
        const Divider(height: 1, color: Color(0x1A3C3C43)),
        _sheetItem(Icons.delete_outline, '删除', const Color(0xFFFF3B30), () { Navigator.pop(ctx); VaultService.instance.deleteEntry(e.id); _invalidate(); }),
        const SizedBox(height: 8),
        _cancelBtn(ctx),
      ])));
  }

  void _moveToFolder(VaultEntry e) {
    final folders = VaultService.instance.folders;
    showModalBottomSheet(context: context, backgroundColor: Colors.transparent, builder: (ctx) => Container(
      margin: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14)),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        const Padding(padding: EdgeInsets.fromLTRB(16, 14, 16, 8), child: Text('移到分组', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600))),
        const Divider(height: 1, color: Color(0x1A3C3C43)),
        _folderOption(Icons.folder_off_outlined, '移出分组', e.folderId.isEmpty, () { Navigator.pop(ctx); VaultService.instance.moveEntryToFolder(e.id, ''); _invalidate(); }),
        ...folders.map((f) => _folderOption(Icons.folder_outlined, f.name, e.folderId == f.id, () { Navigator.pop(ctx); VaultService.instance.moveEntryToFolder(e.id, f.id); _invalidate(); })),
        const SizedBox(height: 8),
        _cancelBtn(ctx),
      ])));
  }

  Widget _folderOption(IconData icon, String label, bool selected, VoidCallback onTap) {
    return InkWell(onTap: onTap,
      child: Padding(padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(children: [
          Icon(icon, size: 20, color: selected ? const Color(0xFF007AFF) : const Color(0xFF6E6E73)),
          const SizedBox(width: 12),
          Expanded(child: Text(label, style: TextStyle(fontSize: 14, color: selected ? const Color(0xFF007AFF) : const Color(0xFF1D1D1F)))),
          if (selected) const Icon(Icons.check, size: 18, color: Color(0xFF007AFF)),
        ])));
  }

  Widget _sheetItem(IconData icon, String label, Color color, VoidCallback onTap) {
    return InkWell(onTap: onTap,
      child: Padding(padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
        child: Row(children: [Icon(icon, size: 20, color: color), const SizedBox(width: 12), Text(label, style: TextStyle(fontSize: 14, color: color))])));
  }

  Widget _cancelBtn(BuildContext ctx) {
    return Container(width: double.infinity, margin: const EdgeInsets.fromLTRB(12, 0, 12, 12),
      child: TextButton(onPressed: () => Navigator.pop(ctx),
        style: TextButton.styleFrom(backgroundColor: const Color(0x0D000000), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          padding: const EdgeInsets.symmetric(vertical: 12)),
        child: const Text('取消', style: TextStyle(fontSize: 14, color: Color(0xFF6E6E73)))));
  }
}

class _Item {
  final bool isFolder, isHeader;
  final Folder? folder;
  final VaultEntry? entry;
  final int count;
  final String label;
  final bool collapsed;
  _Item.folder(this.folder, this.count, this.collapsed) : isFolder = true, isHeader = false, entry = null, label = '';
  _Item.entry(this.entry) : isFolder = false, isHeader = false, folder = null, count = 0, label = '', collapsed = false;
  _Item.header(this.label) : isFolder = false, isHeader = true, folder = null, entry = null, count = 0, collapsed = false;
}

class _Prio {
  final String value, label;
  final Color color, borderColor;
  _Prio(this.value, this.label, this.color, this.borderColor);
}
