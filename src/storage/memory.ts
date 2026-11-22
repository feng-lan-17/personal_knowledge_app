import type { Article } from "../domain/types.ts"
import type { PersonalSnapshot, TablePort } from "./port.ts"

export class MemoryPort implements TablePort {
  private readonly tables = new Map<string, Map<string, { id: string }>>()
  private readonly meta = new Map<string, string>()

  async get<T>(table: string, id: string): Promise<T | undefined> {
    return this.bucket(table).get(id) as T | undefined
  }

  async put<T extends { id: string }>(table: string, value: T): Promise<void> {
    this.bucket(table).set(value.id, structuredClone(value))
  }

  async remove(table: string, id: string): Promise<void> {
    this.bucket(table).delete(id)
  }

  async all<T>(table: string): Promise<T[]> {
    return [...this.bucket(table).values()].map((item) => structuredClone(item)) as T[]
  }

  async getMeta(key: string): Promise<string | undefined> {
    return this.meta.get(key)
  }

  async setMeta(key: string, value: string): Promise<void> {
    this.meta.set(key, value)
  }

  async replacePersonal(snapshot: PersonalSnapshot): Promise<void> {
    this.replaceAll("reading", snapshot.reading)
    this.replaceAll("highlights", snapshot.highlights)
    this.replaceAll("notes", snapshot.notes)
    this.replaceAll("personalTopics", snapshot.personalTopics)
    this.replaceAll("drafts", snapshot.drafts)
    const articles = [...this.bucket("articles").values()] as Article[]
    for (const article of articles) {
      if (article.layer === "imported") {
        this.bucket("articles").delete(article.id)
        this.bucket("documents").delete(article.id)
      }
    }
    for (const item of snapshot.imported) {
      this.bucket("articles").set(item.article.id, structuredClone(item.article))
      this.bucket("documents").set(item.article.id, { id: item.article.id, body: item.body } as { id: string })
    }
    this.meta.set("prefs", JSON.stringify(snapshot.prefs))
  }

  private replaceAll(table: string, rows: { id: string }[]) {
    this.tables.set(table, new Map(rows.map((row) => [row.id, structuredClone(row)])))
  }

  private bucket(table: string) {
    let bucket = this.tables.get(table)
    if (!bucket) {
      bucket = new Map()
      this.tables.set(table, bucket)
    }
    return bucket
  }
}
