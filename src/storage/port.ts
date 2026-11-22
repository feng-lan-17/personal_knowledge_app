import type {
  AiDraft,
  Article,
  Highlight,
  Note,
  PersonalTopic,
  ReadingPrefs,
  ReadingState,
} from "../domain/types.ts"

export interface StoredDocument {
  id: string
  body: string
}

export interface PersonalSnapshot {
  reading: ReadingState[]
  highlights: Highlight[]
  notes: Note[]
  personalTopics: PersonalTopic[]
  drafts: AiDraft[]
  prefs: ReadingPrefs
  imported: { article: Article; body: string }[]
}

export interface TablePort {
  get<T>(table: string, id: string): Promise<T | undefined>
  put<T extends { id: string }>(table: string, value: T): Promise<void>
  remove(table: string, id: string): Promise<void>
  all<T>(table: string): Promise<T[]>
  getMeta(key: string): Promise<string | undefined>
  setMeta(key: string, value: string): Promise<void>
  replacePersonal(snapshot: PersonalSnapshot): Promise<void>
}
