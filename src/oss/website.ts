import type OSS from 'ali-oss'

const DESIRED_INDEX = 'index.html'
const DESIRED_SUPPORT_SUBDIR = 'true'
const DESIRED_TYPE = '0'

type BucketWebsiteConfig = {
  index?: string
  supportSubDir?: string | boolean
  type?: string | number
  error?: string
  routingRules?: unknown[]
}

export async function ensureWebsiteConfig(
  client: OSS,
  bucket: string,
): Promise<void> {
  let existing: BucketWebsiteConfig | null = null
  try {
    existing = (await client.getBucketWebsite(bucket)) as BucketWebsiteConfig
  } catch (e: unknown) {
    const err = e as {
      status?: number
      statusCode?: number
      code?: string
      name?: string
    }
    const status = err.status ?? err.statusCode
    const code = err.code ?? err.name
    if (status !== 404 && code !== 'NoSuchWebsiteConfigurationError') {
      throw e
    }
  }

  if (
    existing &&
    existing.index === DESIRED_INDEX &&
    String(existing.supportSubDir) === DESIRED_SUPPORT_SUBDIR &&
    String(existing.type) === DESIRED_TYPE
  ) {
    return
  }

  const config: Record<string, unknown> = {
    index: DESIRED_INDEX,
    supportSubDir: DESIRED_SUPPORT_SUBDIR,
    type: DESIRED_TYPE,
  }

  if (existing?.error) config.error = existing.error
  if (existing?.routingRules && existing.routingRules.length > 0) {
    config.routingRules = existing.routingRules
  }

  await client.putBucketWebsite(
    bucket,
    config as unknown as OSS.PutBucketWebsiteConfig,
  )
}
