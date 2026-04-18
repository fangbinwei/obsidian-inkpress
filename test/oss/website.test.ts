import { describe, it, expect, vi } from 'vitest'
import { ensureWebsiteConfig } from '../../src/oss/website.js'

function makeClient(opts: { existing?: any; getError?: any } = {}) {
  const getBucketWebsite = vi.fn()
  const putBucketWebsite = vi.fn().mockResolvedValue({ res: { status: 200 } })
  if (opts.getError) getBucketWebsite.mockRejectedValue(opts.getError)
  else getBucketWebsite.mockResolvedValue(opts.existing)
  return { getBucketWebsite, putBucketWebsite }
}

describe('ensureWebsiteConfig', () => {
  it('creates website config when bucket has none (NoSuchWebsiteConfiguration)', async () => {
    const err: any = new Error('no config')
    err.status = 404
    err.code = 'NoSuchWebsiteConfigurationError'
    const client = makeClient({ getError: err })

    await ensureWebsiteConfig(client as any, 'my-bucket')

    expect(client.putBucketWebsite).toHaveBeenCalledWith('my-bucket', {
      index: 'index.html',
      supportSubDir: 'true',
      type: '0',
    })
  })

  it('skips write when existing config already matches desired state', async () => {
    const client = makeClient({
      existing: { index: 'index.html', supportSubDir: 'true', type: '0', routingRules: [], error: null },
    })

    await ensureWebsiteConfig(client as any, 'my-bucket')

    expect(client.putBucketWebsite).not.toHaveBeenCalled()
  })

  it('preserves existing error page and routing rules when updating', async () => {
    const client = makeClient({
      existing: {
        index: 'home.html',
        supportSubDir: 'false',
        type: '0',
        error: '404.html',
        routingRules: [{ RuleNumber: 1 }],
      },
    })

    await ensureWebsiteConfig(client as any, 'my-bucket')

    expect(client.putBucketWebsite).toHaveBeenCalledWith('my-bucket', {
      index: 'index.html',
      supportSubDir: 'true',
      type: '0',
      error: '404.html',
      routingRules: [{ RuleNumber: 1 }],
    })
  })

  it('rethrows non-404 errors from getBucketWebsite', async () => {
    const err: any = new Error('access denied')
    err.status = 403
    err.code = 'AccessDenied'
    const client = makeClient({ getError: err })

    await expect(ensureWebsiteConfig(client as any, 'my-bucket')).rejects.toThrow('access denied')
    expect(client.putBucketWebsite).not.toHaveBeenCalled()
  })
})
