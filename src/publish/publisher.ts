import type {
  FileSystemAdapter,
  OutputFile,
  PublishReport,
} from 'inkpress-renderer'
import { DefaultTheme, renderSite } from 'inkpress-renderer'
import { createOSSClient } from '../oss/client.js'
import { OSSUploader } from '../oss/uploader.js'
import type { InkpressSettings } from '../settings/types.js'
import type { PublishSnapshot } from './state.js'
import { PublishState } from './state.js'

export interface FullPublishReport extends PublishReport {
  uploaded: number
  deleted: number
  uploadErrors: { path: string; error: string }[]
  accessUrl: string | null
}

export class PublishCancelledError extends Error {
  constructor() {
    super('Publish cancelled')
  }
}

export interface PublishCallbacks {
  onRenderProgress?: (current: number, total: number) => void
  onUploadProgress?: (current: number, total: number) => void
  onPhase?: (
    phase: 'rendering' | 'diffing' | 'uploading' | 'deleting' | 'done',
  ) => void
  signal?: AbortSignal
}

export async function publish(
  settings: InkpressSettings,
  fs: FileSystemAdapter,
  priorSnapshot: PublishSnapshot | null,
  callbacks?: PublishCallbacks,
): Promise<{ report: FullPublishReport; snapshot: PublishSnapshot }> {
  const signal = callbacks?.signal

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
    signal,
  })

  if (signal?.aborted) throw new PublishCancelledError()

  callbacks?.onPhase?.('diffing')
  const state = new PublishState(priorSnapshot)
  const diff = state.diff(renderResult.files)

  if (signal?.aborted) throw new PublishCancelledError()

  callbacks?.onPhase?.('uploading')
  const client = createOSSClient(settings.oss)
  const uploader = new OSSUploader(client, settings.oss.prefix)
  const uploadResult = await uploader.upload(
    diff.toUpload,
    callbacks?.onUploadProgress,
    signal,
  )

  if (signal?.aborted) throw new PublishCancelledError()

  callbacks?.onPhase?.('deleting')
  let deletedCount = 0
  let deleteFailedPaths: string[] = []
  if (diff.toDelete.length > 0) {
    const deleteResult = await uploader.deleteFiles(diff.toDelete)
    deletedCount = deleteResult.deleted.length
    deleteFailedPaths = deleteResult.failed
  }

  // Build snapshot: include delete-failed paths so next publish retries deletion
  const snapshot = state.createSnapshot(renderResult.files, deleteFailedPaths)

  let accessUrl: string | null = null
  if (settings.oss.customDomain) {
    const trimmedPrefix = settings.oss.prefix.replace(/^\/+|\/+$/g, '')
    const prefix = trimmedPrefix ? `/${trimmedPrefix}` : ''
    accessUrl = `https://${settings.oss.customDomain}${prefix}`
  }

  callbacks?.onPhase?.('done')

  return {
    report: {
      ...renderResult.report,
      uploaded: uploadResult.uploaded.length,
      deleted: deletedCount,
      uploadErrors: uploadResult.failed,
      accessUrl,
    },
    snapshot,
  }
}
