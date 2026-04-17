import { Plugin } from 'obsidian'

export default class InkpressPlugin extends Plugin {
  async onload() {
    console.log('Inkpress plugin loaded')
  }

  onunload() {
    console.log('Inkpress plugin unloaded')
  }
}
