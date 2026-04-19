import type { DeadLinkEntry, DeadLinkReason } from 'inkpress-renderer'
import { type App, Modal } from 'obsidian'
import type { PreviewReport } from '../publish/preview.js'
import type { FullPublishReport } from '../publish/publisher.js'

const REASON_LABELS: Record<DeadLinkReason, string> = {
  'target-missing': 'Target file does not exist',
  'not-published': 'Target exists but is outside publishDirs',
  'unsupported-asset': 'Unsupported asset type',
  ambiguous: 'Ambiguous — multiple files match',
}

const REASON_ORDER: DeadLinkReason[] = [
  'target-missing',
  'not-published',
  'ambiguous',
  'unsupported-asset',
]

export class ReportModal extends Modal {
  constructor(
    app: App,
    private report: FullPublishReport | PreviewReport,
    private isPreview: boolean,
  ) {
    super(app)
  }

  onOpen() {
    const { contentEl } = this
    contentEl.empty()

    contentEl.createEl('h3', {
      text: this.isPreview ? 'Publish Preview' : 'Publish Complete',
    })

    const summary = contentEl.createDiv()
    summary.createEl('p', { text: `Rendered: ${this.report.rendered} files` })

    if ('uploaded' in this.report) {
      summary.createEl('p', { text: `Uploaded: ${this.report.uploaded} files` })
      summary.createEl('p', { text: `Deleted: ${this.report.deleted} files` })
      if (this.report.accessUrl) {
        const urlP = summary.createEl('p')
        urlP.createEl('span', { text: 'Site URL: ' })
        urlP.createEl('a', {
          text: this.report.accessUrl,
          href: this.report.accessUrl,
        })
      }
    }

    if ('willUpload' in this.report) {
      summary.createEl('p', {
        text: `Will upload: ${this.report.willUpload} files`,
      })
      summary.createEl('p', {
        text: `Will delete: ${this.report.willDelete} files`,
      })
    }

    if (this.report.skipped.length > 0) {
      contentEl.createEl('h4', {
        text: `Skipped (${this.report.skipped.length})`,
      })
      const list = contentEl.createEl('ul')
      for (const s of this.report.skipped)
        list.createEl('li', { text: `${s.path} — ${s.reason}` })
    }

    if (this.report.deadLinks.length > 0) {
      contentEl.createEl('h4', {
        text: `Dead links (${this.report.deadLinks.length})`,
      })
      const grouped = new Map<DeadLinkReason, DeadLinkEntry[]>()
      for (const dl of this.report.deadLinks) {
        const arr = grouped.get(dl.reason) || []
        arr.push(dl)
        grouped.set(dl.reason, arr)
      }
      for (const reason of REASON_ORDER) {
        const entries = grouped.get(reason)
        if (!entries || entries.length === 0) continue
        contentEl.createEl('h5', {
          text: `${REASON_LABELS[reason]} (${entries.length})`,
        })
        contentEl.createEl('p', {
          text: entries[0].hint,
          cls: 'inkpress-dead-link-hint',
        })
        const list = contentEl.createEl('ul')
        for (const dl of entries) {
          list.createEl('li', {
            text: `${dl.sourcePath}:${dl.line} → ${dl.targetLink}`,
          })
        }
      }
    }

    if (this.report.missingImages.length > 0) {
      contentEl.createEl('h4', {
        text: `Missing images (${this.report.missingImages.length})`,
      })
      const list = contentEl.createEl('ul')
      for (const mi of this.report.missingImages)
        list.createEl('li', {
          text: `${mi.sourcePath}:${mi.line} → ${mi.imagePath}`,
        })
    }

    if ('uploadErrors' in this.report && this.report.uploadErrors.length > 0) {
      contentEl.createEl('h4', {
        text: `Upload errors (${this.report.uploadErrors.length})`,
      })
      const list = contentEl.createEl('ul')
      for (const e of this.report.uploadErrors)
        list.createEl('li', { text: `${e.path} — ${e.error}` })
    }

    contentEl
      .createEl('button', { text: 'Close' })
      .addEventListener('click', () => this.close())
  }

  onClose() {
    this.contentEl.empty()
  }
}
