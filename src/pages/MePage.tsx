import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { DEMO_DRAFT } from "../domain/demoDraft.ts"
import type { AiDraft, Article, Highlight, Note, PersonalTopic, ReadingState } from "../domain/types.ts"
import { useLibrary } from "../library/context.tsx"

type Section = "favorites" | "excerpts" | "notes" | "topics" | "drafts"

const SECTIONS: { id: Section; label: string }[] = [
  { id: "favorites", label: "收藏" },
  { id: "excerpts", label: "摘录" },
  { id: "notes", label: "笔记" },
  { id: "topics", label: "专题" },
  { id: "drafts", label: "对话整理" },
]

export function MePage() {
  const lib = useLibrary()
  const [section, setSection] = useState<Section>("favorites")
  const [selected, setSelected] = useState("")
  const [articles, setArticles] = useState<Article[]>([])
  const [reading, setReading] = useState<ReadingState[]>([])
  const [highlights, setHighlights] = useState<Highlight[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [topics, setTopics] = useState<PersonalTopic[]>([])
  const [drafts, setDrafts] = useState<AiDraft[]>([])
  const [narrowDetail, setNarrowDetail] = useState(false)

  useEffect(() => {
    document.title = "我的藏书 · 私人知识图书馆"
    void Promise.all([
      lib.store.listArticles(),
      lib.store.listReading(),
      lib.store.listHighlights(),
      lib.store.listNotes(),
      lib.store.listPersonalTopics(),
      lib.store.listDrafts(),
    ]).then(([nextArticles, nextReading, nextHighlights, nextNotes, nextTopics, nextDrafts]) => {
      setArticles(nextArticles)
      setReading(nextReading)
      setHighlights(nextHighlights)
      setNotes(nextNotes)
      setTopics(nextTopics)
      setDrafts(nextDrafts)
    })
  }, [lib.store, lib.tick])

  const titleOf = (id: string) => articles.find((article) => article.id === id)?.title ?? "原文"
  const favorites = reading.filter((item) => item.favorite)

  return (
    <div className="page mine" data-detail={narrowDetail ? "on" : "off"}>
      <nav className="mine-nav" aria-label="我的藏书">
        {SECTIONS.map((item) => (
          <button key={item.id} type="button" aria-pressed={section === item.id} onClick={() => { setSection(item.id); setSelected(""); setNarrowDetail(false) }}>
            {item.label}
          </button>
        ))}
      </nav>
      <div className="mine-list">
        <h1>我的藏书</h1>
        {section === "favorites" ? (
          favorites.length === 0 ? <p className="empty-next">打开一篇文章，点「收藏」。</p> : favorites.map((item) => (
            <button key={item.articleId} type="button" className={selected === item.articleId ? "is-active" : ""} onClick={() => { setSelected(item.articleId); setNarrowDetail(true) }}>{titleOf(item.articleId)}</button>
          ))
        ) : null}
        {section === "excerpts" ? (
          highlights.length === 0 ? <p className="empty-next">从文章中选中文字，保存为摘录。</p> : highlights.map((item) => (
            <button key={item.id} type="button" className={selected === item.id ? "is-active" : ""} onClick={() => { setSelected(item.id); setNarrowDetail(true) }}>{item.quote.slice(0, 28)}</button>
          ))
        ) : null}
        {section === "notes" ? (
          notes.length === 0 ? <p className="empty-next">在阅读器里打开笔记，写下第一段。</p> : notes.map((item) => (
            <button key={item.id} type="button" className={selected === item.id ? "is-active" : ""} onClick={() => { setSelected(item.id); setNarrowDetail(true) }}>{item.body.slice(0, 28)}</button>
          ))
        ) : null}
        {section === "topics" ? (
          <>
            <Link to="/me/topics/new">新建专题</Link>
            {topics.length === 0 ? <p className="empty-next">新建一个专题，把摘录和自己的话放在一起。</p> : null}
            {topics.map((item) => (
              <button key={item.id} type="button" className={selected === item.id ? "is-active" : ""} onClick={() => { setSelected(item.id); setNarrowDetail(true) }}>{item.title}</button>
            ))}
          </>
        ) : null}
        {section === "drafts" ? (
          <button type="button" className={selected === DEMO_DRAFT.id ? "is-active" : ""} onClick={() => { setSelected(DEMO_DRAFT.id); setNarrowDetail(true) }}>{DEMO_DRAFT.title}</button>
        ) : null}
      </div>
      <aside className="mine-preview">
        {narrowDetail ? <button type="button" onClick={() => setNarrowDetail(false)}>返回列表</button> : null}
        <Preview
          section={section}
          selected={selected}
          titleOf={titleOf}
          favorites={favorites}
          highlights={highlights}
          notes={notes}
          topics={topics}
          drafts={drafts}
        />
      </aside>
    </div>
  )
}

function Preview({
  section,
  selected,
  titleOf,
  favorites,
  highlights,
  notes,
  topics,
  drafts,
}: {
  section: Section
  selected: string
  titleOf: (id: string) => string
  favorites: ReadingState[]
  highlights: Highlight[]
  notes: Note[]
  topics: PersonalTopic[]
  drafts: AiDraft[]
}) {
  if (section === "favorites") {
    const item = favorites.find((entry) => entry.articleId === selected) ?? favorites[0]
    if (!item) return null
    return <p><Link to={`/read/${item.articleId}`}>{titleOf(item.articleId)}</Link></p>
  }
  if (section === "excerpts") {
    const item = highlights.find((entry) => entry.id === selected) ?? highlights[0]
    if (!item) return null
    return (
      <article>
        <blockquote>{item.quote}</blockquote>
        {item.note ? <p>{item.note}</p> : <p className="meta">还没有批注。</p>}
        <p><Link to={`/read/${item.articleId}`}>{titleOf(item.articleId)}</Link></p>
      </article>
    )
  }
  if (section === "notes") {
    const item = notes.find((entry) => entry.id === selected) ?? notes[0]
    if (!item) return null
    return (
      <article>
        <p>{item.body}</p>
        <p><Link to={`/read/${item.articleId}`}>{titleOf(item.articleId)}</Link></p>
      </article>
    )
  }
  if (section === "topics") {
    const item = topics.find((entry) => entry.id === selected)
    if (!item) return <p className="meta">选一个专题，或新建。</p>
    return (
      <article>
        <h2>{item.title}</h2>
        {item.blocks.map((block) => block.kind === "text" ? <p key={block.id}>{block.body}</p> : <blockquote key={block.id}>{block.quote}</blockquote>)}
        <Link to={`/me/topics/${item.id}`}>编辑</Link>
      </article>
    )
  }
  const saved = drafts.find((draft) => draft.id === DEMO_DRAFT.id)
  return (
    <article>
      <p className="kicker">演示 · 不是模型生成</p>
      <h2>{DEMO_DRAFT.title}</h2>
      <p>{DEMO_DRAFT.body}</p>
      <p className="meta">{saved ? "已确认保存。" : "尚未写入。到这篇草稿里确认后才会保存。"}</p>
    </article>
  )
}
