import { App, PluginSettingTab, Setting, FuzzySuggestModal, TFolder, Notice } from 'obsidian'
import type InkpressPlugin from '../main.js'
import { OSS_REGIONS } from './types.js'
import { detectRootAccountKey } from './validator.js'
import { runPublish, runPreviewCommand } from '../ui/commands.js'

const KOFI_URL = 'https://ko-fi.com/fangbinwei'

export class InkpressSettingTab extends PluginSettingTab {
  plugin: InkpressPlugin

  constructor(app: App, plugin: InkpressPlugin) {
    super(app, plugin)
    this.plugin = plugin
  }

  display(): void {
    const { containerEl } = this
    containerEl.empty()

    // OSS Configuration
    containerEl.createEl('h2', { text: 'OSS Configuration' })

    new Setting(containerEl)
      .setName('AccessKey ID')
      .addText(text => text
        .setPlaceholder('LTAI...')
        .setValue(this.plugin.settings.oss.accessKeyId)
        .onChange(async (value) => {
          this.plugin.settings.oss.accessKeyId = value
          await this.plugin.saveSettings()
        }))

    new Setting(containerEl)
      .setName('AccessKey Secret')
      .addText(text => {
        text.inputEl.type = 'password'
        text.setPlaceholder('Your AccessKey Secret')
          .setValue(this.plugin.settings.oss.accessKeySecret)
          .onChange(async (value) => {
            this.plugin.settings.oss.accessKeySecret = value
            await this.plugin.saveSettings()
          })
      })

    if (this.plugin.settings.oss.accessKeyId && detectRootAccountKey(this.plugin.settings.oss.accessKeyId)) {
      const warningEl = containerEl.createDiv({ cls: 'inkpress-warning' })
      warningEl.createEl('p', { text: 'You may be using a root account AccessKey. We recommend creating a RAM sub-account with minimal permissions.' })
      warningEl.createEl('a', { text: 'How to create a RAM sub-account', href: 'https://ram.console.aliyun.com/users' })
    }

    new Setting(containerEl)
      .setName('Region')
      .addDropdown(dropdown => {
        for (const region of OSS_REGIONS) dropdown.addOption(region.value, region.label)
        dropdown.setValue(this.plugin.settings.oss.region)
          .onChange(async (value) => {
            this.plugin.settings.oss.region = value
            await this.plugin.saveSettings()
          })
      })

    new Setting(containerEl)
      .setName('Bucket')
      .addText(text => text
        .setPlaceholder('my-bucket')
        .setValue(this.plugin.settings.oss.bucket)
        .onChange(async (value) => {
          this.plugin.settings.oss.bucket = value
          await this.plugin.saveSettings()
        }))

    new Setting(containerEl)
      .setName('Path prefix')
      .setDesc('Optional prefix for all uploaded files (e.g. "blog/")')
      .addText(text => text
        .setValue(this.plugin.settings.oss.prefix)
        .onChange(async (value) => {
          this.plugin.settings.oss.prefix = value
          await this.plugin.saveSettings()
        }))

    new Setting(containerEl)
      .setName('Custom domain')
      .setDesc('Your domain bound to the OSS bucket (e.g. "notes.example.com")')
      .addText(text => text
        .setPlaceholder('notes.example.com')
        .setValue(this.plugin.settings.oss.customDomain)
        .onChange(async (value) => {
          this.plugin.settings.oss.customDomain = value
          await this.plugin.saveSettings()
        }))

    new Setting(containerEl)
      .setName('Test connection')
      .setDesc('Verify your OSS configuration')
      .addButton(button => button
        .setButtonText('Test')
        .onClick(async () => {
          button.setButtonText('Testing...')
          button.setDisabled(true)
          try {
            const result = await this.plugin.testOSSConnection()
            if (result.websiteConfigured) {
              new Notice('OSS connection successful! Static website hosting configured.')
            } else {
              new Notice(`OSS connected, but couldn't set static website config: ${result.websiteError}`)
            }
          } catch (e) {
            new Notice(`OSS connection failed: ${e instanceof Error ? e.message : String(e)}`)
          } finally {
            button.setButtonText('Test')
            button.setDisabled(false)
          }
        }))

    // Publish Directories
    containerEl.createEl('h2', { text: 'Publish Directories' })

    for (let i = 0; i < this.plugin.settings.publishDirs.length; i++) {
      new Setting(containerEl)
        .setName(this.plugin.settings.publishDirs[i])
        .addExtraButton(button => button
          .setIcon('trash-2')
          .setTooltip('Remove')
          .onClick(async () => {
            this.plugin.settings.publishDirs.splice(i, 1)
            await this.plugin.saveSettings()
            this.display()
          }))
    }

    new Setting(containerEl)
      .addButton(button => button
        .setButtonText('+ Add Directory')
        .onClick(() => {
          new FolderSuggestModal(this.app, async (folder) => {
            if (!this.plugin.settings.publishDirs.includes(folder)) {
              this.plugin.settings.publishDirs.push(folder)
              await this.plugin.saveSettings()
              this.display()
            }
          }).open()
        }))

    // Rendering
    containerEl.createEl('h2', { text: 'Rendering' })

    new Setting(containerEl)
      .setName('Upload mode')
      .addDropdown(dropdown => dropdown
        .addOption('html', 'HTML only')
        .addOption('html+md', 'HTML + source Markdown')
        .setValue(this.plugin.settings.uploadMode)
        .onChange(async (value: string) => {
          this.plugin.settings.uploadMode = value as 'html' | 'html+md'
          await this.plugin.saveSettings()
        }))

    new Setting(containerEl)
      .setName('Dead links')
      .addDropdown(dropdown => dropdown
        .addOption('silent', 'Silent (render as plain text)')
        .addOption('marked', 'Marked (red strikethrough style)')
        .setValue(this.plugin.settings.deadLinkPolicy)
        .onChange(async (value: string) => {
          this.plugin.settings.deadLinkPolicy = value as 'silent' | 'marked'
          await this.plugin.saveSettings()
        }))

    // Notifications
    containerEl.createEl('h2', { text: 'Notifications' })

    new Setting(containerEl)
      .setName('Notification level')
      .addDropdown(dropdown => dropdown
        .addOption('always', 'Always notify')
        .addOption('error-only', 'Errors only')
        .addOption('silent', 'Silent (log only)')
        .setValue(this.plugin.settings.notificationLevel)
        .onChange(async (value: string) => {
          this.plugin.settings.notificationLevel = value as 'always' | 'error-only' | 'silent'
          await this.plugin.saveSettings()
        }))

    // Actions
    containerEl.createEl('h2', { text: 'Actions' })

    new Setting(containerEl)
      .setName('Preview')
      .setDesc('Show what would be uploaded, deleted, and skipped — nothing is sent to OSS.')
      .addButton(button => button
        .setButtonText('Preview')
        .onClick(() => runPreviewCommand(this.plugin)))

    new Setting(containerEl)
      .setName('Publish')
      .setDesc('Render and upload to OSS now.')
      .addButton(button => button
        .setButtonText('Publish')
        .setCta()
        .onClick(() => runPublish(this.plugin)))

    // Support
    containerEl.createEl('h2', { text: 'Support' })

    const donateSetting = new Setting(containerEl)
      .setName('Donate')
      .setDesc('If you like this Plugin, consider donating to support continued development.')

    const kofiLink = donateSetting.controlEl.createEl('a', {
      href: KOFI_URL,
      attr: { target: '_blank', rel: 'noopener' },
    })
    kofiLink.createEl('img', {
      attr: {
        src: 'https://storage.ko-fi.com/cdn/kofi6.png?v=6',
        alt: 'Buy Me a Coffee at ko-fi.com',
        height: '36',
        style: 'border:0;height:36px;',
      },
    })
  }
}

class FolderSuggestModal extends FuzzySuggestModal<string> {
  private onSelect: (folder: string) => void

  constructor(app: App, onSelect: (folder: string) => void) {
    super(app)
    this.onSelect = onSelect
  }

  getItems(): string[] {
    const folders: string[] = []
    const recurse = (folder: TFolder) => {
      if (folder.path && folder.path !== '/') folders.push(folder.path)
      for (const child of folder.children) {
        if (child instanceof TFolder) recurse(child)
      }
    }
    recurse(this.app.vault.getRoot())
    return folders
  }

  getItemText(item: string): string { return item }
  onChooseItem(item: string): void { this.onSelect(item) }
}
