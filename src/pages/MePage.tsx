import { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { useLibrary } from "../library/context.tsx"
import { COLUMN_NAME } from "../domain/labels.ts"
import { DEMO_DRAFT } from "../domain/demoDraft.ts"

const sections = { favorites: "收藏", excerpts: "摘录", notes: "笔记", topics: "专题", drafts: "对话整理" } as const
type Section = keyof typeof sections
interface Item { id: string; title: string; body: string; url?: string; meta: string; quote?: string }
type Collection = Record<Section, Item[]>
const emptyText = {
  favorites: "在文章中点收藏，就能在这里找到它。",
  excerpts: "在正文中选中文字后点划线，摘录会保存在这里。",
  notes: "在阅读器中写下第一条笔记，就能在这里回看。",
  topics: "新建专题，把相关的摘录和想法整理到一起。",
  drafts: "已保存的对话整理会出现在这里。",
}
function date(value: string) { return new Date(value).toLocaleDateString("zh-CN") }

export function MePage() {
  const lib = useLibrary()
  const [params, setParams] = useSearchParams()
  const raw = params.get("tab") ?? "favorites"
  const section = Object.hasOwn(sections, raw) ? raw as Section : "favorites"
  const [data, setData] = useState<Collection | null>(null)
  const [error, setError] = useState("")
  useEffect(() => {
    let active = true
    Promise.all([lib.store.listArticles(), lib.store.listReading(), lib.store.listHighlights(), lib.store.listNotes(), lib.store.listPersonalTopics(), lib.store.listDrafts()])
      .then(([articles, reading, marks, notes, topics, drafts]) => {
        if (!active) return
        const byId = new Map(articles.map(a => [a.id, a]))
        const source = (id: string) => ({ title: byId.get(id)?.title ?? "来源文章已移除", url: byId.has(id) ? "/read/" + id : undefined })
        setError("")
        setData({
          favorites: reading.filter(r => r.favorite).map(r => {
            const a = byId.get(r.articleId)
            return { id: r.articleId, ...source(r.articleId), body: a?.summary ?? "", meta: a ? COLUMN_NAME[a.columnId] : "" }
          }),
          excerpts: marks.map(m => ({id:m.id, ...source(m.articleId), quote:m.quote, body:m.note, meta:date(m.createdAt)})),
          notes: notes.map(n => ({id:n.id, ...source(n.articleId), body:n.body, meta:date(n.updatedAt)})),
          topics: topics.map(t => ({id:t.id, title:t.title, body:t.description, url:"/me/topics/" + t.id, meta:t.blocks.length + " 个段落"})),
          drafts: drafts.map(d => ({id:d.id, title:d.title, body:d.body, meta:(d.demo ? "演示 · " : "") + date(d.createdAt)})),
        })
      }).catch(() => { if (active) setError("藏书读取失败，请重新打开此页。") })
    return () => { active = false }
  }, [lib.store, lib.tick])
  useEffect(() => { document.title = sections[section] + " · 我的藏书" }, [section])
  const items = data?.[section] ?? []
  const annotation = section === "notes" || section === "excerpts"
  return <div className="page collection-page">
    <header className="collection-head"><h1>我的藏书</h1>{section === "topics" && <Link className="btn btn-solid" to="/me/topics/new">新建专题</Link>}</header>
    <nav className="collection-tabs" aria-label="藏书分类">{(Object.keys(sections) as Section[]).map(k =>
      <Link key={k} to={"?tab=" + k} aria-current={k === section ? "page" : undefined} onClick={e => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
        e.preventDefault()
        setParams({tab:k}, {replace:true})
      }}>{sections[k]}{data && <small>{data[k].length}</small>}</Link>
    )}</nav>
    {error ? <p role="alert">{error}</p> : !data ? <p>正在打开藏书…</p> : items.length === 0 ? <div className="collection-empty"><p>{emptyText[section]}</p>{section !== "topics" && <Link to="/library">浏览书架 →</Link>}</div> : null}
    <div className="collection-entries">{items.map(i => <article key={i.id}>
      <div className="collection-meta">{sections[section]} · {i.meta}</div>
      {annotation ? <>
        {i.quote && <blockquote>{i.quote}</blockquote>}
        {i.body && <p className="own-words">{i.body}</p>}
        <footer>原文　{i.url ? <Link to={i.url} state={{collectionTab:section}}>{i.title} ↗</Link> : i.title}</footer>
      </> : <>
        <h2>{i.url ? <Link to={i.url} state={{collectionTab:section}}>{i.title} ↗</Link> : i.title}</h2>
        {i.body && <p>{i.body}</p>}
      </>}
    </article>)}</div>
    {section === "drafts" && data && !items.some(i => i.id === DEMO_DRAFT.id) && <details className="collection-example"><summary>查看整理示例</summary><h2>{DEMO_DRAFT.title}</h2><p>{DEMO_DRAFT.body}</p></details>}
  </div>
}
