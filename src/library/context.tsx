import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { createDisconnectedClient, type AiClient } from "../domain/ai.ts"
import { measureWidth } from "../domain/labels.ts"
import type { ReadingPrefs, StoreInfo } from "../domain/types.ts"
import { openLibrary } from "../storage/open.ts"
import type { LibraryStore } from "../storage/repository.ts"

interface ReadyLibrary {
  status: "ready"
  store: LibraryStore
  info: StoreInfo
  prefs: ReadingPrefs
  tick: number
  refresh: () => void
  updatePrefs: (prefs: ReadingPrefs) => Promise<void>
  ai: AiClient
}

type LibraryState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | ReadyLibrary

const LibraryContext = createContext<LibraryState>({ status: "loading" })

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LibraryState>({ status: "loading" })

  useEffect(() => {
    let cancel = false
    openLibrary()
      .then(async (store) => {
        if (cancel) return
        const [info, prefs] = await Promise.all([store.info(), store.getPrefs()])
        setState({
          status: "ready",
          store,
          info,
          prefs,
          tick: 0,
          refresh: () => undefined,
          updatePrefs: async () => undefined,
          ai: createDisconnectedClient(prefs.modelSlot),
        })
      })
      .catch((error: unknown) => {
        if (cancel) return
        setState({ status: "error", message: error instanceof Error ? error.message : "无法打开本地库" })
      })
    return () => {
      cancel = true
    }
  }, [])

  const refresh = useCallback(() => {
    setState((current) => (current.status === "ready" ? { ...current, tick: current.tick + 1 } : current))
  }, [])

  const updatePrefs = useCallback(async (prefs: ReadingPrefs) => {
    setState((current) => {
      if (current.status !== "ready") return current
      return { ...current, prefs, ai: createDisconnectedClient(prefs.modelSlot) }
    })
    setState((current) => {
      if (current.status !== "ready") return current
      void current.store.setPrefs(prefs)
      return current
    })
  }, [])

  const value = useMemo<LibraryState>(() => {
    if (state.status !== "ready") return state
    return { ...state, refresh, updatePrefs, ai: createDisconnectedClient(state.prefs.modelSlot) }
  }, [state, refresh, updatePrefs])

  useEffect(() => {
    if (value.status !== "ready") return
    const root = document.documentElement
    root.dataset.theme = value.prefs.theme
    root.dataset.indent = value.prefs.essayIndent ? "on" : "off"
    root.style.setProperty("--font-scale", String(value.prefs.fontScale))
    root.style.setProperty("--reading-line", String(value.prefs.lineHeight))
    root.style.setProperty("--measure", measureWidth(value.prefs.measure))
  }, [value])

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
}

export function useLibraryState() {
  return useContext(LibraryContext)
}

export function useLibrary(): ReadyLibrary {
  const state = useLibraryState()
  if (state.status !== "ready") throw new Error("库还没有打开")
  return state
}
