import GithubSlugger from "github-slugger"

export interface TocItem {
  depth: number
  text: string
  id: string
}

export function extractToc(markdown: string): TocItem[] {
  const slugger = new GithubSlugger()
  const items: TocItem[] = []
  let inFence = false
  for (const line of markdown.split(/\r?\n/)) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence
      continue
    }
    if (inFence) continue
    const match = /^(#{2,4})\s+(.+?)\s*#*\s*$/.exec(line)
    if (!match) continue
    const text = match[2].replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").trim()
    items.push({ depth: match[1].length, text, id: slugger.slug(text) })
  }
  return items
}
