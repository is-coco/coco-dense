import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'dart:math';
import '../models/vault_entry.dart';
import '../services/vault_service.dart';

class EntryDetailScreen extends StatefulWidget {
  final VaultEntry entry;
  final bool isNew;
  final ValueChanged<VaultEntry> onSaved;
  final VoidCallback onDeleted;
  const EntryDetailScreen({super.key, required this.entry, this.isNew = false, required this.onSaved, required this.onDeleted});
  @override
  State<EntryDetailScreen> createState() => _EntryDetailScreenState();
}

class _EntryDetailScreenState extends State<EntryDetailScreen> {
  late TextEditingController _siteCtl, _accountCtl, _passwordCtl, _urlCtl, _notesCtl;
  final _siteF = FocusNode(), _accountF = FocusNode(), _passwordF = FocusNode(), _urlF = FocusNode(), _notesF = FocusNode();
  late bool _editing;
  bool _showPwd = false;
  late String _priority;
  late bool _fav, _pin;
  late List<String> _tags;
  late String _folderId;

  @override
  void initState() {
    super.initState();
    _siteCtl = TextEditingController(text: widget.entry.site);
    _accountCtl = TextEditingController(text: widget.entry.account);
    _passwordCtl = TextEditingController(text: widget.entry.password);
    _urlCtl = TextEditingController(text: widget.entry.url);
    _notesCtl = TextEditingController(text: widget.entry.notes);
    _priority = widget.entry.priority;
    _fav = widget.entry.favorite;
    _pin = widget.entry.pinned;
    _tags = List.from(widget.entry.tagList);
    _folderId = widget.entry.folderId;
    _editing = widget.isNew;
    if (_editing) WidgetsBinding.instance.addPostFrameCallback((_) => _siteF.requestFocus());
  }

  @override
  void dispose() {
    _siteCtl.dispose(); _accountCtl.dispose(); _passwordCtl.dispose(); _urlCtl.dispose(); _notesCtl.dispose();
    _siteF.dispose(); _accountF.dispose(); _passwordF.dispose(); _urlF.dispose(); _notesF.dispose();
    super.dispose();
  }

  void _save() {
    if (_siteCtl.text.trim().isEmpty) { ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('请填写名称'))); return; }
    widget.onSaved(widget.entry.copyWith(
      site: _siteCtl.text.trim(), account: _accountCtl.text.trim(), password: _passwordCtl.text,
      url: _urlCtl.text.trim(), notes: _notesCtl.text.trim(), tags: _tags.join(','),
      priority: _priority, favorite: _fav, pinned: _pin, folderId: _folderId,
      createdAt: widget.entry.createdAt.isEmpty ? DateTime.now().toIso8601String() : widget.entry.createdAt,
      updatedAt: DateTime.now().toIso8601String(), lastUsedAt: DateTime.now().toIso8601String(),
    ));
    setState(() => _editing = false);
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('已保存')));
  }

  void _copy(String v, String l) {
    if (v.isEmpty) return;
    Clipboard.setData(ClipboardData(text: v));
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('已复制$l')));
  }

  void _genPwd() {
    const c = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#%^&*';
    _passwordCtl.text = List.generate(16, (_) => c[Random.secure().nextInt(c.length)]).join();
    _showPwd = true;
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final pColors = {'green': Colors.green, 'yellow': Colors.orange, 'red': Colors.red};
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(icon: const Icon(Icons.arrow_back_rounded, size: 22), onPressed: () => Navigator.pop(context)),
        title: Text(_editing ? (widget.isNew ? '新记录' : '编辑') : (widget.entry.site.isEmpty ? '详情' : widget.entry.site), style: const TextStyle(fontSize: 16)),
        actions: [
          if (!_editing) ...[
            IconButton(icon: Icon(_pin ? Icons.push_pin : Icons.push_pin_outlined, size: 18), onPressed: () { setState(() => _pin = !_pin); _save(); }),
            IconButton(icon: Icon(_fav ? Icons.star : Icons.star_outline, size: 18, color: _fav ? Colors.amber : null), onPressed: () { setState(() => _fav = !_fav); _save(); }),
            IconButton(icon: const Icon(Icons.edit_outlined, size: 18), onPressed: () { setState(() => _editing = true); }),
            IconButton(icon: Icon(Icons.delete_outline, size: 18, color: cs.error), onPressed: _confirmDelete),
          ],
        ],
      ),
      body: Column(children: [
        Expanded(child: ListView(padding: const EdgeInsets.all(16), children: [
          // Priority & Folder row
          if (_editing) ...[
            Row(children: [
              Text('优先级 ', style: TextStyle(fontSize: 12, color: cs.onSurface.withOpacity(0.5))),
              ...['green', 'yellow', 'red'].map((p) => GestureDetector(
                onTap: () => setState(() => _priority = p),
                child: Container(width: 26, height: 26, margin: const EdgeInsets.only(right: 6),
                  decoration: BoxDecoration(color: _priority == p ? pColors[p]!.withOpacity(0.2) : Colors.transparent,
                    borderRadius: BorderRadius.circular(13), border: Border.all(color: pColors[p]!.withOpacity(_priority == p ? 0.8 : 0.3))),
                  child: Center(child: Container(width: 8, height: 8, decoration: BoxDecoration(color: pColors[p], borderRadius: BorderRadius.circular(4))))))),
              const Spacer(),
              GestureDetector(
                onTap: _pickFolder,
                child: Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(color: const Color(0x0D007AFF), borderRadius: BorderRadius.circular(8)),
                  child: Row(mainAxisSize: MainAxisSize.min, children: [
                    Icon(Icons.folder_outlined, size: 14, color: cs.primary),
                    const SizedBox(width: 4),
                    Text(_folderId.isEmpty ? '未分组' : VaultService.instance.getFolderName(_folderId), style: TextStyle(fontSize: 12, color: cs.primary)),
                    const SizedBox(width: 2),
                    Icon(Icons.expand_more, size: 16, color: cs.primary),
                  ])),
              ),
            ]),
            const SizedBox(height: 12),
          ] else ...[
            Center(child: Row(mainAxisSize: MainAxisSize.min, children: [
              Container(width: 8, height: 8, decoration: BoxDecoration(color: pColors[_priority], borderRadius: BorderRadius.circular(4))),
              const SizedBox(width: 6),
              Text(_folderId.isEmpty ? '未分组' : VaultService.instance.getFolderName(_folderId),
                style: TextStyle(fontSize: 12, color: cs.onSurface.withOpacity(0.4))),
            ])),
            const SizedBox(height: 12),
          ],
          // Tags
          _editing ? _tagEditor(cs) : _tagDisplay(cs),
          const SizedBox(height: 16),
          // Fields
          ...(_editing
            ? [_field('名称', _siteCtl, _siteF, Icons.label, next: _accountF), _field('账号', _accountCtl, _accountF, Icons.person_outline, next: _passwordF), _pwdField(cs), _field('网址', _urlCtl, _urlF, Icons.link, next: _notesF), _notesEditField(cs)]
            : [_roField('账号', _accountCtl.text, Icons.person_outline, cs, copy: true), _roPwd(cs), _roField('网址', _urlCtl.text, Icons.link, cs, copy: true), _notesReadOnly(cs)]),
        ])),
        if (_editing) _bottomBar(cs),
      ]),
    );
  }

  Widget _tagEditor(ColorScheme cs) {
    final tagCtl = TextEditingController();
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text('标签', style: TextStyle(fontSize: 12, color: cs.onSurface.withOpacity(0.45))),
      const SizedBox(height: 4),
      Wrap(spacing: 4, runSpacing: 4, children: [
        ..._tags.map((t) => SizedBox(height: 28, child: Chip(label: Text(t, style: const TextStyle(fontSize: 11)),
          deleteIcon: const Icon(Icons.close, size: 12), onDeleted: () => setState(() => _tags.remove(t)),
          materialTapTargetSize: MaterialTapTargetSize.shrinkWrap, visualDensity: VisualDensity.compact, padding: EdgeInsets.zero))),
        SizedBox(width: 80, height: 28, child: TextField(controller: tagCtl, style: const TextStyle(fontSize: 12),
          decoration: InputDecoration(hintText: '+标签', hintStyle: TextStyle(fontSize: 11, color: cs.onSurface.withOpacity(0.3)),
            border: InputBorder.none, isDense: true, contentPadding: const EdgeInsets.symmetric(vertical: 6)),
          onSubmitted: (v) { if (v.trim().isNotEmpty && !_tags.contains(v.trim())) setState(() => _tags.add(v.trim())); tagCtl.clear(); })),
      ]),
    ]);
  }

  Widget _tagDisplay(ColorScheme cs) {
    if (_tags.isEmpty) return const SizedBox.shrink();
    return Wrap(spacing: 4, runSpacing: 4, alignment: WrapAlignment.center,
      children: _tags.map((t) => Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
        decoration: BoxDecoration(color: cs.primary.withOpacity(0.08), borderRadius: BorderRadius.circular(10)),
        child: Text(t, style: TextStyle(fontSize: 11, color: cs.primary.withOpacity(0.7))))).toList());
  }

  void _confirmDelete() {
    showDialog(context: context, builder: (ctx) => AlertDialog(title: const Text('删除'), content: const Text('确定删除？'),
      actions: [TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('取消')),
        TextButton(onPressed: () { Navigator.pop(ctx); widget.onDeleted(); Navigator.pop(context); }, child: Text('删除', style: TextStyle(color: Theme.of(context).colorScheme.error)))]));
  }

  void _pickFolder() {
    const accent = Color(0xFF007AFF);
    final folders = VaultService.instance.folders;
    showModalBottomSheet(context: context, backgroundColor: Colors.transparent, builder: (ctx) => Container(
      margin: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14)),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        const Padding(padding: EdgeInsets.fromLTRB(16, 14, 16, 8), child: Text('选择分组', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: Color(0xFF1D1D1F)))),
        const Divider(height: 1, color: Color(0x1A3C3C43)),
        _pickOption(Icons.folder_off_outlined, '未分组', _folderId.isEmpty, () { Navigator.pop(ctx); setState(() => _folderId = ''); }),
        ...folders.map((f) => _pickOption(Icons.folder_outlined, f.name, _folderId == f.id, () { Navigator.pop(ctx); setState(() => _folderId = f.id); })),
        const SizedBox(height: 8),
        Container(width: double.infinity, margin: const EdgeInsets.fromLTRB(12, 0, 12, 12),
          child: TextButton(onPressed: () => Navigator.pop(ctx),
            style: TextButton.styleFrom(backgroundColor: const Color(0x0D000000), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)), padding: const EdgeInsets.symmetric(vertical: 12)),
            child: const Text('取消', style: TextStyle(fontSize: 14, color: Color(0xFF6E6E73))))),
      ])));
  }

  Widget _pickOption(IconData icon, String label, bool selected, VoidCallback onTap) {
    const accent = Color(0xFF007AFF);
    return InkWell(onTap: onTap,
      child: Padding(padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(children: [
          Icon(icon, size: 20, color: selected ? accent : const Color(0xFF6E6E73)),
          const SizedBox(width: 12),
          Expanded(child: Text(label, style: TextStyle(fontSize: 14, color: selected ? accent : const Color(0xFF1D1D1F)))),
          if (selected) const Icon(Icons.check, size: 18, color: accent),
        ])));
  }


  Widget _field(String label, TextEditingController ctl, FocusNode focus, IconData icon, {int max = 1, FocusNode? next, bool done = false}) {
    return Padding(padding: const EdgeInsets.only(bottom: 12),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label, style: TextStyle(fontSize: 12, color: Theme.of(context).colorScheme.onSurface.withOpacity(0.45))),
        const SizedBox(height: 4),
        TextField(controller: ctl, focusNode: focus, maxLines: max, style: const TextStyle(fontSize: 14),
          textInputAction: done ? TextInputAction.done : TextInputAction.next,
          decoration: InputDecoration(prefixIcon: Icon(icon, size: 16, color: Theme.of(context).colorScheme.onSurface.withOpacity(0.3)),
            hintText: label, isDense: true, contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10)),
          onSubmitted: next != null ? (_) => next.requestFocus() : (done ? (_) => _save() : null)),
      ]));
  }

  Widget _pwdField(ColorScheme cs) {
    return Padding(padding: const EdgeInsets.only(bottom: 12),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('密码', style: TextStyle(fontSize: 12, color: cs.onSurface.withOpacity(0.45))),
        const SizedBox(height: 4),
        Row(children: [
          Expanded(child: TextField(controller: _passwordCtl, focusNode: _passwordF, obscureText: !_showPwd, style: const TextStyle(fontSize: 14),
            decoration: InputDecoration(prefixIcon: Icon(Icons.lock_outline, size: 16, color: cs.onSurface.withOpacity(0.3)),
              suffixIcon: GestureDetector(onTap: () => setState(() => _showPwd = !_showPwd),
                child: Icon(_showPwd ? Icons.visibility_off : Icons.visibility, size: 16, color: cs.onSurface.withOpacity(0.3))),
              hintText: '密码', isDense: true, contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10)),
            onSubmitted: (_) => _urlF.requestFocus())),
          const SizedBox(width: 6),
          InkWell(onTap: _genPwd, borderRadius: BorderRadius.circular(8),
            child: Padding(padding: const EdgeInsets.all(8), child: Icon(Icons.auto_fix_high, size: 18, color: cs.primary))),
        ]),
      ]));
  }

  Widget _roField(String label, String value, IconData icon, ColorScheme cs, {bool copy = false, int max = 1}) {
    return Padding(padding: const EdgeInsets.only(bottom: 10),
      child: GestureDetector(onTap: copy ? () => _copy(value, label) : null,
        child: Container(width: double.infinity, padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(color: cs.surfaceContainerHighest.withOpacity(0.3), borderRadius: BorderRadius.circular(10),
            border: Border.all(color: cs.outline.withOpacity(0.1))),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [Icon(icon, size: 13, color: cs.onSurface.withOpacity(0.3)), const SizedBox(width: 6),
              Text(label, style: TextStyle(fontSize: 11, color: cs.onSurface.withOpacity(0.35))),
              if (copy && value.isNotEmpty) ...[const Spacer(), Icon(Icons.copy, size: 12, color: cs.onSurface.withOpacity(0.2))]]),
            const SizedBox(height: 4),
            Text(value.isEmpty ? '-' : value, maxLines: max, overflow: TextOverflow.ellipsis,
              style: TextStyle(fontSize: 14, color: value.isEmpty ? cs.onSurface.withOpacity(0.2) : cs.onSurface)),
          ]))));
  }

  Widget _roPwd(ColorScheme cs) {
    final pwd = _passwordCtl.text;
    return Padding(padding: const EdgeInsets.only(bottom: 10),
      child: GestureDetector(onTap: pwd.isNotEmpty ? () => _copy(pwd, '密码') : null,
        child: Container(width: double.infinity, padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(color: cs.surfaceContainerHighest.withOpacity(0.3), borderRadius: BorderRadius.circular(10),
            border: Border.all(color: cs.outline.withOpacity(0.1))),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [Icon(Icons.lock_outline, size: 13, color: cs.onSurface.withOpacity(0.3)), const SizedBox(width: 6),
              Text('密码', style: TextStyle(fontSize: 11, color: cs.onSurface.withOpacity(0.35))),
              if (pwd.isNotEmpty) ...[const Spacer(),
                GestureDetector(onTap: () => setState(() => _showPwd = !_showPwd), child: Icon(_showPwd ? Icons.visibility_off : Icons.visibility, size: 14, color: cs.onSurface.withOpacity(0.3))),
                const SizedBox(width: 6), Icon(Icons.copy, size: 12, color: cs.onSurface.withOpacity(0.2))]]),
            const SizedBox(height: 4),
            Text(pwd.isEmpty ? '-' : (_showPwd ? pwd : '\u2022' * pwd.length), maxLines: 1,
              style: TextStyle(fontSize: 14, color: pwd.isEmpty ? cs.onSurface.withOpacity(0.2) : cs.onSurface)),
          ]))));
  }

  // 备注 - 编辑模式
  Widget _notesEditField(ColorScheme cs) {
    return Padding(padding: const EdgeInsets.only(bottom: 12),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Icon(Icons.notes, size: 14, color: cs.onSurface.withOpacity(0.4)),
          const SizedBox(width: 6),
          Text('备注', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: cs.onSurface.withOpacity(0.5))),
        ]),
        const SizedBox(height: 6),
        Container(decoration: BoxDecoration(
          color: const Color(0xEBFFFFFF),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: const Color(0x1A3C3C43)),
        ),
        child: TextField(controller: _notesCtl, focusNode: _notesF, maxLines: 6, minLines: 4, style: const TextStyle(fontSize: 14, height: 1.6, color: Color(0xFF1D1D1F)),
          textInputAction: TextInputAction.done,
          decoration: const InputDecoration(hintText: '添加备注...', hintStyle: TextStyle(color: Color(0xFFA1A1A6), fontSize: 14),
            border: InputBorder.none, contentPadding: EdgeInsets.all(12)),
          onSubmitted: (_) => _save())),
      ]));
  }

  // 备注 - 只读模式
  Widget _notesReadOnly(ColorScheme cs) {
    final notes = _notesCtl.text;
    return Padding(padding: const EdgeInsets.only(bottom: 10),
      child: GestureDetector(onTap: notes.isNotEmpty ? () => _copy(notes, '备注') : null,
        child: Container(width: double.infinity, padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: cs.surfaceContainerHighest.withOpacity(0.25),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: cs.outline.withOpacity(0.1)),
          ),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Icon(Icons.notes, size: 13, color: cs.onSurface.withOpacity(0.35)),
              const SizedBox(width: 6),
              Text('备注', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: cs.onSurface.withOpacity(0.4))),
              if (notes.isNotEmpty) ...[const Spacer(), Icon(Icons.copy, size: 12, color: cs.onSurface.withOpacity(0.2))],
            ]),
            const SizedBox(height: 8),
            Text(notes.isEmpty ? '无备注' : notes,
              style: TextStyle(fontSize: 14, height: 1.6,
                color: notes.isEmpty ? cs.onSurface.withOpacity(0.25) : cs.onSurface)),
          ]))));
  }


  Widget _bottomBar(ColorScheme cs) {
    return Container(padding: EdgeInsets.fromLTRB(16, 10, 16, MediaQuery.of(context).padding.bottom + 10),
      decoration: BoxDecoration(color: cs.surface, border: Border(top: BorderSide(color: cs.outline.withOpacity(0.15)))),
      child: Row(children: [
        Expanded(child: OutlinedButton(onPressed: widget.isNew ? () => Navigator.pop(context) : () => setState(() => _editing = false), child: const Text('取消'))),
        const SizedBox(width: 12),
        Expanded(child: FilledButton.icon(onPressed: _save, icon: const Icon(Icons.check, size: 16), label: const Text('保存'))),
      ]));
  }
}
