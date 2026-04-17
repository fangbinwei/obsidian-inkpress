import OSS from 'ali-oss'
import type { OSSConfig } from '../settings/types.js'

export function createOSSClient(config: OSSConfig): OSS {
  const endpoint = config.endpoint || `${config.region}.aliyuncs.com`
  return new OSS({
    accessKeyId: config.accessKeyId,
    accessKeySecret: config.accessKeySecret,
    bucket: config.bucket,
    region: config.region,
    endpoint,
    secure: true,
  })
}

export async function testConnection(client: OSS): Promise<void> {
  await client.list({ 'max-keys': 1 }, {})
}
