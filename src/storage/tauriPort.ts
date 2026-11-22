import { SCHEMA_VERSION, type StoreInfo } from "../domain/types.ts"
import type { TablePort } from "./port.ts"
import type { DesktopBridge } from "./repository.ts"

interface Invoke {
  <T>(command: string, args?: Record<string, unknown>): Promise<T>
}

async function invoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  const mod = await import("@tauri-apps/api/core")
  return mod.invoke<T>(command, args)
}

export function isDesktopShell(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window
}

export async function desktopInfo(): Promise<StoreInfo> {
  return invoke<StoreInfo>("storage_info")
}

export function createTauriPort(call: Invoke = invoke): TablePort {
  return {
    get: (table, id) => call("db_get", { table, id }),
    put: (table, value) => call("db_put", { table, value }),
    remove: (table, id) => call("db_remove", { table, id }),
    all: (table) => call("db_all", { table }),
    getMeta: (key) => call("db_meta_get", { key }),
    setMeta: (key, value) => call("db_meta_set", { key, value }),
    replacePersonal: (snapshot) => call("db_replace_personal", { snapshot }),
  }
}

export function createDesktopBridge(call: Invoke = invoke): DesktopBridge {
  return {
    afterInit: () => call("sync_markdown"),
    loadDivergedFile: (id) => call("load_markdown", { id, confirmed: true }),
  }
}

export const desktopInfoFallback: StoreInfo = {
  engine: "sqlite",
  engineLabel: "SQLite",
  locationLabel: "应用数据目录",
  locationDetail: "桌面版把 library.db、content 和 attachments 放在系统应用数据目录，与安装路径分开。",
  schemaVersion: SCHEMA_VERSION,
}
