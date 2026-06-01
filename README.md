# Coco Dense

Coco Dense 是一个个人自用的本地密码保险箱桌面应用。当前版本以 Windows Electron 版为主，支持本地加密保存、解锁、锁定、新增/编辑/删除条目、收藏、标签、搜索、密码生成、加密文件导入和导出。

## 当前能力

- 本地保险箱文件保存到 Electron 的 `userData/vault.json`。
- 磁盘只保存 AES-256-GCM 加密后的 vault 数据。
- 主密码通过 PBKDF2 派生密钥，不会明文写入磁盘。
- 锁定后返回登录页，并清空前端状态、剪贴板计时器和主进程内存缓存。
- 支持导出加密 vault 文件，用于 OneDrive、iCloud、WebDAV 或 Syncthing 等工具同步。
- 支持导入已有加密 vault 文件恢复数据。
- 支持修改主密码，会用新主密码重新加密本地 vault。

## 开发运行

```powershell
npm.cmd install --cache .npm-cache
npm.cmd start
```

## 构建 Windows 免安装版

```powershell
powershell -ExecutionPolicy Bypass -File .\build-unpacked.ps1
```

稳定输出路径：

```text
C:\Users\coco\Desktop\codex项目\dist\Coco Dense-win32-x64\Coco Dense.exe
```

## 后续重点

- 接入真正自动同步目录或 WebDAV 同步。
- 增加主密码强度提示和错误次数限制。
- 增加定期备份提醒和冲突处理。
- 打包 macOS 版，并评估 Android 壳方案。
