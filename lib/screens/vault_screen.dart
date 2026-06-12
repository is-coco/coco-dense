import 'package:flutter/material.dart';
import '../models/vault_entry.dart';
import '../services/vault_service.dart';
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
  final Set<String> _collapsed = {}; // 收起的文件夹 ID
  List<VaultEntry>? _cache;

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
    const pScore = {'red': 3, 'yellow': 2, 'green': 1, '': 0};
    list.sort((a, b) {
      if (a.pinned != b.pinned) return a.pinned ? -1 : 1;
      if (a.favorite != b.favorite) return a.favorite ? -1 : 1;
      final pa = pScore[a.priority] ?? 1;
      final pb = pScore[b.priority] ?? 1;
      if (pa != pb) return pb.compareTo(pa);
      return b.lastUsedAt.compareTo(a.lastUsedAt);
    });
    return list;
  }

  void _invalidate() { _cache = null; setState(() {}); }

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
        // Header
        Container(padding: const EdgeInsets.fromLTRB(14, 8, 8, 8),
          decoration: const BoxDecoration(color: Color(0xC0FFFFFF), border: Border(bottom: BorderSide(color: line))),
          child: Row(children: [
            Container(width: 26, height: 26, decoration: BoxDecoration(color: accent.withOpacity(0.1), borderRadius: BorderRadius.circular(7)),
              child: const Icon(Icons.shield_rounded, size: 14, color: accent)),
            const SizedBox(width: 8),
            const Text('Coco Dense', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: text, letterSpacing: -0.3)),
            const Spacer(),
            _hBtn(Icons.create_new_folder_outlined, _showCreateFolderDialog),
            _hBtn(Icons.add_rounded, () { _open(VaultEntry(id: '${DateTime.now().millisecondsSinceEpoch.toRadixString(36)}-${DateTime.now().microsecond}', createdAt: '', updatedAt: DateTime.now().toIso8601String()), isNew: true); }),
            _hBtn(Icons.settings_outlined, () { Navigator.push(context, MaterialPageRoute(builder: (_) => const SettingsScreen())).then((_) => _invalidate()); }),
            _hBtn(Icons.lock_outline_rounded, () { VaultService.instance.lock(); widget.onLocked(); }),
          ])),
        // Search
        Padding(padding: const EdgeInsets.fromLTRB(12, 8, 12, 6),
          child: Container(height: 32, decoration: BoxDecoration(color: const Color(0xEBFFFFFF), borderRadius: BorderRadius.circular(10), border: Border.all(color: line)),
            child: Row(children: [
              const Padding(padding: EdgeInsets.only(left: 10), child: Icon(Icons.search, size: 15, color: muted)),
              const SizedBox(width: 6),
              Expanded(child: TextField(style: const TextStyle(fontSize: 13, color: text),
                decoration: const InputDecoration(hintText: '搜索...', hintStyle: TextStyle(fontSize: 13, color: Color(0xFFA1A1A6)), border: InputBorder.none, isDense: true, contentPadding: EdgeInsets.zero),
                onChanged: (v) { _query = v; _cache = null; setState(() {}); })),
            ]))),
        // List
        Expanded(child: entries.isEmpty
          ? const Center(child: Text('暂无记录', style: TextStyle(fontSize: 14, color: muted)))
          : _buildList(entries)),
      ])),
    );
  }

  Widget _hBtn(IconData icon, VoidCallback onTap) {
    return SizedBox(width: 32, height: 32, child: InkWell(onTap: onTap, borderRadius: BorderRadius.circular(8),
      child: Icon(icon, size: 18, color: const Color(0xFF6E6E73))));
  }

  Widget _buildList(List<VaultEntry> entries) {
    final folders = VaultService.instance.folders;
    final byFolder = <String, List<VaultEntry>>{};
    for (final e in entries) { byFolder.putIfAbsent(e.folderId, () => []).add(e); }

    final items = <_Item>[];
    // 按优先级排序
    final sortedFolders = [...folders]..sort((a, b) {
      const score = {'red': 3, 'yellow': 2, 'green': 1};
      final sa = score[a.priority] ?? 1;
      final sb = score[b.priority] ?? 1;
      return sb.compareTo(sa);
    });
    for (final f in sortedFolders) {
      final fe = byFolder[f.id] ?? [];
      if (fe.isEmpty && _query.isNotEmpty) continue;
      final isCollapsed = _collapsed.contains(f.id);
      items.add(_Item.folder(f, fe.length, isCollapsed));
      if (!isCollapsed) items.addAll(fe.map((e) => _Item.entry(e)));
    }
    final ungrouped = byFolder[''] ?? [];
    if (ungrouped.isNotEmpty) {
      if (folders.isNotEmpty) items.add(_Item.header('未分组'));
      items.addAll(ungrouped.map((e) => _Item.entry(e)));
    }

    return ListView.builder(
      padding: const EdgeInsets.only(bottom: 60),
      itemCount: items.length,
      itemBuilder: (ctx, i) {
        final item = items[i];
        if (item.isFolder) return _folderTile(item.folder!, item.count, item.collapsed);
        if (item.isHeader) return Padding(padding: const EdgeInsets.fromLTRB(14, 12, 14, 4),
          child: Text(item.label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF6E6E73))));
        return _entryTile(item.entry!);
      },
    );
  }

  // --- 文件夹头部 ---
  Widget _folderTile(Folder f, int count, bool collapsed) {
    return InkWell(
      onTap: () => setState(() {
        if (collapsed) { _collapsed.remove(f.id); } else { _collapsed.add(f.id); }
      }),
      onLongPress: () => _showFolderActions(f),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
        child: Row(children: [
          // 展开/收起箭头
          AnimatedRotation(turns: collapsed ? -0.25 : 0, duration: const Duration(milliseconds: 200),
            child: Icon(Icons.expand_more, size: 18, color: const Color(0xFF6E6E73).withOpacity(0.6))),
          const SizedBox(width: 4),
          // 文件夹图标
          Icon(collapsed ? Icons.folder_outlined : Icons.folder_open_outlined, size: 16, color: const Color(0xFF007AFF).withOpacity(0.6)),
          const SizedBox(width: 6),
          // 文件夹名
          Expanded(child: Row(children: [
            Text(f.name, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF1D1D1F))),
            const SizedBox(width: 6),
            if (f.priority != 'green' && f.priority.isNotEmpty)
              Container(width: 6, height: 6, decoration: BoxDecoration(
                color: f.priority == 'red' ? const Color(0xFFFF3B30) : const Color(0xFFFFB800),
                borderRadius: BorderRadius.circular(3))),
          ])),
          // 数量
          Container(padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(color: const Color(0x0D007AFF), borderRadius: BorderRadius.circular(10)),
            child: Text('$count', style: const TextStyle(fontSize: 11, color: Color(0xFF6E6E73)))),
        ]),
      ),
    );
  }

  // --- 文件夹操作菜单（美化） ---
  void _showFolderActions(Folder f) {
    showModalBottomSheet(context: context, backgroundColor: Colors.transparent, builder: (ctx) => Container(
      margin: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14)),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        // 标题
        Padding(padding: const EdgeInsets.fromLTRB(16, 14, 16, 8),
          child: Row(children: [
            Icon(Icons.folder_outlined, size: 18, color: const Color(0xFF007AFF).withOpacity(0.6)),
            const SizedBox(width: 8),
            Expanded(child: Text(f.name, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: Color(0xFF1D1D1F)))),
          ])),
        const Divider(height: 1, color: Color(0x1A3C3C43)),
        _sheetItem(Icons.edit_outlined, '重命名', const Color(0xFF007AFF), () { Navigator.pop(ctx); _renameFolder(f); }),
        _sheetItem(Icons.delete_outline, '删除', const Color(0xFFFF3B30), () { Navigator.pop(ctx); VaultService.instance.deleteFolder(f.id); _invalidate(); }),
        // 文件夹优先级
        _priorityPicker(f.priority, (p) {
          Navigator.pop(ctx);
          VaultService.instance.saveFolders(VaultService.instance.folders.map((x) => x.id == f.id ? x.copyWith(priority: p) : x).toList());
          _invalidate();
        }),
        const SizedBox(height: 8),
        // 取消按钮
        Container(width: double.infinity, margin: const EdgeInsets.fromLTRB(12, 0, 12, 12),
          child: TextButton(onPressed: () => Navigator.pop(ctx),
            style: TextButton.styleFrom(backgroundColor: const Color(0x0D000000), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              padding: const EdgeInsets.symmetric(vertical: 12)),
            child: const Text('取消', style: TextStyle(fontSize: 14, color: Color(0xFF6E6E73))))),
      ]),
    ));
  }

  Widget _sheetItem(IconData icon, String label, Color color, VoidCallback onTap) {
    return InkWell(onTap: onTap,
      child: Padding(padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
        child: Row(children: [
          Icon(icon, size: 20, color: color), const SizedBox(width: 12),
          Text(label, style: TextStyle(fontSize: 14, color: color)),
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
          return GestureDetector(
            onTap: () => onChanged(o.value),
            child: Container(margin: const EdgeInsets.only(right: 8), padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: selected ? o.color.withOpacity(0.12) : Colors.transparent,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: selected ? o.borderColor.withOpacity(0.6) : o.borderColor.withOpacity(0.2))),
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                Container(width: 6, height: 6, decoration: BoxDecoration(
                  color: o.value.isEmpty ? Colors.transparent : o.color,
                  borderRadius: BorderRadius.circular(3),
                  border: o.value.isEmpty ? Border.all(color: Colors.grey.shade400) : null)),
                const SizedBox(width: 4),
                Text(o.label, style: TextStyle(fontSize: 11, color: o.value.isEmpty ? const Color(0xFF6E6E73) : o.color, fontWeight: selected ? FontWeight.w600 : FontWeight.w400)),
              ])));
        }),
      ]));
  }


  // --- 新建文件夹（带输入框） ---
  void _showCreateFolderDialog() {
    final ctl = TextEditingController();
    showDialog(context: context, builder: (ctx) => AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      title: const Text('新建分组', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
      content: TextField(controller: ctl, autofocus: true, style: const TextStyle(fontSize: 14),
        decoration: InputDecoration(hintText: '分组名称', hintStyle: const TextStyle(color: Color(0xFFA1A1A6)),
          filled: true, fillColor: const Color(0x0D007AFF),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10)),
        onSubmitted: (v) { _submitCreateFolder(v); Navigator.pop(ctx); }),
      actions: [
        TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('取消', style: TextStyle(color: Color(0xFF6E6E73)))),
        FilledButton(onPressed: () { _submitCreateFolder(ctl.text); Navigator.pop(ctx); },
          style: FilledButton.styleFrom(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8))),
          child: const Text('创建')),
      ],
    ));
  }

  void _submitCreateFolder(String name) {
    final trimmed = name.trim();
    if (trimmed.isEmpty) {
      int i = 1;
      while (VaultService.instance.folders.any((f) => f.name == '分组$i')) i++;
      VaultService.instance.createFolder('分组$i');
    } else {
      VaultService.instance.createFolder(trimmed);
    }
    _invalidate();
  }

  // --- 条目 ---
  Widget _entryTile(VaultEntry e) {
    const text = Color(0xFF1D1D1F);
    const muted = Color(0xFF6E6E73);
    const accent = Color(0xFF007AFF);
    final initial = e.site.isNotEmpty ? e.site[0].toUpperCase() : '?';
    final pColor = e.priority == 'red' ? const Color(0xFFFF3B30) : e.priority == 'yellow' ? const Color(0xFFFFB800) : const Color(0xFF34C759);

    return InkWell(onTap: () => _open(e), onLongPress: () => _showEntryActions(e),
      child: Padding(padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
        child: Row(crossAxisAlignment: CrossAxisAlignment.center, children: [
          Container(width: 34, height: 34, decoration: BoxDecoration(color: accent.withOpacity(0.1), borderRadius: BorderRadius.circular(9)),
            child: Center(child: Text(initial, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: accent)))),
          const SizedBox(width: 10),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
            Row(children: [
              if (e.pinned) const Padding(padding: EdgeInsets.only(right: 3), child: Icon(Icons.push_pin, size: 11, color: accent)),
              if (e.favorite) const Padding(padding: EdgeInsets.only(right: 3), child: Icon(Icons.star, size: 11, color: Color(0xFFFFB800))),
              Expanded(child: Text(e.site.isEmpty ? '未命名' : e.site, maxLines: 1, overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: text))),
            ]),
            Text(e.account, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12, color: muted)),
          ])),
          if (e.priority != 'green' && e.priority.isNotEmpty)
            Container(width: 6, height: 6, margin: const EdgeInsets.only(left: 6),
              decoration: BoxDecoration(color: pColor, borderRadius: BorderRadius.circular(3))),
          const SizedBox(width: 4),
          const Icon(Icons.chevron_right, size: 16, color: Color(0xFFA1A1A6)),
        ])));
  }

  // --- 条目操作菜单（美化） ---
  void _showEntryActions(VaultEntry e) {
    const accent = Color(0xFF007AFF);
    const danger = Color(0xFFFF3B30);
    showModalBottomSheet(context: context, backgroundColor: Colors.transparent, builder: (ctx) => Container(
      margin: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14)),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        // 条目信息
        Padding(padding: const EdgeInsets.fromLTRB(16, 14, 16, 8),
          child: Row(children: [
            Container(width: 32, height: 32, decoration: BoxDecoration(color: accent.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
              child: Center(child: Text(e.site.isNotEmpty ? e.site[0].toUpperCase() : '?', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: accent)))),
            const SizedBox(width: 10),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(e.site.isEmpty ? '未命名' : e.site, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF1D1D1F))),
              Text(e.account, style: const TextStyle(fontSize: 12, color: Color(0xFF6E6E73))),
            ])),
          ])),
        const Divider(height: 1, color: Color(0x1A3C3C43)),
        // 操作
        _sheetItem(e.pinned ? Icons.push_pin_outlined : Icons.push_pin, e.pinned ? '取消置顶' : '置顶', accent, () {
          Navigator.pop(ctx); VaultService.instance.updateEntry(e.copyWith(pinned: !e.pinned, updatedAt: DateTime.now().toIso8601String())); _invalidate();
        }),
        _sheetItem(e.favorite ? Icons.star_outline : Icons.star, e.favorite ? '取消收藏' : '收藏', e.favorite ? const Color(0xFFFFB800) : accent, () {
          Navigator.pop(ctx); VaultService.instance.updateEntry(e.copyWith(favorite: !e.favorite, updatedAt: DateTime.now().toIso8601String())); _invalidate();
        }),
        _sheetItem(Icons.folder_outlined, '移到分组', accent, () { Navigator.pop(ctx); _showMoveToFolder(e); }),
        _priorityPicker(e.priority, (p) {
          Navigator.pop(ctx);
          VaultService.instance.updateEntry(e.copyWith(priority: p, updatedAt: DateTime.now().toIso8601String()));
          _invalidate();
        }),
        const Divider(height: 1, color: Color(0x1A3C3C43)),
        _sheetItem(Icons.delete_outline, '删除', danger, () { Navigator.pop(ctx); VaultService.instance.deleteEntry(e.id); _invalidate(); }),
        const SizedBox(height: 8),
        Container(width: double.infinity, margin: const EdgeInsets.fromLTRB(12, 0, 12, 12),
          child: TextButton(onPressed: () => Navigator.pop(ctx),
            style: TextButton.styleFrom(backgroundColor: const Color(0x0D000000), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              padding: const EdgeInsets.symmetric(vertical: 12)),
            child: const Text('取消', style: TextStyle(fontSize: 14, color: Color(0xFF6E6E73))))),
      ]),
    ));
  }

  // --- 移到分组（美化） ---
  void _showMoveToFolder(VaultEntry e) {
    const accent = Color(0xFF007AFF);
    final folders = VaultService.instance.folders;
    showModalBottomSheet(context: context, backgroundColor: Colors.transparent, builder: (ctx) => Container(
      margin: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14)),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        const Padding(padding: EdgeInsets.fromLTRB(16, 14, 16, 8),
          child: Text('移到分组', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: Color(0xFF1D1D1F)))),
        const Divider(height: 1, color: Color(0x1A3C3C43)),
        // 移出分组
        _folderOption(Icons.folder_off_outlined, '移出分组', e.folderId.isEmpty, () {
          Navigator.pop(ctx); VaultService.instance.moveEntryToFolder(e.id, ''); _invalidate();
        }),
        // 各分组
        ...folders.map((f) => _folderOption(Icons.folder_outlined, f.name, e.folderId == f.id, () {
          Navigator.pop(ctx); VaultService.instance.moveEntryToFolder(e.id, f.id); _invalidate();
        })),
        const Divider(height: 1, color: Color(0x1A3C3C43)),
        _sheetItem(Icons.create_new_folder_outlined, '新建分组', accent, () {
          Navigator.pop(ctx);
          _showCreateFolderDialog();
        }),
        const SizedBox(height: 8),
        Container(width: double.infinity, margin: const EdgeInsets.fromLTRB(12, 0, 12, 12),
          child: TextButton(onPressed: () => Navigator.pop(ctx),
            style: TextButton.styleFrom(backgroundColor: const Color(0x0D000000), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              padding: const EdgeInsets.symmetric(vertical: 12)),
            child: const Text('取消', style: TextStyle(fontSize: 14, color: Color(0xFF6E6E73))))),
      ]),
    ));
  }

  Widget _folderOption(IconData icon, String label, bool selected, VoidCallback onTap) {
    return InkWell(onTap: onTap,
      child: Padding(padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(children: [
          Icon(icon, size: 20, color: selected ? const Color(0xFF007AFF) : const Color(0xFF6E6E73)),
          const SizedBox(width: 12),
          Expanded(child: Text(label, style: TextStyle(fontSize: 14, color: selected ? const Color(0xFF007AFF) : const Color(0xFF1D1D1F), fontWeight: selected ? FontWeight.w600 : FontWeight.w400))),
          if (selected) const Icon(Icons.check, size: 18, color: Color(0xFF007AFF)),
        ])));
  }

  // --- 重命名文件夹 ---
  void _renameFolder(Folder f) {
    final ctl = TextEditingController(text: f.name);
    showDialog(context: context, builder: (ctx) => AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      title: const Text('重命名', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
      content: TextField(controller: ctl, autofocus: true, style: const TextStyle(fontSize: 14),
        decoration: InputDecoration(hintText: '分组名称',
          filled: true, fillColor: const Color(0x0D007AFF),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10)),
        onSubmitted: (v) { _submitRename(f, v); Navigator.pop(ctx); }),
      actions: [
        TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('取消', style: TextStyle(color: Color(0xFF6E6E73)))),
        FilledButton(onPressed: () { _submitRename(f, ctl.text); Navigator.pop(ctx); },
          style: FilledButton.styleFrom(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8))),
          child: const Text('确定')),
      ],
    ));
  }

  void _submitRename(Folder f, String name) {
    final trimmed = name.trim();
    if (trimmed.isNotEmpty && trimmed != f.name) {
      VaultService.instance.renameFolder(f.id, trimmed);
      _invalidate();
    }
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
