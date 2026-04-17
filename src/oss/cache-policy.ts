import { posix } from 'path'

export function getCacheControl(filePath: string): string {
  const ext = posix.extname(filePath).toLowerCase()
  if (ext === '.html' || ext === '.json') return 'no-cache'
  if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico'].includes(ext)) return 'max-age=864000'
  if (['.css', '.js', '.woff', '.woff2', '.ttf', '.eot'].includes(ext)) return 'max-age=2592000'
  return 'max-age=864000'
}
