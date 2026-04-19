import { type App, Modal } from 'obsidian'

export class ProgressModal extends Modal {
  private renderBar!: HTMLElement
  private renderText!: HTMLElement
  private uploadBar!: HTMLElement
  private uploadText!: HTMLElement
  private cancelled = false

  constructor(
    app: App,
    private onCancel?: () => void,
  ) {
    super(app)
  }

  onOpen() {
    const { contentEl } = this
    contentEl.empty()
    contentEl.createEl('h3', { text: 'Publishing...' })

    contentEl.createEl('div', {
      text: 'Rendering',
      cls: 'inkpress-progress-label',
    })
    const renderContainer = contentEl.createDiv({
      cls: 'inkpress-progress-container',
    })
    this.renderBar = renderContainer.createDiv({ cls: 'inkpress-progress-bar' })
    this.renderText = contentEl.createDiv({ cls: 'inkpress-progress-text' })

    contentEl.createEl('div', {
      text: 'Uploading',
      cls: 'inkpress-progress-label',
    })
    const uploadContainer = contentEl.createDiv({
      cls: 'inkpress-progress-container',
    })
    this.uploadBar = uploadContainer.createDiv({ cls: 'inkpress-progress-bar' })
    this.uploadText = contentEl.createDiv({ cls: 'inkpress-progress-text' })

    const cancelBtn = contentEl.createEl('button', { text: 'Cancel' })
    cancelBtn.addEventListener('click', () => {
      this.cancelled = true
      this.onCancel?.()
      this.close()
    })

    contentEl.createEl('style').textContent = `
      .inkpress-progress-container { background: var(--background-modifier-border); border-radius: 4px; height: 8px; margin: 4px 0 8px; }
      .inkpress-progress-bar { background: var(--interactive-accent); height: 100%; border-radius: 4px; width: 0%; transition: width 0.2s; }
      .inkpress-progress-text { font-size: 0.85em; color: var(--text-muted); margin-bottom: 12px; }
      .inkpress-progress-label { font-weight: 600; margin-top: 8px; }
    `
  }

  updateRender(current: number, total: number) {
    const pct = total > 0 ? (current / total) * 100 : 0
    this.renderBar.style.width = `${pct}%`
    this.renderText.textContent = `${current} / ${total} files`
  }

  updateUpload(current: number, total: number) {
    const pct = total > 0 ? (current / total) * 100 : 0
    this.uploadBar.style.width = `${pct}%`
    this.uploadText.textContent = `${current} / ${total} files`
  }

  isCancelled(): boolean {
    return this.cancelled
  }

  onClose() {
    this.contentEl.empty()
  }
}
