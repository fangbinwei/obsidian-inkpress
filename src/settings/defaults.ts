import type { InkpressSettings } from './types.js'

export const DEFAULT_SETTINGS: InkpressSettings = {
  oss: {
    accessKeyId: '',
    accessKeySecret: '',
    bucket: '',
    region: 'oss-cn-hongkong',
    endpoint: '',
    prefix: '',
    customDomain: '',
  },
  publishDirs: [],
  uploadMode: 'html',
  deadLinkPolicy: 'silent',
  publishTrigger: 'manual',
  notificationLevel: 'always',
}
