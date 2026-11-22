import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { COLUMN_NAME, SAMPLE_LABEL } from "../domain/labels.ts"
import type { Article, Column, Discovery, ReadingState, Topic } from "../domain/types.ts"
import { useLibrary } from "../library/context.tsx"

export function HomePage() {
  const lib = useLibrary()
  const [articles, setArticles] = useState<Article[]>([])
  const [columns, setColumns] = useState<Column[]>([])
  const [discoveries, setDiscoveries] = useState<Discovery[]>([])
  const [reading, setReading] = useState<ReadingState[]>([])
  const [topics, setTopics] = useState<Topic[]>([])

  useEffect(() => {
    let cancel = false
    void Promise.all([
      lib.store.listArticles(),
      lib.store.listColumns(),
      lib.store.listDiscoveries(),
      lib.store.listReading(),
      lib.store.listTopics(),
    ]).then(([nextArticles, nextColumns, nextDiscoveries, nextReading, nextTopics]) => {
      if (cancel) return
      setArticles(nextArticles)
      setColumns(nextColumns)
      setDiscoveries(nextDiscoveries)
      setReading(nextReading)
      setTopics(nextTopics)
    })
    document.title = "私人知识图书馆"
    return () => {
      cancel = true
    }
  }, [lib.store, lib.tick])

  const canonical = articles.filter((article) => article.layer === "canonical")
  const hero = canonical.find((article) => article.hero) ?? canonical[0]
  const side = (["csp", "essay", "gs"] as const)
    .map((columnId) => canonical.find((article) => article.columnId === columnId && article.featured) ?? canonical.find((article) => article.columnId === columnId))
    .filter((article): article is Article => Boolean(article))
  const disciplines = columns.filter((column) => column.id !== "inbox")
  const roots = topics.filter((topic) => topic.parentId === null && topic.columnId !== "inbox")
  const recentDiscoveries = discoveries.slice(0, 3)
  const recent = reading
    .filter((item) => item.lastReadAt)
    .sort((a, b) => (b.lastReadAt ?? "").localeCompare(a.lastReadAt ?? ""))
    .slice(0, 4)
    .map((item) => ({ state: item, article: articles.find((article) => article.id === item.articleId) }))
    .filter((item): item is { state: ReadingState; article: Article } => Boolean(item.article))

  if (!hero) return <p className="gate">库里还没有文章。</p>

  return (
    <div className="page">
      <section className="hero" data-testid="home-hero">
        <div>
          <p className="kicker">
            {COLUMN_NAME[hero.columnId]} · {SAMPLE_LABEL[hero.sampleKind]}
          </p>
          <h1>
            <Link to={`/read/${hero.id}`}>{hero.title}</Link>
          </h1>
          <p className="deck">{hero.summary}</p>
          <p className="meta" style={{ marginTop: "0.9rem" }}>
            {hero.author} · 约 {hero.readingMinutes} 分钟
          </p>
          <p style={{ marginTop: "1rem" }}>
            <Link to={`/read/${hero.id}`}>进入阅读</Link>
          </p>
        </div>
        <aside className="hero-side">
          <p className="side-label">这一期</p>
          {side.map((article) => (
            <Link key={article.id} className="side-item" to={`/read/${article.id}`}>
              <span className="kicker">{COLUMN_NAME[article.columnId]}</span>
              <strong>{article.title}</strong>
            </Link>
          ))}
        </aside>
      </section>

      <section className="section">
        <h2>四门学科</h2>
        <div className="disciplines">
          {disciplines.map((column) => (
            <Link key={column.id} className="discipline" to={`/library/${column.id}`}>
              <span className="kicker">{column.kicker}</span>
              <strong>{column.title}</strong>
              <span>{column.summary}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section split">
        <div>
          <h2>重要专题</h2>
          <ul className="plain-list">
            {roots.map((topic) => (
              <li key={topic.id}>
                <Link to={`/library/${topic.columnId}`}>
                  <b>{topic.title}</b>
                </Link>
                <span className="meta"> · {COLUMN_NAME[topic.columnId]} · {topic.summary}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2>最近发现</h2>
          <p className="caution">候选和入口，不是已经审定的教材。</p>
          <ul className="plain-list">
            {recentDiscoveries.map((item) => (
              <li key={item.id}>
                <Link to={`/discover/${item.id}`}>{item.title}</Link>
                <p className="meta">{item.caution}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section">
        <h2>最近阅读</h2>
        {recent.length ? (
          <ul className="plain-list">
            {recent.map(({ article, state }) => (
              <li key={article.id}>
                <Link to={`/read/${article.id}`}>{article.title}</Link>
                <span className="meta">
                  {" "}
                  · {COLUMN_NAME[article.columnId]}
                  {state.isRead ? " · 已读" : ""}
                  {state.favorite ? " · 收藏" : ""}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="meta">还没有阅读记录。从一篇文章打开即可，这里只记住你最近打开过什么。</p>
        )}
      </section>
    </div>
  )
}
