import type { OutputFile } from 'inkpress-renderer'
import { describe, expect, it, vi } from 'vitest'
import { OSSUploader } from '../../src/oss/uploader.js'

function createMockClient() {
  return {
    put: vi.fn().mockResolvedValue({ res: { status: 200 } }),
    delete: vi.fn().mockResolvedValue({ res: { status: 204 } }),
  }
}

describe('OSSUploader', () => {
  it('uploads files with correct headers', async () => {
    const client = createMockClient()
    const uploader = new OSSUploader(client as any, '')
    const file: OutputFile = {
      relativePath: 'notes/test.html',
      content: '<h1>Test</h1>',
      contentType: 'text/html',
      cacheControl: 'no-cache',
    }
    await uploader.upload([file])
    expect(client.put).toHaveBeenCalledWith(
      'notes/test.html',
      Buffer.from('<h1>Test</h1>'),
      { headers: { 'Content-Type': 'text/html', 'Cache-Control': 'no-cache' } },
    )
  })

  it('prepends prefix to file paths', async () => {
    const client = createMockClient()
    const uploader = new OSSUploader(client as any, 'blog/')
    const file: OutputFile = {
      relativePath: 'index.html',
      content: '<h1>Home</h1>',
      contentType: 'text/html',
      cacheControl: 'no-cache',
    }
    await uploader.upload([file])
    expect(client.put).toHaveBeenCalledWith(
      'blog/index.html',
      expect.any(Buffer),
      expect.any(Object),
    )
  })

  it('normalizes prefix variants', async () => {
    const client = createMockClient()
    const file: OutputFile = {
      relativePath: 'index.html',
      content: 'x',
      contentType: 'text/html',
      cacheControl: 'no-cache',
    }

    // No trailing slash
    await new OSSUploader(client as any, 'blog').upload([file])
    expect(client.put).toHaveBeenLastCalledWith(
      'blog/index.html',
      expect.any(Buffer),
      expect.any(Object),
    )

    // Leading slash
    await new OSSUploader(client as any, '/blog/').upload([file])
    expect(client.put).toHaveBeenLastCalledWith(
      'blog/index.html',
      expect.any(Buffer),
      expect.any(Object),
    )

    // Double slashes
    await new OSSUploader(client as any, '//blog//').upload([file])
    expect(client.put).toHaveBeenLastCalledWith(
      'blog/index.html',
      expect.any(Buffer),
      expect.any(Object),
    )

    // Empty
    await new OSSUploader(client as any, '').upload([file])
    expect(client.put).toHaveBeenLastCalledWith(
      'index.html',
      expect.any(Buffer),
      expect.any(Object),
    )
  })

  it('deletes files and returns results', async () => {
    const client = createMockClient()
    const uploader = new OSSUploader(client as any, '')
    const result = await uploader.deleteFiles(['old-page.html', 'old-img.png'])
    expect(client.delete).toHaveBeenCalledTimes(2)
    expect(result.deleted).toEqual(['old-page.html', 'old-img.png'])
    expect(result.failed).toHaveLength(0)
  })

  it('returns failed deletes separately', async () => {
    const client = createMockClient()
    client.delete
      .mockResolvedValueOnce({ res: { status: 204 } })
      .mockRejectedValueOnce(new Error('permission denied'))
    const uploader = new OSSUploader(client as any, '')
    const result = await uploader.deleteFiles(['ok.html', 'fail.html'])
    expect(result.deleted).toEqual(['ok.html'])
    expect(result.failed).toEqual(['fail.html'])
  })

  it('retries failed uploads up to 2 times', async () => {
    const client = createMockClient()
    client.put
      .mockRejectedValueOnce(new Error('timeout'))
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValueOnce({ res: { status: 200 } })
    const uploader = new OSSUploader(client as any, '')
    const file: OutputFile = {
      relativePath: 'test.html',
      content: 'content',
      contentType: 'text/html',
      cacheControl: 'no-cache',
    }
    const result = await uploader.upload([file])
    expect(result.failed).toHaveLength(0)
    expect(client.put).toHaveBeenCalledTimes(3)
  })

  it('records failures after retries exhausted', async () => {
    const client = createMockClient()
    client.put.mockRejectedValue(new Error('permanent error'))
    const uploader = new OSSUploader(client as any, '')
    const file: OutputFile = {
      relativePath: 'test.html',
      content: 'content',
      contentType: 'text/html',
      cacheControl: 'no-cache',
    }
    const result = await uploader.upload([file])
    expect(result.failed).toHaveLength(1)
    expect(result.failed[0].path).toBe('test.html')
  })

  it('stops uploading when signal is aborted', async () => {
    const client = createMockClient()
    const uploader = new OSSUploader(client as any, '')
    const files: OutputFile[] = [
      {
        relativePath: 'a.html',
        content: 'a',
        contentType: 'text/html',
        cacheControl: 'no-cache',
      },
      {
        relativePath: 'b.html',
        content: 'b',
        contentType: 'text/html',
        cacheControl: 'no-cache',
      },
      {
        relativePath: 'c.html',
        content: 'c',
        contentType: 'text/html',
        cacheControl: 'no-cache',
      },
    ]

    const controller = new AbortController()
    // Abort via onProgress after first file is fully processed
    const onProgress = (current: number, _total: number) => {
      if (current === 1) controller.abort()
    }

    const result = await uploader.upload(files, onProgress, controller.signal)
    // File 1: uploaded + recorded + progress(1) fires abort
    // File 2: top-of-loop signal check catches abort → break
    expect(result.uploaded).toEqual(['a.html'])
    expect(client.put).toHaveBeenCalledTimes(1)
  })

  it('returns partial results when aborted mid-batch', async () => {
    const client = createMockClient()
    const uploader = new OSSUploader(client as any, '')

    const controller = new AbortController()
    controller.abort() // Pre-abort

    const files: OutputFile[] = [
      {
        relativePath: 'a.html',
        content: 'a',
        contentType: 'text/html',
        cacheControl: 'no-cache',
      },
    ]

    const result = await uploader.upload(files, undefined, controller.signal)
    expect(result.uploaded).toHaveLength(0)
    expect(client.put).not.toHaveBeenCalled()
  })
})
