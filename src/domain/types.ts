export const BACKUP_APP = "private-knowledge-library"
export const SCHEMA_VERSION = 1

export type ColumnId = "llm" | "essay" | "csp" | "gs" | "inbox"
export type ArticleLayout = "technical" | "immersive" | "catalog"
export type ArticleLayer = "canonical" | "imported"
export type SampleKind =
  | "original-sample"
  | "tutorial-sample"
  | "bibliographic"
  | "source-example"
  | "imported"
export type Measure = "narrow" | "comfort" | "wide"
export type ThemeName = "paper" | "night"
export type EngineName = "sqlite" | "indexeddb"

export interface SourceRef {
  title: string
  url?: string
  note: string
}

export interface Article {
  id: string
  columnId: ColumnId
  layer: ArticleLayer
  layout: ArticleLayout
  title: string
  subtitle: string
  summary: string
  author: string
  primaryTopicId: string
  topicIds: string[]
  path: string[]
  relatedIds: string[]
  sources: SourceRef[]
  copyright: string
  updatedAt: string
  applicableVersion: string
  featured: boolean
  hero: boolean
  sampleKind: SampleKind
  readingMinutes: number
  origin: "seed" | "import"
  seedHash: string
  bodyHash: string
  userEdited: boolean
  pendingSeed: boolean
  fileDiverged: boolean
}

export interface ArticleDocument {
  id: string
  body: string
}

export interface Column {
  id: ColumnId
  title: string
  kicker: string
  summary: string
  intro: string
  sortOrder: number
}

export interface Topic {
  id: string
  columnId: ColumnId
  parentId: string | null
  title: string
  summary: string
  sortOrder: number
}

export interface Discovery {
  id: string
  title: string
  summary: string
  sourceTitle: string
  sourceUrl: string
  columnHint: ColumnId | null
  section: "latest" | "featured"
  caution: string
  addedAt: string
}

export interface ReadingState {
  id: string
  articleId: string
  isRead: boolean
  favorite: boolean
  lastReadAt: string | null
  scrollRatio: number
  anchor?: string | null
}

export interface Highlight {
  id: string
  articleId: string
  quote: string
  note: string
  prefix: string
  suffix: string
  createdAt: string
}

export interface Note {
  id: string
  articleId: string
  body: string
  createdAt: string
  updatedAt: string
}

export type PersonalBlock =
  | { id: string; kind: "text"; body: string }
  | { id: string; kind: "quote"; articleId: string; quote: string; note: string }

export interface PersonalTopic {
  id: string
  title: string
  description: string
  blocks: PersonalBlock[]
  updatedAt: string
}

export interface AiDraft {
  id: string
  title: string
  body: string
  basedOn: string[]
  createdAt: string
  confirmed: boolean
  demo: boolean
}

export interface ModelSlot {
  baseUrl: string
  model: string
}

export interface ReadingPrefs {
  fontScale: number
  lineHeight: number
  measure: Measure
  theme: ThemeName
  essayIndent: boolean
  modelSlot: ModelSlot
}

export interface StoreInfo {
  engine: EngineName
  engineLabel: string
  locationLabel: string
  locationDetail: string
  schemaVersion: number
}

export interface ContentNotice {
  articleId: string
  title: string
  kind: "pending-seed" | "file-diverged"
  detail: string
}

export interface SearchHit {
  articleId: string
  title: string
  columnId: ColumnId
  summary: string
  snippet: string
  score: number
}

export interface ImportResult {
  articleId: string
  title: string
}

export interface RestoreReport {
  reading: number
  highlights: number
  notes: number
  personalTopics: number
  aiDrafts: number
  imported: number
  skipped: string[]
}

export const defaultPrefs: ReadingPrefs = {
  fontScale: 1,
  lineHeight: 1.9,
  measure: "comfort",
  theme: "paper",
  essayIndent: true,
  modelSlot: { baseUrl: "", model: "" },
}

export function emptyReading(articleId: string): ReadingState {
  return {
    id: articleId,
    articleId,
    isRead: false,
    favorite: false,
    lastReadAt: null,
    scrollRatio: 0,
  }
}
