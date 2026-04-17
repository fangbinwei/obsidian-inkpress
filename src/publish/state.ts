import { createHash } from 'crypto'
import type { OutputFile } from 'inkpress-renderer'

export interface PublishSnapshot {
  version: number
  lastPublishAt: string
  files: Record<string, { contentMD5: string; size: number; publishedAt: string }>
}

export interface PublishDiff {
  toUpload: OutputFile[]
  toDelete: string[]
}

export class PublishState {
  private prior: PublishSnapshot | null

  constructor(prior: PublishSnapshot | null) {
    this.prior = prior
  }

  diff(files: OutputFile[]): PublishDiff {
    const toUpload: OutputFile[] = []
    const currentPaths = new Set<string>()

    for (const file of files) {
      currentPaths.add(file.relativePath)
      const hash = computeMD5(file.content)
      if (!this.prior) { toUpload.push(file); continue }
      const priorEntry = this.prior.files[file.relativePath]
      if (!priorEntry || priorEntry.contentMD5 !== hash) toUpload.push(file)
    }

    const toDelete: string[] = []
    if (this.prior) {
      for (const path of Object.keys(this.prior.files)) {
        if (!currentPaths.has(path)) toDelete.push(path)
      }
    }

    return { toUpload, toDelete }
  }

  createSnapshot(files: OutputFile[]): PublishSnapshot {
    const now = new Date().toISOString()
    const fileEntries: PublishSnapshot['files'] = {}
    for (const file of files) {
      const content = typeof file.content === 'string' ? file.content : file.content.toString()
      fileEntries[file.relativePath] = { contentMD5: computeMD5(file.content), size: content.length, publishedAt: now }
    }
    return { version: 1, lastPublishAt: now, files: fileEntries }
  }
}

function computeMD5(content: string | Buffer): string {
  return createHash('md5').update(content).digest('hex')
}
