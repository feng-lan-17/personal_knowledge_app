import { openDB, type IDBPDatabase } from "idb"
import { SCHEMA_VERSION, type Article, type StoreInfo } from "../domain/types.ts"
import type { PersonalSnapshot, TablePort } from "./port.ts"

const DB_NAME = "pkl-library"
const DB_VERSION = 1

const TABLES = [
  "columns",
  "topics",
  "articles",
  "documents",
  "discoveries",
  "reading",
  "highlights",
  "notes",
  "personalTopics",
  "drafts",
  "pendingBodies",
] as const

export const indexedDbInfo: StoreInfo = {
  engine: "indexeddb",
  engineLabel: "IndexedDB",
  locationLabel: "浏览器数据库 pkl-library",
  locationDetail:
    "当前是浏览器预览。数据在 IndexedDB 的对象仓库里，不是 localStorage，也不是 SQLite 文件，更不在安装目录中。清除站点数据或换浏览器，这份预览会消失。桌面版使用系统应用数据目录中的 library.db、content 与 attachments，与安装路径分开。两边的数据互不相通。",
  schemaVersion: SCHEMA_VERSION,
}

interface MetaRow {
  key: string
  value: string
}

export async function openIdbPort(name = DB_NAME): Promise<TablePort> {
  const db = await openDB(name, DB_VERSION, {
    upgrade(database) {
      for (const table of TABLES) {
        if (!database.objectStoreNames.contains(table)) {
          database.createObjectStore(table, { keyPath: "id" })
        }
      }
      if (!database.objectStoreNames.contains("meta")) {
        database.createObjectStore("meta", { keyPath: "key" })
      }
    },
  })
  return new IdbPort(db)
}

class IdbPort implements TablePort {
  private readonly db: IDBPDatabase

  constructor(db: IDBPDatabase) {
    this.db = db
  }

  async get<T>(table: string, id: string): Promise<T | undefined> {
    return this.db.get(table, id)
  }

  async put<T extends { id: string }>(table: string, value: T): Promise<void> {
    await this.db.put(table, value)
  }

  async remove(table: string, id: string): Promise<void> {
    await this.db.delete(table, id)
  }

  async all<T>(table: string): Promise<T[]> {
    return this.db.getAll(table)
  }

  async getMeta(key: string): Promise<string | undefined> {
    const row = await this.db.get("meta", key) as MetaRow | undefined
    return row?.value
  }

  async setMeta(key: string, value: string): Promise<void> {
    await this.db.put("meta", { key, value })
  }

  async replacePersonal(snapshot: PersonalSnapshot): Promise<void> {
    const tx = this.db.transaction(
      ["reading", "highlights", "notes", "personalTopics", "drafts", "articles", "documents", "meta"],
      "readwrite",
    )
    for (const name of ["reading", "highlights", "notes", "personalTopics", "drafts"]) {
      await tx.objectStore(name).clear()
    }
    const articles = (await tx.objectStore("articles").getAll()) as Article[]
    for (const article of articles) {
      if (article.layer === "imported") {
        await tx.objectStore("articles").delete(article.id)
        await tx.objectStore("documents").delete(article.id)
      }
    }
    for (const row of snapshot.reading) await tx.objectStore("reading").put(row)
    for (const row of snapshot.highlights) await tx.objectStore("highlights").put(row)
    for (const row of snapshot.notes) await tx.objectStore("notes").put(row)
    for (const row of snapshot.personalTopics) await tx.objectStore("personalTopics").put(row)
    for (const row of snapshot.drafts) await tx.objectStore("drafts").put(row)
    for (const item of snapshot.imported) {
      await tx.objectStore("articles").put(item.article)
      await tx.objectStore("documents").put({ id: item.article.id, body: item.body })
    }
    await tx.objectStore("meta").put({ key: "prefs", value: JSON.stringify(snapshot.prefs) })
    await tx.done
  }
}
