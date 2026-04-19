import { Plugin } from 'obsidian'
import { createOSSClient, testConnection } from './oss/client.js'
import { ensureWebsiteConfig } from './oss/website.js'
import { DEFAULT_SETTINGS } from './settings/defaults.js'
import { InkpressSettingTab } from './settings/tab.js'
import type { InkpressSettings } from './settings/types.js'
import { registerCommands } from './ui/commands.js'

export default class InkpressPlugin extends Plugin {
  settings!: InkpressSettings

  async onload() {
    await this.loadSettings()
    this.addSettingTab(new InkpressSettingTab(this.app, this))
    registerCommands(this)
  }

  onunload() {}

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData())
  }

  async saveSettings() {
    await this.saveData(this.settings)
  }

  async testOSSConnection(): Promise<{
    websiteConfigured: boolean
    websiteError?: string
  }> {
    const client = createOSSClient(this.settings.oss)
    await testConnection(client)
    try {
      await ensureWebsiteConfig(client, this.settings.oss.bucket)
      return { websiteConfigured: true }
    } catch (e) {
      return {
        websiteConfigured: false,
        websiteError: e instanceof Error ? e.message : String(e),
      }
    }
  }
}
