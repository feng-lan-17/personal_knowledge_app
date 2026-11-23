import { useEffect, useId, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { GLOSSARY } from "../content/glossary.ts"
import { PROBLEMS } from "../content/problems.ts"
import { COLUMN_NAME } from "../domain/labels.ts"
import type { SearchHit } from "../domain/types.ts"
import { useLibrary } from "../library/context.tsx"

export interface PaletteItem {
  key: string
  title: string
  snippet: string
  meta: string
  href: string
}

export function usePalette(query: string): PaletteItem[] {
  const lib = useLibrary()
  const [articleHits, setArticleHits] = useState<SearchHit[]>([])

  useEffect(() => {
    const text = query.trim()
    if (!text) {
      setArticleHits([])
      return
    }
    let cancel = false
    void lib.store.search(text).then((hits) => {
      if (!cancel) setArticleHits(hits.slice(0, 6))
    })
    return () => {
      cancel = true
    }
  }, [query, lib.store])

  return useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    const terms: PaletteItem[] = GLOSSARY.filter((entry) => `${entry.term} ${entry.gloss}`.toLowerCase().includes(q)).map((entry) => ({
      key: `term-${entry.id}`,
      title: entry.term,
      snippet: entry.gloss,
      meta: "词条 · 大模型",
      href: `/library/llm/encyclopedia/${entry.id}`,
    }))
    const problems: PaletteItem[] = PROBLEMS.filter((problem) => `${problem.id} ${problem.title} ${problem.tags.join(" ")}`.toLowerCase().includes(q)).map((problem) => ({
      key: `p-${problem.id}`,
      title: `${problem.id} ${problem.title}`,
      snippet: problem.observation,
      meta: `题解 · ${problem.tags[0] ?? "CSP"} · ${problem.source}`,
      href: `/library/csp/p/${problem.id}`,
    }))
    const articles: PaletteItem[] = articleHits.map((hit) => ({
      key: `a-${hit.articleId}`,
      title: hit.title,
      snippet: hit.snippet,
      meta: `文章 · ${COLUMN_NAME[hit.columnId]}`,
      href: `/read/${hit.articleId}`,
    }))
    const exactId = PROBLEMS.find((problem) => problem.id.toLowerCase() === q)?.id
    const exact = problems.find((item) => item.key === `p-${exactId}`)
    return (exact ? [exact, ...articles, ...terms, ...problems.filter((item) => item !== exact)] : [...articles, ...terms, ...problems]).slice(0, 8)
  }, [query, articleHits])
}

export function Omnibox({ autoFocus = false, onNavigate }: { autoFocus?: boolean; onNavigate?: () => void }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState("")
  const [active, setActive] = useState(0)
  const [open, setOpen] = useState(false)
  const items = usePalette(query)
  const listId = useId()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  useEffect(() => {
    setActive(0)
  }, [query])

  function go(item: PaletteItem | undefined) {
    if (!item) return
    navigate(item.href)
    setQuery("")
    setOpen(false)
    onNavigate?.()
  }

  return (
    <div className="omnibox">
      <input
        ref={inputRef}
        className="omnibox-input"
        placeholder="搜索文章、词条、题解"
        aria-label="搜索文章、词条、题解"
        aria-expanded={open && items.length > 0}
        aria-controls={listId}
        aria-activedescendant={items[active] ? `${listId}-${active}` : undefined}
        role="combobox"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault()
            setActive((index) => Math.min(index + 1, Math.max(items.length - 1, 0)))
          } else if (event.key === "ArrowUp") {
            event.preventDefault()
            setActive((index) => Math.max(index - 1, 0))
          } else if (event.key === "Enter") {
            event.preventDefault()
            go(items[active])
          } else if (event.key === "Escape") {
            setOpen(false)
          }
        }}
      />
      <span className="kbd">Ctrl+K</span>
      {open && query.trim() && items.length > 0 ? (
        <ul className="omnibox-list" id={listId} role="listbox">
          {items.map((item, index) => (
            <li key={item.key} id={`${listId}-${index}`} role="option" aria-selected={index === active}>
              <button type="button" className={index === active ? "hit-row is-active" : "hit-row"} onMouseEnter={() => setActive(index)} onClick={() => go(item)}>
                <strong>{item.title}</strong>
                <span>{item.snippet}</span>
                <em>{item.meta}</em>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {open && query.trim() && items.length === 0 ? <p className="omnibox-empty">库内没有直接命中。</p> : null}
    </div>
  )
}
