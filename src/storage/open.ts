import { buildSeed } from "../content/seed.ts"
import { indexedDbInfo, openIdbPort } from "./indexeddb.ts"
import { LibraryRepository, type LibraryStore } from "./repository.ts"
import { createDesktopBridge, createTauriPort, desktopInfo, isDesktopShell } from "./tauriPort.ts"

export type { LibraryStore }

export async function openLibrary(): Promise<LibraryStore> {
  const seed = buildSeed()
  if (isDesktopShell()) {
    const info = await desktopInfo()
    const repo = new LibraryRepository(createTauriPort(), info, createDesktopBridge())
    await repo.init(seed)
    await repo.finishDesktopInit()
    return repo
  }
  const repo = new LibraryRepository(await openIdbPort(), indexedDbInfo)
  await repo.init(seed)
  return repo
}
