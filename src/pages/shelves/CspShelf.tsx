import { BackLink } from "../../components/BackLink.tsx"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { PROBLEM_TOPIC, PROBLEMS, type ProblemEntry } from "../../content/problems.ts"

const FILTERS = ["all", "io", "sim", "sort", "search", "dp"] as const

export function CspShelf() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all")
  useEffect(() => {
    document.title = "CSP · 私人知识图书馆"
  }, [])
  const rows = PROBLEMS.filter((problem) => filter === "all" || problem.topic === filter)
  return (
    <div className="page shelf csp-shelf">
      <header className="shelf-head">
        <p className="kicker">算法手册</p>
        <h1>CSP 算法与题解</h1>
      </header>
      <div className="algo-open">
        <article>
          <svg viewBox="0 0 120 48" aria-hidden="true" className="mini-bars">
            <rect x="4" y="28" width="12" height="16" />
            <rect x="22" y="18" width="12" height="26" />
            <rect x="40" y="10" width="12" height="34" />
            <rect x="58" y="22" width="12" height="22" />
            <rect x="76" y="6" width="12" height="38" />
          </svg>
          <h2>排序之后才能二分</h2>
          <p>无序数组里找一个数要看完；排好以后可以折半。先看这五根从矮到高并不整齐的柱子，再读教程。</p>
          <Link to="/read/csp-sort">阅读排序与二分</Link>
        </article>
        <article>
          <p className="formula">f[j] = max(f[j], f[j − w] + v)</p>
          <h2>背包先问最后一件拿不拿</h2>
          <p>容量从大到小更新，同一件才不会被用两次。</p>
          <Link to="/read/csp-search">阅读搜索与规划</Link>
        </article>
      </div>
      <h2 className="shelf-section-title">题解索引</h2>
      <div className="filter-row" role="group" aria-label="按主题筛选">
        {FILTERS.map((item) => (
          <button key={item} type="button" aria-pressed={filter === item} onClick={() => setFilter(item)}>
            {item === "all" ? "全部" : PROBLEM_TOPIC[item]}
          </button>
        ))}
      </div>
      <table className="problem-index">
        <thead>
          <tr><th>题号</th><th>题名</th><th>标签</th><th>题源</th></tr>
        </thead>
        <tbody>
          {rows.map((problem) => (
            <tr key={problem.id}>
              <td><Link to={`/library/csp/p/${problem.id}`}>{problem.id}</Link></td>
              <td><Link to={`/library/csp/p/${problem.id}`}>{problem.title}</Link></td>
              <td>{problem.tags.join("、")}</td>
              <td>{problem.source}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="meta">题面在原站。这里的观察和代码是原创示例，不能在本程序里运行或评测。</p>
    </div>
  )
}

export function ProblemPage({ problem }: { problem: ProblemEntry }) {
  const [copied, setCopied] = useState("")
  useEffect(() => {
    document.title = `${problem.id} · 题解`
  }, [problem.id])
  return (
    <div className="page shelf problem-page">
      <nav className="detail-route"><BackLink fallback="/library/csp" /></nav>
      <p className="kicker">{problem.id} · {problem.source}</p>
      <h1>{problem.title}</h1>
      <p className="meta">{problem.tags.join(" · ")}</p>
      <h2>关键观察</h2>
      <p className="lede">{problem.observation}</p>
      <p className="complexity">{problem.complexity}</p>
      <details>
        <summary>提示</summary>
        <p>{problem.hint}</p>
      </details>
      <details>
        <summary>推演</summary>
        <p>{problem.derivation}</p>
      </details>
      <details open>
        <summary>完整代码</summary>
        <div className="code-frame">
          <div className="code-bar">
            <span>C++</span>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(problem.code).then(
                  () => setCopied("已复制"),
                  () => setCopied("复制失败"),
                )
              }}
            >
              复制
            </button>
            {copied ? <em>{copied}</em> : null}
          </div>
          <pre><code>{problem.code}</code></pre>
        </div>
      </details>
      <p><a href={problem.url} target="_blank" rel="noreferrer">在{problem.source}打开题面</a></p>
    </div>
  )
}
