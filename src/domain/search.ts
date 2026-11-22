import type { ColumnId, SearchHit } from "./types.ts"

export interface SearchDoc {
  id: string
  columnId: ColumnId
  title: string
  summary: string
  body: string
}

const STOP = new Set(
  "的了是在与和或及把被这那也都很就而又但还对从到为以中上下不有人我你他她它吗呢吧着过会能要说之其并让给向再最更已所".split(
    "",
  ),
)

export function searchDocuments(
  docs: SearchDoc[],
  query: string,
  filter?: { columnId?: string },
): SearchHit[] {
  const q = normalize(query)
  if (!q) return []
  const tokens = analyze(q)
  const hits: SearchHit[] = []
  for (const doc of docs) {
    if (filter?.columnId && doc.columnId !== filter.columnId) continue
    const title = normalize(doc.title)
    const summary = normalize(doc.summary)
    const body = normalize(doc.body)
    let score = 0
    if (title.includes(q)) score += 80
    else if (summary.includes(q)) score += 36
    else if (body.includes(q)) score += 18
    for (const token of tokens) {
      const weight = token.length >= 3 ? 4 : 1.4
      if (title.includes(token)) score += weight * 2.2
      else if (summary.includes(token)) score += weight * 1.4
      else if (body.includes(token)) score += weight
    }
    if (score < 4) continue
    hits.push({
      articleId: doc.id,
      title: doc.title,
      columnId: doc.columnId,
      summary: doc.summary,
      snippet: makeSnippet(doc.body, q, tokens),
      score: Math.round(score * 10) / 10,
    })
  }
  hits.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, "zh"))
  return hits
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim()
}

function analyze(query: string): string[] {
  const tokens: string[] = []
  const chunks = query.split(/[^0-9a-z\u3400-\u9fff+#]+/i).filter(Boolean)
  for (const chunk of chunks) {
    if (/^[0-9a-z+#]+$/i.test(chunk)) {
      if (chunk.length >= 2) tokens.push(chunk)
      continue
    }
    if (chunk.length >= 2 && chunk.length <= 12) tokens.push(chunk)
    const max = Math.min(3, chunk.length)
    for (let size = 2; size <= max; size += 1) {
      for (let i = 0; i <= chunk.length - size; i += 1) {
        const gram = chunk.slice(i, i + size)
        if ([...gram].every((ch) => STOP.has(ch))) continue
        tokens.push(gram)
      }
    }
  }
  return [...new Set(tokens)]
}

function makeSnippet(body: string, query: string, tokens: string[]): string {
  const flat = body.replace(/\s+/g, " ").trim()
  const lower = flat.toLowerCase()
  const needles = [query, ...[...tokens].sort((a, b) => b.length - a.length)]
  let index = -1
  let needle = ""
  for (const item of needles) {
    const found = lower.indexOf(item.toLowerCase())
    if (found >= 0) {
      index = found
      needle = item
      break
    }
  }
  if (index < 0) return flat.slice(0, 96)
  const start = Math.max(0, index - 28)
  const end = Math.min(flat.length, index + Math.max(needle.length, 8) + 56)
  const slice = flat.slice(start, end).trim()
  return `${start > 0 ? "…" : ""}${slice}${end < flat.length ? "…" : ""}`
}
