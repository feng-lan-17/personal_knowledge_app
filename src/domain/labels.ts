import type { ColumnId, SampleKind } from "./types.ts"

export const COLUMN_NAME: Record<ColumnId, string> = {
  llm: "大模型",
  essay: "散文随笔",
  csp: "CSP 算法",
  gs: "高斯溅射",
  inbox: "导入",
}

export const SAMPLE_LABEL: Record<SampleKind, string> = {
  "original-sample": "原创示例",
  "tutorial-sample": "原创教程示例",
  bibliographic: "书目示例 · 不含作品全文",
  "source-example": "来源示例 · 时效待核验",
  imported: "用户导入 · 未经审定",
}

export function formatEditionDate(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate)
  if (!match) return isoDate
  return `${match[1]}年${Number(match[2])}月${Number(match[3])}日`
}

export function measureWidth(measure: "narrow" | "comfort" | "wide"): string {
  if (measure === "narrow") return "40rem"
  if (measure === "wide") return "58rem"
  return "50rem"
}

const ARTICLE_ORDER = [
  "llm-dialogue",
  "llm-token",
  "llm-build",
  "essay-rain",
  "essay-lamp",
  "essay-authors",
  "csp-basics",
  "csp-sort",
  "csp-search",
  "gs-basics",
  "gs-optimize",
  "gs-frontier",
]

export function compareArticles(a: { id: string }, b: { id: string }): number {
  const left = ARTICLE_ORDER.indexOf(a.id)
  const right = ARTICLE_ORDER.indexOf(b.id)
  return (left < 0 ? 100 : left) - (right < 0 ? 100 : right) || a.id.localeCompare(b.id)
}

export function newId(prefix: string): string {
  const uuid = crypto.randomUUID()
  return `${prefix}-${uuid}`
}
