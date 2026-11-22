import type { ArticleLayout, ColumnId, SampleKind } from "./types.ts"

export interface ParsedArticleDraft {
  title: string
  summary: string
  author: string
  columnId: ColumnId
  layout: ArticleLayout
  applicableVersion: string
  copyright: string
  body: string
}

export type MarkdownParse =
  | { ok: true; draft: ParsedArticleDraft }
  | { ok: false; errors: string[] }

const COLUMNS = new Set<ColumnId>(["llm", "essay", "csp", "gs", "inbox"])
const LAYOUTS = new Set<ArticleLayout>(["technical", "immersive", "catalog"])

export function parseMarkdownImport(raw: string): MarkdownParse {
  const text = raw.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n")
  if (!text.trim()) return { ok: false, errors: ["文件是空的。"] }
  let meta: Record<string, string> = {}
  let body = text.trim()
  if (body.startsWith("---\n")) {
    const end = body.indexOf("\n---", 4)
    if (end < 0) return { ok: false, errors: ["前言没有结束标记。"] }
    meta = parseFrontmatter(body.slice(4, end))
    body = body.slice(end + 4).trim()
  }
  const errors: string[] = []
  const title = (meta.title ?? firstHeading(body) ?? "").trim()
  if (!title) errors.push("缺少标题。请在前言里写 title，或用一级标题。")
  if (!body) errors.push("正文是空的。")
  const columnRaw = (meta.column ?? "inbox").trim()
  if (!COLUMNS.has(columnRaw as ColumnId)) errors.push(`不认识的栏目：${columnRaw}`)
  const layoutRaw = (meta.layout ?? "technical").trim()
  if (!LAYOUTS.has(layoutRaw as ArticleLayout)) errors.push(`不认识的版式：${layoutRaw}`)
  if (errors.length) return { ok: false, errors }
  return {
    ok: true,
    draft: {
      title,
      summary: (meta.summary ?? body.replace(/\s+/g, " ").slice(0, 80)).trim(),
      author: (meta.author ?? "导入").trim(),
      columnId: columnRaw as ColumnId,
      layout: layoutRaw as ArticleLayout,
      applicableVersion: (meta.applicableVersion ?? "用户导入，未标注适用版本").trim(),
      copyright: (meta.copyright ?? "用户导入。请自行确认版权与来源。").trim(),
      body,
    },
  }
}

export function articleToMarkdown(article: {
  title: string
  summary: string
  author: string
  columnId: string
  layout: string
  applicableVersion: string
  copyright: string
  sampleKind: SampleKind
  updatedAt: string
  body: string
}): string {
  const lines = [
    "---",
    `title: ${escapeYaml(article.title)}`,
    `column: ${article.columnId}`,
    `layout: ${article.layout}`,
    `author: ${escapeYaml(article.author)}`,
    `summary: ${escapeYaml(article.summary)}`,
    `applicableVersion: ${escapeYaml(article.applicableVersion)}`,
    `copyright: ${escapeYaml(article.copyright)}`,
    `sampleKind: ${article.sampleKind}`,
    `updatedAt: ${article.updatedAt}`,
    "---",
    "",
    article.body.trim(),
    "",
  ]
  return lines.join("\n")
}

function parseFrontmatter(block: string): Record<string, string> {
  const meta: Record<string, string> = {}
  for (const line of block.split("\n")) {
    const match = /^([A-Za-z][A-Za-z0-9]*):\s*(.*)$/.exec(line)
    if (!match) continue
    meta[match[1]] = match[2].trim().replace(/^["']|["']$/g, "")
  }
  return meta
}

function firstHeading(body: string): string | null {
  const match = /^#\s+(.+)$/m.exec(body)
  return match ? match[1].trim() : null
}

function escapeYaml(value: string): string {
  if (/[:#\n"]/.test(value)) return JSON.stringify(value)
  return value
}
