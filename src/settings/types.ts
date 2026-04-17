export interface InkpressSettings {
  oss: OSSConfig
  publishDirs: string[]
  uploadMode: 'html' | 'html+md'
  deadLinkPolicy: 'silent' | 'marked'
  publishTrigger: 'manual' | 'on-save' | 'interval'
  notificationLevel: 'always' | 'error-only' | 'silent'
}

export interface OSSConfig {
  accessKeyId: string
  accessKeySecret: string
  bucket: string
  region: string
  endpoint: string
  prefix: string
  customDomain: string
}

export const OSS_REGIONS = [
  { value: 'oss-cn-hongkong', label: 'Hong Kong (no ICP filing required)' },
  { value: 'oss-cn-hangzhou', label: 'Hangzhou' },
  { value: 'oss-cn-shanghai', label: 'Shanghai' },
  { value: 'oss-cn-beijing', label: 'Beijing' },
  { value: 'oss-cn-shenzhen', label: 'Shenzhen' },
  { value: 'oss-cn-chengdu', label: 'Chengdu' },
  { value: 'oss-ap-southeast-1', label: 'Singapore' },
  { value: 'oss-us-west-1', label: 'US West (Silicon Valley)' },
] as const
