import { Notice } from 'obsidian'
import type InkpressPlugin from '../main.js'
import { validateOSSConfig } from '../settings/validator.js'
import { createVaultAdapter } from '../fs/vault-adapter.js'
import { publish } from '../publish/publisher.js'
import { preview as runPreview } from '../publish/preview.js'
import { ProgressModal } from './progress-modal.js'
import { ReportModal } from './report-modal.js'
import type { PublishSnapshot } from '../publish/state.js'

const BUY_ME_A_COFFEE_URL = 'https://buymeacoffee.com/fangbinwei'

export function registerCommands(plugin: InkpressPlugin) {
  plugin.addCommand({ id: 'publish', name: 'Publish site', callback: () => runPublish(plugin) })
  plugin.addCommand({ id: 'preview', name: 'Preview publish', callback: () => runPreviewCommand(plugin) })
  plugin.addCommand({ id: 'support', name: 'Support this plugin', callback: () => window.open(BUY_ME_A_COFFEE_URL, '_blank') })
}

async function runPublish(plugin: InkpressPlugin) {
  const { settings } = plugin
  const validation = validateOSSConfig(settings.oss)
  if (!validation.valid) { new Notice(`Configuration error: ${validation.error}`); return }
  if (settings.publishDirs.length === 0) { new Notice('No publish directories configured. Go to Settings → Inkpress.'); return }

  const fs = createVaultAdapter(plugin.app.vault)
  const priorSnapshot = await loadSnapshot(plugin)
  const progressModal = new ProgressModal(plugin.app)
  progressModal.open()

  try {
    const result = await publish(settings, fs, priorSnapshot, {
      onRenderProgress: (c, t) => progressModal.updateRender(c, t),
      onUploadProgress: (c, t) => progressModal.updateUpload(c, t),
    })
    progressModal.close()
    await saveSnapshot(plugin, result.snapshot)

    if (settings.notificationLevel === 'always' ||
        (settings.notificationLevel === 'error-only' && result.report.uploadErrors.length > 0)) {
      new ReportModal(plugin.app, result.report, false).open()
    } else {
      new Notice(`Published ${result.report.uploaded} files`)
    }
  } catch (e) {
    progressModal.close()
    new Notice(`Publish failed: ${e instanceof Error ? e.message : String(e)}`)
  }
}

async function runPreviewCommand(plugin: InkpressPlugin) {
  const { settings } = plugin
  const validation = validateOSSConfig(settings.oss)
  if (!validation.valid) { new Notice(`Configuration error: ${validation.error}`); return }
  if (settings.publishDirs.length === 0) { new Notice('No publish directories configured.'); return }

  const fs = createVaultAdapter(plugin.app.vault)
  const priorSnapshot = await loadSnapshot(plugin)

  try {
    new Notice('Running preview...')
    const report = await runPreview(settings, fs, priorSnapshot)
    new ReportModal(plugin.app, report, true).open()
  } catch (e) {
    new Notice(`Preview failed: ${e instanceof Error ? e.message : String(e)}`)
  }
}

const SNAPSHOT_PATH = 'publish-state.json'

async function loadSnapshot(plugin: InkpressPlugin): Promise<PublishSnapshot | null> {
  try {
    const data = await plugin.app.vault.adapter.read(`${plugin.manifest.dir}/${SNAPSHOT_PATH}`)
    const parsed = JSON.parse(data)
    if (parsed.version !== 1) return null
    return parsed
  } catch { return null }
}

async function saveSnapshot(plugin: InkpressPlugin, snapshot: PublishSnapshot): Promise<void> {
  await plugin.app.vault.adapter.write(`${plugin.manifest.dir}/${SNAPSHOT_PATH}`, JSON.stringify(snapshot, null, 2))
}
