import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { COLUMN_NAME } from "../domain/labels.ts"
import type { Article, Discovery, ReadingState } from "../domain/types.ts"
import { useLibrary } from "../library/context.tsx"

const SHELVES = [
  { id: "llm", href: "/library/llm", title: "大模型", how: "两条阅读路线，外加可查的百科" },
  { id: "essay", href: "/library/essay", title: "散文", how: "一篇主稿，其余按作者或主题查阅" },
  { id: "csp", href: "/library/csp", title: "CSP", how: "算法手册，题解可以按主题筛选" },
  { id: "gs", href: "/library/gs", title: "高斯溅射", how: "查参数、排查现象、核对来源" },
] as const

const PICKS = [
  { href: "/read/llm-dialogue", title: "从一次对话看懂模型", why: "先看清发送之后实际发生的四步，再决定要不要读公式。" },
  { href: "/read/llm-build", title: "注意力与一次训练", why: "只保留读 Transformer 时躲不开的缩放点积，不绑某个框架的版本。" },
  { href: "/read/essay-rain", title: "雨落在旧车站的铁皮顶上", why: "原创散文，适合把工具收起来读完。不是任何出版作品的摘录。" },
  { href: "/library/gs/trouble", title: "重影和漂浮碎块", why: "先对上同一视角里的现象，再看可能原因，而不是先背接口名。" },
]

export function HomePage() {
  const lib = useLibrary()
  const [articles, setArticles] = useState<Article[]>([])
  const [discoveries, setDiscoveries] = useState<Discovery[]>([])
  const [reading, setReading] = useState<ReadingState[]>([])

  useEffect(() => {
    document.title = "私人知识图书馆"
    let cancel = false
    void Promise.all([lib.store.listArticles(), lib.store.listDiscoveries(), lib.store.listReading()]).then(([nextArticles, nextDiscoveries, nextReading]) => {
      if (cancel) return
      setArticles(nextArticles)
      setDiscoveries(nextDiscoveries)
      setReading(nextReading)
    })
    return () => {
      cancel = true
    }
  }, [lib.store, lib.tick])

  const cover = articles.find((article) => article.id === "gs-basics")
  const essay = articles.find((article) => article.id === "essay-rain")
  const second = articles.find((article) => article.id === "llm-dialogue")
  const latest = reading
    .filter((item) => item.lastReadAt)
    .sort((a, b) => (b.lastReadAt ?? "").localeCompare(a.lastReadAt ?? ""))[0]
  const continueArticle = latest ? articles.find((article) => article.id === latest.articleId) : undefined

  if (!cover || !essay || !second) return <p className="gate">正在准备封面…</p>

  return (
    <div className="page home-page">
      {continueArticle ? (
        <p className="continue" data-testid="continue-reading">
          <span>继续阅读</span>
          <Link to={`/read/${continueArticle.id}`}>{continueArticle.title}</Link>
          <em>{latest?.anchor || continueArticle.path.at(-1) || "开头"}</em>
        </p>
      ) : null}

      <section className="cover" data-testid="home-hero">
        <Link className="cover-main" to={`/read/${cover.id}`}>
          <img src="/figures/gs-cover.svg" alt="许多椭球叠成的室内一角，用来说明三维高斯溅射在画什么" />
          <div className="cover-copy">
            <p className="kicker">{COLUMN_NAME[cover.columnId]}</p>
            <h1>{cover.title}</h1>
            <p className="clamp">{cover.summary}</p>
            <span className="read-entry">阅读这篇</span>
          </div>
        </Link>
        <div className="cover-side">
          <Link className="side-essay" to={`/read/${essay.id}`}>
            <p className="kicker">散文</p>
            <h2>{essay.title}</h2>
            <p className="by">{essay.author}</p>
            <p>{essay.subtitle}</p>
          </Link>
          <Link className="side-note" to={`/read/${second.id}`}>
            <p className="kicker">大模型</p>
            <h2>{second.title}</h2>
            <p>{second.subtitle}</p>
          </Link>
        </div>
      </section>

      <nav className="shelf-row" aria-label="四个书架">
        {SHELVES.map((shelf) => (
          <Link key={shelf.id} to={shelf.href}>
            <strong>{shelf.title}</strong>
            <span>{shelf.how}</span>
          </Link>
        ))}
      </nav>

      <section className="picks">
        <h2>值得先打开</h2>
        <ol>
          {PICKS.map((pick) => (
            <li key={pick.href}>
              <Link to={pick.href}>{pick.title}</Link>
              <p>{pick.why}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="updates">
        <h2>来源与更新</h2>
        <p className="meta">这里是候选和入口，不是已经审定的教材。</p>
        <ul>
          {discoveries.map((item) => (
            <li key={item.id}>
              <time>{item.addedAt}</time>
              <Link to={`/discover/${item.id}`}>{item.title}</Link>
              <span>{item.caution}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
