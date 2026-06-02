# Coco Dense

Coco Dense 是一个个人自用的本地密码保险箱桌面应用。当前版本是 Electron 桌面版，支持 macOS 和 Windows，具备本地加密保存、解锁、锁定、新增/编辑/删除条目、收藏、标签、搜索、密码生成、加密文件导入和导出。

## 当前能力

- 本地保险箱文件保存到 Electron 的 `userData/vault.json`。
- 磁盘只保存 AES-256-GCM 加密后的 vault 数据。
- 主密码通过 PBKDF2 派生密钥，不会明文写入磁盘。
- 锁定后返回登录页，并清空前端状态、剪贴板计时器和主进程内存缓存。
- 支持导出加密 vault 文件，用于 OneDrive、iCloud、WebDAV 或 Syncthing 等工具同步。
- 支持导入已有加密 vault 文件恢复数据。
- 支持修改主密码，会用新主密码重新加密本地 vault。
- macOS 上支持 Touch ID 解锁，需先用主密码解锁一次后在设置里启用。

## 开发运行

macOS:

```bash
npm install
npm start
```

Windows:

```powershell
npm.cmd install --cache .npm-cache
npm.cmd start
```

## 构建 macOS 版

首次构建前如果需要重新生成 macOS 图标：

```bash
npm run icon:mac
```

构建 `.dmg` 和 `.zip`：

```bash
npm run dist:mac
```

只构建未压缩的 `.app`，适合本机快速测试：

```bash
npm run dist:mac:dir
```

常见输出路径：

```text
dist/mac*/Coco Dense.app
dist/*.dmg
dist/*.zip
```

## 构建 Windows 免安装版

```powershell
powershell -ExecutionPolicy Bypass -File .\build-unpacked.ps1
```

稳定输出路径：

```text
C:\Users\coco\Desktop\codex项目\dist\Coco Dense-win32-x64\Coco Dense.exe
```

## 发布多端安装包

这个仓库已经配置 GitHub Actions 自动发布流程：

- 手动运行 `Release Builds` 工作流：只构建 macOS 和 Windows 安装包，适合测试。
- 推送版本标签，例如 `v0.2.0`：自动构建 macOS `.dmg/.zip` 和 Windows `.exe`，并上传到同一个 GitHub Release。

发布新版本：

```bash
npm version 0.2.0 --no-git-tag-version
git add package.json package-lock.json
git commit -m "Release v0.2.0"
git tag v0.2.0
git push origin master --tags
```

发布完成后，在 GitHub 仓库的 `Releases` 页面可以同时下载不同平台的程序。

## 后续重点

- 处理正式上线前的 macOS 签名和公证。
- 升级 Electron 与打包工具，清理依赖安全审计风险。
- 继续完善 Windows 端体验和安装包形式。
- 规划 Android 端的数据协议和同步实现。
