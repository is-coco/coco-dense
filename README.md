<p align="center">
  <img src="assets/app-icon.png" width="96" alt="Coco Dense" />
</p>

<h1 align="center">Coco Dense</h1>

<p align="center">
  <strong>本地加密的个人密码管理桌面应用</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-0.4.0-blue?style=flat-square" alt="version" />
  <img src="https://img.shields.io/badge/platform-macOS%20%7C%20Windows-lightgrey?style=flat-square" alt="platform" />
  <img src="https://img.shields.io/badge/license-proprietary-green?style=flat-square" alt="license" />
  <img src="https://img.shields.io/badge/electron-34-47848F?style=flat-square&logo=electron" alt="electron" />
</p>

<p align="center">
  所有数据均以 <strong>AES-256-GCM</strong> 加密存储于本地<br/>
  主密码通过 <strong>PBKDF2</strong> 派生密钥，明文不落盘
</p>

---

## 下载

前往 <a href="https://github.com/is-coco/coco-dense/releases/latest">Releases</a> 页面下载最新版本。

| 平台 | 文件 | 说明 |
|------|------|------|
| macOS | `Coco.Dense-x.x.x-arm64.dmg` | Apple Silicon 安装包 |
| macOS | `Coco.Dense-x.x.x-arm64-mac.zip` | Apple Silicon 便携包 |
| Windows | `Coco.Dense.x.x.x.exe` | 免安装便携版 |

---

## 功能概览

### 密码管理
- 新增、编辑、删除密码条目，支持名称、账号、密码、网址、标签、备注、优先级
- 自定义文件夹分组，支持展开收起和右键菜单管理
- 密码强度实时检测，支持一键生成高强度随机密码
- 备注区域可自由选中复制部分内容
- 拼音首字母模糊搜索，快速定位条目

### 安全机制
- AES-256-GCM 对称加密，PBKDF2 密钥派生（250,000 轮）
- 数据钥匙（Data Key）独立加密，主密码与数据钥匙双重保护
- 安全问题找回主密码，答案不明文存储
- macOS Touch ID 指纹解锁
- 剪贴板定时自动清除
- 连续解锁失败锁定机制
- 关闭窗口后自动清理内存

### 数据同步
- WebDAV 云端同步，支持坚果云等第三方服务
- 双向合并，冲突自动处理
- 加密文件导出 / 导入备份，支持手动迁移

### 界面与交互
- 左侧文件夹 + 标签 + 优先级多维筛选
- 自定义下拉菜单，支持键盘操作（上下切换、Esc 关闭、点击外部收起）
- 自定义标题栏，支持最小化、最大化、关闭
- 解锁后自动检查更新，发现新版本弹出更新日志卡片
- 更新提醒支持「今日不再提醒」，同一天同一版本只弹一次

### 自动更新
- 解锁后自动检查 GitHub Release 最新版本
- 发现新版本弹出卡片，显示当前版本与新版本号
- 更新日志区域固定高度，超出可滚动
- 支持手动检查更新和跳转发布页

---

## 技术栈

| 模块 | 技术 |
|------|------|
| 运行时 | Electron 34 |
| 前端 | HTML / CSS / JavaScript（原生） |
| 加密 | Node.js crypto（AES-256-GCM / PBKDF2 / SHA-256） |
| 拼音检索 | pinyin-pro |
| 打包 | electron-builder |
| CI/CD | GitHub Actions（自动构建 macOS + Windows） |

---

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发模式
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

仓库已配置 GitHub Actions，推送版本标签后自动构建双平台安装包并发布到 Releases。

```bash
# 修改版本号
npm version 0.5.0 --no-git-tag-version

# 提交并打标签
git add package.json package-lock.json
git commit -m "Release v0.5.0"
git tag v0.5.0
git push origin master --tags
```

构建完成后，Release 页面自动附带 macOS 和 Windows 安装包。

---

## 项目结构

```
.
├── index.html          # 页面结构
├── styles.css          # 样式
├── script.js           # 前端逻辑
├── main.js             # Electron 主进程
├── preload.js          # 预加载脚本
├── assets/             # 图标和静态资源
├── build-unpacked.ps1  # Windows 本地构建脚本
└── package.json        # 项目配置
```

---

## 许可证

本项目仅供个人学习与使用，未经授权禁止商业用途。
