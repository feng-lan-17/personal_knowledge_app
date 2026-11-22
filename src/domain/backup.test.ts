import { describe, expect, it } from "vitest"
import { parseBackup, previewBackup } from "./backup.ts"
import { BACKUP_APP, defaultPrefs } from "./types.ts"

function valid() {
  return {
    app: BACKUP_APP,
    schemaVersion: 1,
    exportedAt: "2026-11-22T00:00:00.000Z",
    note: "测试",
    prefs: defaultPrefs,
    reading: [],
    highlights: [],
    notes: [{ id: "n1", articleId: "a", body: "一则笔记", createdAt: "2026-11-22", updatedAt: "2026-11-22" }],
    personalTopics: [],
    aiDrafts: [],
    importedArticles: [],
  }
}

describe("备份校验", () => {
  it("接受当前版本", () => {
    const parsed = parseBackup(valid())
    expect(parsed.ok).toBe(true)
    if (parsed.ok) expect(parsed.bundle.notes).toHaveLength(1)
    const preview = previewBackup(valid())
    expect(preview.ok).toBe(true)
    if (preview.ok) expect(preview.preview.notes).toBe(1)
  })

  it("拒绝别的程序、缺字段和未来版本", () => {
    expect(parseBackup(null).ok).toBe(false)
    expect(parseBackup({ ...valid(), app: "other" }).ok).toBe(false)
    expect(parseBackup({ ...valid(), schemaVersion: 99 }).ok).toBe(false)
    const missing = valid() as Record<string, unknown>
    delete missing.notes
    expect(parseBackup(missing).ok).toBe(false)
  })
})
