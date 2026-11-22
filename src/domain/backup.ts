import {
  BACKUP_APP,
  SCHEMA_VERSION,
  defaultPrefs,
  type AiDraft,
  type Article,
  type Highlight,
  type Note,
  type PersonalTopic,
  type ReadingPrefs,
  type ReadingState,
} from "./types.ts"

export interface BackupBundle {
  app: typeof BACKUP_APP
  schemaVersion: number
  exportedAt: string
  note: string
  prefs: ReadingPrefs
  reading: ReadingState[]
  highlights: Highlight[]
  notes: Note[]
  personalTopics: PersonalTopic[]
  aiDrafts: AiDraft[]
  importedArticles: { article: Article; body: string }[]
}

export interface BackupPreview {
  reading: number
  highlights: number
  notes: number
  personalTopics: number
  aiDrafts: number
  imported: number
  exportedAt: string
}

export type ParseResult =
  | { ok: true; bundle: BackupBundle }
  | { ok: false; errors: string[] }

const NOTE =
  "私人知识图书馆备份。恢复会替换个人层与导入文章，不会删除随程序带来的审定示例教材。"

export function createBackup(input: Omit<BackupBundle, "app" | "schemaVersion" | "note">): BackupBundle {
  return {
    app: BACKUP_APP,
    schemaVersion: SCHEMA_VERSION,
    note: NOTE,
    ...input,
  }
}

export function parseBackup(raw: unknown): ParseResult {
  const errors: string[] = []
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, errors: ["备份不是对象。"] }
  }
  const record = raw as Record<string, unknown>
  if (record.app !== BACKUP_APP) errors.push("这不是私人知识图书馆的备份。")
  if (record.schemaVersion !== SCHEMA_VERSION) {
    errors.push(`不认识的备份版本（${String(record.schemaVersion)}）。已拒绝，当前只接受版本 ${SCHEMA_VERSION}。`)
  }
  if (typeof record.exportedAt !== "string" || !record.exportedAt) {
    errors.push("缺少导出时间。")
  }
  const prefs = record.prefs
  if (!prefs || typeof prefs !== "object" || Array.isArray(prefs)) errors.push("阅读偏好格式不对。")
  requireArray(record.reading, "阅读记录", errors)
  requireArray(record.highlights, "划线", errors)
  requireArray(record.notes, "笔记", errors)
  requireArray(record.personalTopics, "个人专题", errors)
  requireArray(record.aiDrafts, "草稿", errors)
  requireArray(record.importedArticles, "导入文章", errors)
  if (errors.length) return { ok: false, errors }
  const bundle: BackupBundle = {
    app: BACKUP_APP,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: record.exportedAt as string,
    note: typeof record.note === "string" ? record.note : NOTE,
    prefs: { ...defaultPrefs, ...(prefs as ReadingPrefs) },
    reading: record.reading as ReadingState[],
    highlights: record.highlights as Highlight[],
    notes: record.notes as Note[],
    personalTopics: record.personalTopics as PersonalTopic[],
    aiDrafts: record.aiDrafts as AiDraft[],
    importedArticles: (record.importedArticles as { article: Article; body: string }[]).filter(
      (item) => item && item.article && typeof item.article.id === "string" && typeof item.body === "string",
    ),
  }
  return { ok: true, bundle }
}

export function previewBackup(raw: unknown): { ok: true; preview: BackupPreview } | { ok: false; errors: string[] } {
  const parsed = parseBackup(raw)
  if (!parsed.ok) return parsed
  return {
    ok: true,
    preview: {
      reading: parsed.bundle.reading.length,
      highlights: parsed.bundle.highlights.length,
      notes: parsed.bundle.notes.length,
      personalTopics: parsed.bundle.personalTopics.length,
      aiDrafts: parsed.bundle.aiDrafts.length,
      imported: parsed.bundle.importedArticles.length,
      exportedAt: parsed.bundle.exportedAt,
    },
  }
}

function requireArray(value: unknown, label: string, errors: string[]) {
  if (!Array.isArray(value)) errors.push(`${label}应该是数组。`)
}

export function assertConfirmed(confirmed: boolean, action: string) {
  if (confirmed !== true) {
    throw new Error(`未确认，已取消${action}。数据没有改动。`)
  }
}
