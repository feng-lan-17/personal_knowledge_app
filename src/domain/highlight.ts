export interface QuoteAnchor {
  quote: string
  prefix: string
  suffix: string
}

export function locateQuote(text: string, anchor: QuoteAnchor): { start: number; end: number } | null {
  const quote = anchor.quote
  if (!quote || !text.includes(quote)) return null
  let best: { start: number; score: number } | null = null
  let from = 0
  while (from < text.length) {
    const index = text.indexOf(quote, from)
    if (index < 0) break
    const before = text.slice(Math.max(0, index - anchor.prefix.length), index)
    const after = text.slice(index + quote.length, index + quote.length + anchor.suffix.length)
    let score = 1
    if (anchor.prefix && before.endsWith(anchor.prefix)) score += 5
    if (anchor.suffix && after.startsWith(anchor.suffix)) score += 5
    if (!best || score > best.score) best = { start: index, score }
    from = index + Math.max(quote.length, 1)
  }
  if (!best) return null
  return { start: best.start, end: best.start + quote.length }
}

export function selectionContext(text: string, start: number, end: number, radius = 24): QuoteAnchor {
  return {
    quote: text.slice(start, end),
    prefix: text.slice(Math.max(0, start - radius), start),
    suffix: text.slice(end, end + radius),
  }
}
