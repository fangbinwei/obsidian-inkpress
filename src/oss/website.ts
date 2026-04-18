const DESIRED_INDEX = 'index.html'
const DESIRED_SUPPORT_SUBDIR = 'true'
const DESIRED_TYPE = '0'

export async function ensureWebsiteConfig(client: any, bucket: string): Promise<void> {
  let existing: any = null
  try {
    existing = await client.getBucketWebsite(bucket)
  } catch (e: any) {
    const status = e?.status ?? e?.statusCode
    const code = e?.code ?? e?.name
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

  await client.putBucketWebsite(bucket, config)
}
