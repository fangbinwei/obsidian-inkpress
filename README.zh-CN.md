[English](./README.md) | 简体中文

# Inkpress

一键将选定的 Obsidian 知识库文件夹发布为静态网站到阿里云 OSS。

![Inkpress 默认主题](./docs/preview.png)

## 默认主题

以阅读为中心：侧栏导航、面包屑、TOC、反向链接、暗色模式，按 `?` 唤出快捷键面板。三种 variant —— `technical`（默认）、`editorial`、`manuscript` —— 各配 light + dark。

## 功能特性

- **一键发布** — 在 Obsidian 命令面板中执行单条命令即可完成发布
- **增量同步** — 仅上传已变更的文件，保持部署速度
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
