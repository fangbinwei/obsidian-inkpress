import { describe, it, expect } from 'vitest'
import { PublishState } from '../../src/publish/state.js'
import type { OutputFile } from 'inkpress-renderer'
import { createHash } from 'crypto'

function md5(content: string): string {
  return createHash('md5').update(content).digest('hex')
}

describe('PublishState', () => {
  it('computes diff for new files (no prior state)', () => {
    const state = new PublishState(null)
    const files: OutputFile[] = [
      { relativePath: 'a.html', content: 'aaa', contentType: 'text/html', cacheControl: 'no-cache' },
      { relativePath: 'b.html', content: 'bbb', contentType: 'text/html', cacheControl: 'no-cache' },
    ]
    const diff = state.diff(files)
    expect(diff.toUpload).toHaveLength(2)
    expect(diff.toDelete).toHaveLength(0)
  })

  it('detects changed files', () => {
    const priorState = {
      version: 1, lastPublishAt: '2026-04-18T00:00:00Z',
      files: { 'a.html': { contentMD5: md5('old-content'), size: 11, publishedAt: '2026-04-18T00:00:00Z' } },
    }
    const state = new PublishState(priorState)
    const files: OutputFile[] = [{ relativePath: 'a.html', content: 'new-content', contentType: 'text/html', cacheControl: 'no-cache' }]
    const diff = state.diff(files)
    expect(diff.toUpload).toHaveLength(1)
    expect(diff.toDelete).toHaveLength(0)
  })

  it('detects unchanged files and skips them', () => {
    const content = 'same-content'
    const priorState = {
      version: 1, lastPublishAt: '2026-04-18T00:00:00Z',
      files: { 'a.html': { contentMD5: md5(content), size: content.length, publishedAt: '2026-04-18T00:00:00Z' } },
    }
    const state = new PublishState(priorState)
    const files: OutputFile[] = [{ relativePath: 'a.html', content, contentType: 'text/html', cacheControl: 'no-cache' }]
    const diff = state.diff(files)
    expect(diff.toUpload).toHaveLength(0)
    expect(diff.toDelete).toHaveLength(0)
  })

  it('detects deleted files', () => {
    const priorState = {
      version: 1, lastPublishAt: '2026-04-18T00:00:00Z',
      files: {
        'a.html': { contentMD5: 'abc', size: 10, publishedAt: '2026-04-18T00:00:00Z' },
        'deleted.html': { contentMD5: 'def', size: 10, publishedAt: '2026-04-18T00:00:00Z' },
      },
    }
    const state = new PublishState(priorState)
    const files: OutputFile[] = [{ relativePath: 'a.html', content: 'aaa', contentType: 'text/html', cacheControl: 'no-cache' }]
    const diff = state.diff(files)
    expect(diff.toDelete).toEqual(['deleted.html'])
  })

  it('produces snapshot after publish', () => {
    const state = new PublishState(null)
    const files: OutputFile[] = [{ relativePath: 'a.html', content: 'aaa', contentType: 'text/html', cacheControl: 'no-cache' }]
    const snapshot = state.createSnapshot(files)
    expect(snapshot.version).toBe(1)
    expect(snapshot.files['a.html']).toBeDefined()
    expect(snapshot.files['a.html'].contentMD5).toBe(md5('aaa'))
  })

  it('retains delete-failed paths in snapshot for retry', () => {
    const priorState = {
      version: 1, lastPublishAt: '2026-04-18T00:00:00Z',
      files: {
        'a.html': { contentMD5: md5('aaa'), size: 3, publishedAt: '2026-04-18T00:00:00Z' },
        'orphan.html': { contentMD5: md5('orphan'), size: 6, publishedAt: '2026-04-18T00:00:00Z' },
      },
    }
    const state = new PublishState(priorState)
    // Current render only has a.html (orphan.html was deleted from vault)
    const files: OutputFile[] = [{ relativePath: 'a.html', content: 'aaa', contentType: 'text/html', cacheControl: 'no-cache' }]

    // orphan.html delete failed on OSS
    const snapshot = state.createSnapshot(files, ['orphan.html'])

    // orphan.html should still be in snapshot so next diff will try to delete again
    expect(snapshot.files['orphan.html']).toBeDefined()
    expect(snapshot.files['orphan.html'].contentMD5).toBe(md5('orphan'))
    expect(snapshot.files['a.html']).toBeDefined()
  })
})
