class VaultEntry {
  final String id;
  final String site;
  final String account;
  final String password;
  final String url;
  final String tags;
  final String notes;
  final String folderId;
  final bool favorite;
  final bool pinned;
  final String priority; // green, yellow, red
  final String createdAt;
  final String updatedAt;
  final String deletedAt;
  final String lastUsedAt;

  VaultEntry({
    required this.id,
    this.site = '',
    this.account = '',
    this.password = '',
    this.url = '',
    this.tags = '',
    this.notes = '',
    this.folderId = '',
    this.favorite = false,
    this.pinned = false,
    this.priority = 'green',
    this.createdAt = '',
    this.updatedAt = '',
    this.deletedAt = '',
    this.lastUsedAt = '',
  });

  List<String> get tagList => tags.split(',').where((t) => t.trim().isNotEmpty).map((t) => t.trim()).toList();

  factory VaultEntry.fromJson(Map<String, dynamic> json) {
    return VaultEntry(
      id: json['id'] ?? '',
      site: json['site'] ?? '',
      account: json['account'] ?? '',
      password: json['password'] ?? '',
      url: json['url'] ?? '',
      tags: json['tags'] ?? '',
      notes: json['notes'] ?? '',
      folderId: json['folderId'] ?? '',
      favorite: json['favorite'] ?? false,
      pinned: json['pinned'] ?? false,
      priority: json['priority'] ?? 'green',
      createdAt: json['createdAt'] ?? '',
      updatedAt: json['updatedAt'] ?? '',
      deletedAt: json['deletedAt'] ?? '',
      lastUsedAt: json['lastUsedAt'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id, 'site': site, 'account': account, 'password': password,
      'url': url, 'tags': tags, 'notes': notes, 'folderId': folderId,
      'favorite': favorite, 'pinned': pinned, 'priority': priority,
      'createdAt': createdAt, 'updatedAt': updatedAt, 'deletedAt': deletedAt,
      'lastUsedAt': lastUsedAt,
    };
  }

  VaultEntry copyWith({
    String? id, String? site, String? account, String? password, String? url,
    String? tags, String? notes, String? folderId, bool? favorite, bool? pinned,
    String? priority, String? createdAt, String? updatedAt, String? deletedAt,
    String? lastUsedAt,
  }) {
    return VaultEntry(
      id: id ?? this.id, site: site ?? this.site, account: account ?? this.account,
      password: password ?? this.password, url: url ?? this.url, tags: tags ?? this.tags,
      notes: notes ?? this.notes, folderId: folderId ?? this.folderId,
      favorite: favorite ?? this.favorite, pinned: pinned ?? this.pinned,
      priority: priority ?? this.priority, createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt, deletedAt: deletedAt ?? this.deletedAt,
      lastUsedAt: lastUsedAt ?? this.lastUsedAt,
    );
  }
}

class Folder {
  final String id;
  final String name;
  final String priority;

  Folder({required this.id, required this.name, this.priority = 'green'});

  factory Folder.fromJson(Map<String, dynamic> json) {
    return Folder(id: json['id'] ?? '', name: json['name'] ?? '', priority: json['priority'] ?? 'green');
  }

  Map<String, dynamic> toJson() => {'id': id, 'name': name, 'priority': priority};

  Folder copyWith({String? id, String? name, String? priority}) {
    return Folder(id: id ?? this.id, name: name ?? this.name, priority: priority ?? this.priority);
  }
}
