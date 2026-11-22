import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import type { Article, Highlight, Note, ReadingState } from "../domain/types.ts"
import { useLibrary } from "../library/context.tsx"
import { Reader } from "../reader/Reader.tsx"
import type { ArticlePage } from "../storage/repository.ts"

export function ReaderPage() {
  const { id = "" } = useParams()
  const lib = useLibrary()
  const [article, setArticle] = useState<ArticlePage | null>(null)
  const [reading, setReading] = useState<ReadingState | null>(null)
  const [highlights, setHighlights] = useState<Highlight[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    let cancel = false
    void (async () => {
      const page = await lib.store.getArticle(id)
      if (cancel) return
      if (!page) {
        setMissing(true)
        setArticle(null)
        return
      }
      const state = await lib.store.getReading(id)
      const opened = { ...state, lastReadAt: new Date().toISOString() }
      await lib.store.saveReading(opened)
      if (cancel) return
      setMissing(false)
      setArticle(page)
      setReading(opened)
      document.title = `${page.title} · 私人知识图书馆`
      lib.refresh()
    })()
    return () => {
      cancel = true
    }
  }, [id, lib.store])

  useEffect(() => {
    let cancel = false
    void (async () => {
      const [marks, ownNotes, all, state] = await Promise.all([
        lib.store.listHighlights(id),
        lib.store.listNotes(id),
        lib.store.listArticles(),
        lib.store.getReading(id),
      ])
      if (cancel) return
      setHighlights(marks)
      setNotes(ownNotes)
      setArticles(all)
      setReading((current) => current ? { ...state, lastReadAt: current.lastReadAt ?? state.lastReadAt } : state)
    })()
    return () => {
      cancel = true
    }
  }, [id, lib.store, lib.tick])

  useEffect(() => {
    if (!reading || !article) return
    const onScroll = () => {
      const root = document.scrollingElement
      if (!root) return
      const height = root.scrollHeight - root.clientHeight
      if (height <= 0) return
      const ratio = root.scrollTop / height
      void lib.store.saveReading({ ...reading, scrollRatio: ratio })
    }
    let timer = 0
    const listener = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(onScroll, 400)
    }
    window.addEventListener("scroll", listener, { passive: true })
    return () => {
      window.removeEventListener("scroll", listener)
      window.clearTimeout(timer)
    }
  }, [article, reading, lib.store])

  if (missing) return <p className="gate">没有这篇文章。</p>
  if (!article || !reading) return <p className="gate">正在打开文章…</p>
  return <Reader article={article} reading={reading} highlights={highlights} notes={notes} articles={articles} />
}
