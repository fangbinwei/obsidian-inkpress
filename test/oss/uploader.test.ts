import { describe, it, expect, vi } from 'vitest'
import { OSSUploader } from '../../src/oss/uploader.js'
import type { OutputFile } from 'inkpress-renderer'

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
    const file: OutputFile = { relativePath: 'notes/test.html', content: '<h1>Test</h1>', contentType: 'text/html', cacheControl: 'no-cache' }
    await uploader.upload([file])
    expect(client.put).toHaveBeenCalledWith('notes/test.html', Buffer.from('<h1>Test</h1>'), { headers: { 'Content-Type': 'text/html', 'Cache-Control': 'no-cache' } })
  })

  it('prepends prefix to file paths', async () => {
    const client = createMockClient()
    const uploader = new OSSUploader(client as any, 'blog/')
    const file: OutputFile = { relativePath: 'index.html', content: '<h1>Home</h1>', contentType: 'text/html', cacheControl: 'no-cache' }
    await uploader.upload([file])
    expect(client.put).toHaveBeenCalledWith('blog/index.html', expect.any(Buffer), expect.any(Object))
  })

  it('deletes files', async () => {
    const client = createMockClient()
    const uploader = new OSSUploader(client as any, '')
    await uploader.deleteFiles(['old-page.html', 'old-img.png'])
    expect(client.delete).toHaveBeenCalledTimes(2)
  })

  it('retries failed uploads up to 2 times', async () => {
    const client = createMockClient()
    client.put.mockRejectedValueOnce(new Error('timeout')).mockRejectedValueOnce(new Error('timeout')).mockResolvedValueOnce({ res: { status: 200 } })
    const uploader = new OSSUploader(client as any, '')
    const file: OutputFile = { relativePath: 'test.html', content: 'content', contentType: 'text/html', cacheControl: 'no-cache' }
    const result = await uploader.upload([file])
    expect(result.failed).toHaveLength(0)
    expect(client.put).toHaveBeenCalledTimes(3)
  })

  it('records failures after retries exhausted', async () => {
    const client = createMockClient()
    client.put.mockRejectedValue(new Error('permanent error'))
    const uploader = new OSSUploader(client as any, '')
    const file: OutputFile = { relativePath: 'test.html', content: 'content', contentType: 'text/html', cacheControl: 'no-cache' }
    const result = await uploader.upload([file])
    expect(result.failed).toHaveLength(1)
    expect(result.failed[0].path).toBe('test.html')
  })
})
