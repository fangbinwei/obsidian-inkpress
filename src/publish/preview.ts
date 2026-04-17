import { renderSite, DefaultTheme } from 'inkpress-renderer'
import type { PublishReport, FileSystemAdapter } from 'inkpress-renderer'
import type { InkpressSettings } from '../settings/types.js'
import { PublishState } from './state.js'
import type { PublishSnapshot } from './state.js'

export interface PreviewReport extends PublishReport {
  willUpload: number
  willDelete: number
  willDeletePaths: string[]
}

export async function preview(
  settings: InkpressSettings,
  fs: FileSystemAdapter,
  priorSnapshot: PublishSnapshot | null,
): Promise<PreviewReport> {
  const renderResult = await renderSite({
    vaultPath: '.',
    publishDirs: settings.publishDirs,
    theme: new DefaultTheme(),
    uploadMode: settings.uploadMode,
    deadLinkPolicy: settings.deadLinkPolicy,
    fs,
  })

  const state = new PublishState(priorSnapshot)
  const diff = state.diff(renderResult.files)

  return {
    ...renderResult.report,
    willUpload: diff.toUpload.length,
    willDelete: diff.toDelete.length,
    willDeletePaths: diff.toDelete,
  }
}
