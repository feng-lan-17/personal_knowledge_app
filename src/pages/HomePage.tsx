import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import type { Article, Discovery, ReadingState } from "../domain/types.ts"
import { useLibrary } from "../library/context.tsx"

const SHELVES = [
  { id: "llm", href: "/library/llm", title: "大模型", how: "双路线教材与百科", symbol: "✳" },
  { id: "essay", href: "/library/essay", title: "散文", how: "按作者或主题阅读", symbol: "文" },
  { id: "csp", href: "/library/csp", title: "CSP", how: "算法专题与题解", symbol: "{ }" },
  { id: "gs", href: "/library/gs", title: "高斯溅射", how: "技术手册、排查与前沿", symbol: "◉" },
] as const

const PICKS = [
  { href: "/read/llm-build", title: "注意力与一次训练", why: "只保留读 Transformer 时躲不开的缩放点积，不绑某个框架的版本。" },
  { href: "/library/csp/p/P1047", title: "一道题读懂区间模拟", why: "把道路上的树转成数组，用一段小程序解释区间标记。" },
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
      <div className="edition-heading">
        <h1>编辑精选</h1>
        {continueArticle ? (
        <p className="continue" data-testid="continue-reading">
          <span>继续阅读</span>
          <Link to={`/read/${continueArticle.id}`}>{continueArticle.title}</Link>
          <em>{latest?.anchor || continueArticle.path.at(-1) || "开头"}</em>
        </p>
        ) : null}
      </div>

      <section className="cover" data-testid="home-hero">
        <Link className="cover-main" to={`/read/${cover.id}`}>
          <div className="cover-copy">
            <p className="kicker">高斯溅射 · 原理</p>
            <h2>用一组椭球<br />把场景画出来</h2>
            <p>从稀疏点到可从新视角观看的三维场景，理解高斯如何叠加成像。</p>
            <span className="read-entry">阅读文章 <span aria-hidden="true">↗</span></span>
          </div>
          <img src="/figures/reading-room-cover.webp" alt="" />
        </Link>
        <div className="cover-side">
          <Link className="side-essay" to={`/read/${essay.id}`}>
            <p className="kicker">散文</p>
            <h2>{essay.title}</h2>
            <p>{essay.subtitle}</p>
            <span className="story-arrow" aria-hidden="true">↗</span>
          </Link>
          <Link className="side-note" to={`/read/${second.id}`}>
            <p className="kicker">大模型</p>
            <h2>从一次对话看懂模型</h2>
            <p>{second.subtitle}</p>
            <span className="story-arrow" aria-hidden="true">↗</span>
          </Link>
        </div>
      </section>

      <div className="section-heading"><h2>浏览书架</h2><Link to="/library">全部文章 <span aria-hidden="true">↗</span></Link></div>
      <nav className="shelf-row" aria-label="四个书架">
        {SHELVES.map((shelf) => (
          <Link key={shelf.id} to={shelf.href} data-shelf={shelf.id}>
            <span className="shelf-symbol" aria-hidden="true">{shelf.symbol}</span>
            <div><strong>{shelf.title}</strong><span>{shelf.how}</span></div>
            <span className="shelf-arrow" aria-hidden="true">↗</span>
          </Link>
        ))}
      </nav>

      <section className="picks">
        <h2>继续探索</h2>
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
        <div className="section-heading"><h2>资料线索</h2><Link to="/discover">查看发现 <span aria-hidden="true">↗</span></Link></div>
        <ul>
          {[...discoveries].sort((a, b) => b.addedAt.localeCompare(a.addedAt)).map((item) => (
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
