export interface ValidationResult {
  valid: boolean
  error?: string
}

export function validateOSSConfig(config: { accessKeyId: string; accessKeySecret: string; bucket: string; region: string }): ValidationResult {
  if (!config.accessKeyId.trim()) return { valid: false, error: 'AccessKey ID is required' }
  if (!config.accessKeySecret.trim()) return { valid: false, error: 'AccessKey Secret is required' }
  if (!config.bucket.trim()) return { valid: false, error: 'Bucket name is required' }
  if (!config.region.trim()) return { valid: false, error: 'Region is required' }
  return { valid: true }
}

export function detectRootAccountKey(accessKeyId: string): boolean {
  return accessKeyId.startsWith('LTAI') && accessKeyId.length > 20
}
