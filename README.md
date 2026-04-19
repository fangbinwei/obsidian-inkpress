English | [简体中文](./README.zh-CN.md)

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
