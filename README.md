# Coco Dense

一款本地加密的个人密码管理桌面应用，基于 Electron 构建，支持 macOS 和 Windows。

所有密码数据均以 AES-256-GCM 加密存储在本地，主密码通过 PBKDF2 派生密钥，明文不会写入磁盘。

---

## 功能特性

**密码管理**
- 新增、编辑、删除密码条目
- 支持名称、账号、密码、网址、标签、备注、优先级
- 自定义文件夹分组，支持拖拽归类
- 密码强度实时检测
- 一键生成高强度随机密码

**安全机制**
- AES-256-GCM 加密，PBKDF2 密钥派生
- 数据钥匙（Data Key）独立加密保护
- 安全问题找回主密码
- macOS Touch ID 指纹解锁
- 剪贴板自动清除
- 自动锁定

**数据同步**
- WebDAV 云端同步（支持坚果云等服务）
- 双向合并冲突处理
- 加密文件导出 / 导入备份

**界面与交互**
- 左侧文件夹 + 标签筛选
- 按标签和优先级分类过滤
- 拼音首字母模糊搜索
- 自定义下拉菜单，键盘可操作
- 解锁后自动检查更新，更新日志卡片提醒

---

## 下载安装

前往 [Releases](https://github.com/is-coco/coco-dense/releases/latest) 页面下载最新版本。

| 平台 | 格式 |
|------|------|
| macOS | `.dmg` 安装包 / `.zip` 便携包 |
| Windows | `.exe` 便携版 |

---

## 技术栈

- **运行时**：Electron
- **前端**：HTML / CSS / JavaScript
- **加密**：Node.js crypto（AES-256-GCM / PBKDF2）
- **拼音检索**：pinyin-pro
- **打包**：electron-builder
- **CI/CD**：GitHub Actions（自动构建 Win / Mac 双平台）

---

## 本地开发

**macOS**

```bash
npm install
npm start
```

**Windows**

```powershell
npm install
npm start
```

---

## 构建打包

**macOS**

```bash
npm run dist:mac
```

**Windows 便携版（免安装）**

```powershell
powershell -ExecutionPolicy Bypass -File build-unpacked.ps1
```

**Windows 单文件**

```powershell
npm run dist:win
```

---

## 发布流程

仓库已配置 GitHub Actions，推送版本标签后自动构建并发布到 Releases。

```bash
npm version 0.4.0 --no-git-tag-version
git add package.json package-lock.json
git commit -m "Release v0.4.0"
git tag v0.4.0
git push origin master --tags
```

构建完成后，GitHub Release 页面会自动附带 macOS 和 Windows 安装包。

---

## 许可证

本项目仅供个人学习与使用，未经授权禁止商业用途。
