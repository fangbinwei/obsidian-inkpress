import { Plugin } from 'obsidian'
import type { InkpressSettings } from './settings/types.js'
import { DEFAULT_SETTINGS } from './settings/defaults.js'
import { InkpressSettingTab } from './settings/tab.js'
import { registerCommands } from './ui/commands.js'
import { createOSSClient, testConnection } from './oss/client.js'

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

  async testOSSConnection(): Promise<void> {
    const client = createOSSClient(this.settings.oss)
    await testConnection(client)
  }
}
