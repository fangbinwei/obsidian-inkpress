import type { FileSystemAdapter } from 'inkpress-renderer'
import type { Vault } from 'obsidian'
import { TFile, TFolder } from 'obsidian'

export function createVaultAdapter(vault: Vault): FileSystemAdapter {
  return {
    async readFile(path: string): Promise<Buffer> {
      const file = vault.getAbstractFileByPath(path)
      if (!(file instanceof TFile)) throw new Error(`File not found: ${path}`)
      const arrayBuf = await vault.readBinary(file)
      return Buffer.from(arrayBuf)
    },
    async readText(path: string): Promise<string> {
      const file = vault.getAbstractFileByPath(path)
      if (!(file instanceof TFile)) throw new Error(`File not found: ${path}`)
      return vault.read(file)
    },
    async listFiles(dir: string): Promise<string[]> {
      const folder = dir === '' || dir === '.' || dir === '/'
        ? vault.getRoot()
        : vault.getAbstractFileByPath(dir)
      if (!(folder instanceof TFolder)) throw new Error(`Directory not found: ${dir}`)
      const files: string[] = []
      const recurse = (f: TFolder) => {
        for (const child of f.children) {
          if (child instanceof TFile) files.push(child.path)
          else if (child instanceof TFolder) recurse(child)
        }
      }
      recurse(folder)
      return files
    },
    async exists(path: string): Promise<boolean> {
      return vault.getAbstractFileByPath(path) !== null
    },
    async stat(path: string): Promise<{ mtime: number; size: number }> {
      const file = vault.getAbstractFileByPath(path)
      if (!(file instanceof TFile)) throw new Error(`File not found: ${path}`)
      return { mtime: file.stat.mtime, size: file.stat.size }
    },
  }
}
