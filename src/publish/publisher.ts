import { renderSite, DefaultTheme } from 'inkpress-renderer'
import type { PublishReport, OutputFile, FileSystemAdapter } from 'inkpress-renderer'
import type { InkpressSettings } from '../settings/types.js'
import { createOSSClient } from '../oss/client.js'
import { OSSUploader } from '../oss/uploader.js'
import { PublishState } from './state.js'
import type { PublishSnapshot } from './state.js'

export interface FullPublishReport extends PublishReport {
  uploaded: number
  deleted: number
  uploadErrors: { path: string; error: string }[]
  accessUrl: string | null
}

export interface PublishCallbacks {
  onRenderProgress?: (current: number, total: number) => void
  onUploadProgress?: (current: number, total: number) => void
  onPhase?: (phase: 'rendering' | 'diffing' | 'uploading' | 'deleting' | 'done') => void
}

export async function publish(
  settings: InkpressSettings,
  fs: FileSystemAdapter,
  priorSnapshot: PublishSnapshot | null,
  callbacks?: PublishCallbacks,
): Promise<{ report: FullPublishReport; snapshot: PublishSnapshot }> {
  callbacks?.onPhase?.('rendering')
  const renderResult = await renderSite({
    vaultPath: '.',
    publishDirs: settings.publishDirs,
    theme: new DefaultTheme(),
    uploadMode: settings.uploadMode,
    deadLinkPolicy: settings.deadLinkPolicy,
    fs,
    onProgress: (_phase, current, total) => {
      callbacks?.onRenderProgress?.(current, total)
    },
  })

  callbacks?.onPhase?.('diffing')
  const state = new PublishState(priorSnapshot)
  const diff = state.diff(renderResult.files)

  callbacks?.onPhase?.('uploading')
  const client = createOSSClient(settings.oss)
  const uploader = new OSSUploader(client, settings.oss.prefix)
  const uploadResult = await uploader.upload(diff.toUpload, callbacks?.onUploadProgress)

  callbacks?.onPhase?.('deleting')
  if (diff.toDelete.length > 0) await uploader.deleteFiles(diff.toDelete)

  const snapshot = state.createSnapshot(renderResult.files)

  let accessUrl: string | null = null
  if (settings.oss.customDomain) {
    const prefix = settings.oss.prefix ? `/${settings.oss.prefix}` : ''
    accessUrl = `https://${settings.oss.customDomain}${prefix}`
  }

  callbacks?.onPhase?.('done')

  return {
    report: {
      ...renderResult.report,
      uploaded: uploadResult.uploaded.length,
      deleted: diff.toDelete.length,
      uploadErrors: uploadResult.failed,
      accessUrl,
    },
    snapshot,
  }
}
