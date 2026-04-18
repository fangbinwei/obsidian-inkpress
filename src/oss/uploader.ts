import type { OutputFile } from 'inkpress-renderer'

interface UploadResult {
  uploaded: string[]
  failed: { path: string; error: string }[]
}

const MAX_RETRIES = 2
const RETRY_DELAYS = [1000, 3000]

export class OSSUploader {
  constructor(private client: any, prefix: string) {
    // Normalize prefix: strip leading/trailing slashes, then add trailing slash if non-empty
    const trimmed = prefix.replace(/^\/+|\/+$/g, '')
    this.prefix = trimmed ? trimmed + '/' : ''
  }
  private prefix: string

  async upload(files: OutputFile[], onProgress?: (current: number, total: number) => void, signal?: AbortSignal): Promise<UploadResult> {
    const uploaded: string[] = []
    const failed: { path: string; error: string }[] = []

    for (let i = 0; i < files.length; i++) {
      if (signal?.aborted) break

      const file = files[i]
      const ossPath = this.prefix + file.relativePath
      const content = typeof file.content === 'string' ? Buffer.from(file.content) : file.content
      let success = false

      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        if (signal?.aborted) break
        try {
          await this.client.put(ossPath, content, {
            headers: { 'Content-Type': file.contentType, 'Cache-Control': file.cacheControl },
          })
          success = true
          break
        } catch {
          if (attempt < MAX_RETRIES) await sleep(RETRY_DELAYS[attempt])
        }
      }

      if (signal?.aborted) break
      if (success) uploaded.push(file.relativePath)
      else failed.push({ path: file.relativePath, error: 'Upload failed after retries' })
      onProgress?.(i + 1, files.length)
    }

    return { uploaded, failed }
  }

  async deleteFiles(paths: string[]): Promise<{ deleted: string[]; failed: string[] }> {
    const deleted: string[] = []
    const failed: string[] = []
    for (const path of paths) {
      try {
        await this.client.delete(this.prefix + path)
        deleted.push(path)
      } catch {
        failed.push(path)
      }
    }
    return { deleted, failed }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
