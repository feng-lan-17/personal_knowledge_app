import type { Highlight } from "../domain/types.ts"

export function applyHighlights(root: HTMLElement, highlights: Highlight[]): { id: string; placed: boolean }[] {
  unwrap(root)
  return highlights.map((highlight) => ({ id: highlight.id, placed: placeOne(root, highlight) }))
}

function unwrap(root: HTMLElement) {
  for (const mark of [...root.querySelectorAll("mark[data-hl]")]) {
    const parent = mark.parentNode
    if (!parent) continue
    while (mark.firstChild) parent.insertBefore(mark.firstChild, mark)
    parent.removeChild(mark)
    parent.normalize()
  }
}

function placeOne(root: HTMLElement, highlight: Highlight): boolean {
  if (!highlight.quote) return false
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let best: { node: Text; start: number; score: number } | null = null
  let current = walker.nextNode()
  while (current) {
    const node = current as Text
    current = walker.nextNode()
    if (node.parentElement?.closest("mark, .katex, script, style")) continue
    const text = node.data
    let from = 0
    while (from < text.length) {
      const index = text.indexOf(highlight.quote, from)
      if (index < 0) break
      const before = text.slice(Math.max(0, index - highlight.prefix.length), index)
      const after = text.slice(index + highlight.quote.length, index + highlight.quote.length + highlight.suffix.length)
      let score = 1
      if (highlight.prefix && before.endsWith(highlight.prefix)) score += 5
      if (highlight.suffix && after.startsWith(highlight.suffix)) score += 5
      if (!best || score > best.score) best = { node, start: index, score }
      from = index + highlight.quote.length
    }
  }
  if (!best) return false
  const range = document.createRange()
  range.setStart(best.node, best.start)
  range.setEnd(best.node, best.start + highlight.quote.length)
  const mark = document.createElement("mark")
  mark.dataset.hl = highlight.id
  range.surroundContents(mark)
  return true
}
