# Inkpress

Publish selected Obsidian vault folders as a static website to Aliyun OSS — with one click.

## Features

- **One-click publish** — run a single command from the Obsidian command palette
- **Incremental sync** — only uploads changed files, keeping deploys fast
- **Default theme** — responsive sidebar, breadcrumb navigation, and dark mode out of the box
- **Wikilink support** — `[[wikilinks]]` are resolved and rendered as HTML links
- **Dead link handling** — broken wikilinks are detected and handled gracefully
- **Publish preview (dry run)** — preview which files would be added, updated, or deleted before committing
- **Buy Me a Coffee support** — optional donation link in the published site footer

## Installation

### Method 1: BRAT (Recommended for beta)

1. Install the [BRAT plugin](https://github.com/TfTHacker/obsidian42-brat) from the Obsidian community plugins
2. In BRAT settings, click **Add Beta Plugin**
3. Enter `fangbinwei/obsidian-inkpress` and confirm

### Method 2: Manual

1. Download `main.js` and `manifest.json` from the [latest Release](https://github.com/fangbinwei/obsidian-inkpress/releases/latest)
2. Copy both files into `.obsidian/plugins/obsidian-inkpress/` in your vault
3. In Obsidian settings, go to **Community Plugins** and enable **Inkpress**

## Configuration

Open **Settings → Inkpress** and fill in:

| Setting | Description |
|---------|-------------|
| **Access Key ID** | Aliyun RAM sub-account access key |
| **Access Key Secret** | Corresponding secret |
| **Region** | OSS region (Hong Kong `oss-cn-hongkong` recommended for low latency) |
| **Bucket** | Your OSS bucket name |
| **Publish Directories** | Comma-separated vault folders to publish (e.g. `Notes,Blog`) |

## Usage

Open the command palette (`Ctrl/Cmd + P`) and run:

- **Inkpress: Publish** — render and upload all changed pages to OSS
- **Inkpress: Preview (dry run)** — show a report of what would change without uploading

## Alternatives

- **CI-based publishing** with [inkpress-render-action](https://github.com/fangbinwei/inkpress-render-action) — push to GitHub and let Actions handle the deploy
- **Renderer library** [inkpress-renderer](https://github.com/fangbinwei/inkpress-renderer) — use the render engine directly in your own tooling

---

# Inkpress（中文）

一键将选定的 Obsidian 知识库文件夹发布为静态网站到阿里云 OSS。

## 功能特性

- **一键发布** — 在 Obsidian 命令面板中执行单条命令即可完成发布
- **增量同步** — 仅上传已变更的文件，保持部署速度
- **默认主题** — 开箱即用的响应式侧边栏、面包屑导航和暗色模式
- **Wikilink 支持** — `[[双链]]` 会被解析并渲染为 HTML 链接
- **死链处理** — 检测并优雅处理失效的 wikilink
- **发布预览（干跑模式）** — 在真正提交前预览哪些文件将被新增、更新或删除
- **Buy Me a Coffee 支持** — 在发布站点页脚显示可选的打赏链接

## 安装

### 方式一：BRAT（推荐用于测试版）

1. 在 Obsidian 社区插件中安装 [BRAT 插件](https://github.com/TfTHacker/obsidian42-brat)
2. 在 BRAT 设置中点击 **Add Beta Plugin**
3. 输入 `fangbinwei/obsidian-inkpress` 并确认

### 方式二：手动安装

1. 从[最新 Release](https://github.com/fangbinwei/obsidian-inkpress/releases/latest) 下载 `main.js` 和 `manifest.json`
2. 将两个文件复制到知识库的 `.obsidian/plugins/obsidian-inkpress/` 目录下
3. 在 Obsidian 设置中进入 **第三方插件**，启用 **Inkpress**

## 配置

打开 **设置 → Inkpress** 并填写：

| 设置项 | 说明 |
|--------|------|
| **Access Key ID** | 阿里云 RAM 子账号访问密钥 ID |
| **Access Key Secret** | 对应的密钥 Secret |
| **地域（Region）** | OSS 地域（推荐使用香港 `oss-cn-hongkong` 以降低延迟） |
| **Bucket** | 你的 OSS Bucket 名称 |
| **发布目录** | 需要发布的知识库文件夹，逗号分隔（如 `Notes,Blog`） |

## 使用方法

打开命令面板（`Ctrl/Cmd + P`）并执行：

- **Inkpress: Publish** — 渲染并将所有变更页面上传到 OSS
- **Inkpress: Preview (dry run)** — 显示变更报告而不实际上传

## 替代方案

- **基于 CI 的发布**：使用 [inkpress-render-action](https://github.com/fangbinwei/inkpress-render-action) — 推送到 GitHub 后由 Actions 完成部署
- **渲染器库**：[inkpress-renderer](https://github.com/fangbinwei/inkpress-renderer) — 在自定义工具中直接使用渲染引擎
