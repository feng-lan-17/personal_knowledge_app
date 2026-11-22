import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { COLUMN_NAME, SAMPLE_LABEL } from "../domain/labels.ts"
import type { Article, Column, ColumnId, SearchHit, Topic } from "../domain/types.ts"
import { Button } from "../components/ui/button.tsx"
import { Input } from "../components/ui/input.tsx"
import { useLibrary } from "../library/context.tsx"

export function ColumnPage() {
  const { columnId = "" } = useParams()
  const lib = useLibrary()
  const [column, setColumn] = useState<Column | null>(null)
  const [topics, setTopics] = useState<Topic[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [query, setQuery] = useState("")
  const [hits, setHits] = useState<SearchHit[] | null>(null)

  useEffect(() => {
    let cancel = false
    void Promise.all([lib.store.listColumns(), lib.store.listTopics(columnId as ColumnId), lib.store.listArticles()]).then(
      ([columns, nextTopics, nextArticles]) => {
        if (cancel) return
        setColumn(columns.find((item) => item.id === columnId) ?? null)
        setTopics(nextTopics)
        setArticles(nextArticles.filter((article) => article.columnId === columnId))
        document.title = `${COLUMN_NAME[columnId as ColumnId] ?? "栏目"} · 私人知识图书馆`
      },
    )
    return () => {
      cancel = true
    }
  }, [columnId, lib.store, lib.tick])

  if (!column) return <p className="gate">没有这个栏目。</p>
  const featured = articles.filter((article) => article.featured)
  const roots = topics.filter((topic) => topic.parentId === null)

  return (
    <div className="page">
      <header className="search-hero">
        <p className="kicker">{column.kicker}</p>
        <h1>{column.title}</h1>
        <p className="deck">{column.intro}</p>
      </header>
      <form
        className="row"
        style={{ marginTop: "1.2rem" }}
        onSubmit={(event) => {
          event.preventDefault()
          if (!query.trim()) {
            setHits(null)
            return
          }
          void lib.store.search(query, { columnId: column.id }).then(setHits)
        }}
      >
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`在${column.title}中检索`} aria-label="栏目内搜索" />
        <Button variant="solid" type="submit">
          检索
        </Button>
        {hits ? (
          <Button
            type="button"
            onClick={() => {
              setHits(null)
              setQuery("")
            }}
          >
            返回目录
          </Button>
        ) : null}
      </form>

      {hits ? (
        <section className="section">
          <h2>栏内结果</h2>
          {hits.length ? (
            hits.map((hit) => (
              <article key={hit.articleId} className="hit">
                <Link to={`/read/${hit.articleId}`}>{hit.title}</Link>
                <p className="snippet">{hit.snippet}</p>
              </article>
            ))
          ) : (
            <p>这一栏里没有直接命中。</p>
          )}
        </section>
      ) : (
        <>
          {featured.length ? (
            <section className="section">
              <h2>精选</h2>
              <ul className="plain-list">
                {featured.map((article) => (
                  <li key={article.id}>
                    <Link to={`/read/${article.id}`}>{article.title}</Link>
                    <span className="meta"> · {SAMPLE_LABEL[article.sampleKind]}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          <section className="section">
            <h2>目录</h2>
            {roots.map((topic) => (
              <TopicBlock key={topic.id} topic={topic} topics={topics} articles={articles} />
            ))}
          </section>
          <section className="section">
            <h2>相关文章</h2>
            <ul className="plain-list">
              {articles.flatMap((article) =>
                article.relatedIds
                  .map((id) => articles.find((item) => item.id === id))
                  .filter((item): item is Article => Boolean(item))
                  .map((item) => (
                    <li key={`${article.id}-${item.id}`}>
                      <Link to={`/read/${article.id}`}>{article.title}</Link>
                      <span className="meta"> → </span>
                      <Link to={`/read/${item.id}`}>{item.title}</Link>
                    </li>
                  )),
              )}
            </ul>
          </section>
        </>
      )}
    </div>
  )
}

function TopicBlock({ topic, topics, articles }: { topic: Topic; topics: Topic[]; articles: Article[] }) {
  const children = topics.filter((item) => item.parentId === topic.id)
  const own = articles.filter((article) => article.primaryTopicId === topic.id)
  return (
    <details className="topic" open>
      <summary>{topic.title}</summary>
      {topic.summary ? <p className="topic-summary">{topic.summary}</p> : null}
      <ul className="plain-list">
        {own.map((article) => (
          <li key={article.id}>
            <Link to={`/read/${article.id}`}>{article.title}</Link>
          </li>
        ))}
      </ul>
      {children.map((child) => {
        const nested = articles.filter((article) => article.primaryTopicId === child.id)
        return (
          <div className="subtopic" key={child.id}>
            <h3>{child.title}</h3>
            <p className="meta">{child.summary}</p>
            <ul className="plain-list">
              {nested.map((article) => (
                <li key={article.id}>
                  <Link to={`/read/${article.id}`}>{article.title}</Link>
                </li>
              ))}
              {nested.length === 0 ? <li className="meta">这一节目前只有说明，没有单独成篇。</li> : null}
            </ul>
          </div>
        )
      })}
    </details>
  )
}
