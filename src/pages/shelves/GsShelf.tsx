import { BackLink } from "../../components/BackLink.tsx"
import { useEffect } from "react"
import { Link } from "react-router-dom"

const ACTIONS = [
  { href: "/read/gs-basics", title: "查参数", text: "均值、协方差、不透明度和叠加公式。" },
  { href: "/library/gs/trouble", title: "排查问题", text: "先对上重影或漂浮碎块，再看原因。" },
  { href: "/library/gs/frontier", title: "看前沿", text: "论文、项目与文档的原始出处。" },
]

export function GsShelf() {
  useEffect(() => {
    document.title = "高斯溅射 · 私人知识图书馆"
  }, [])
  return (
    <div className="page shelf gs-shelf">
      <header className="shelf-head gs-intro">
        <div>
        <p className="kicker">图文手册</p>
        <h1>高斯溅射</h1>
        <p>理解三维场景如何成像，再处理重建中的具体问题。</p>
        <Link className="read-entry" to="/read/gs-basics">阅读基础原理 <span aria-hidden="true">↗</span></Link>
        </div>
        <img src="/figures/reading-room-cover.webp" alt="" />
      </header>
      <div className="gs-actions">
        {ACTIONS.map((action) => (
          <Link key={action.href} to={action.href}>
            <strong>{action.title} <span aria-hidden="true">↗</span></strong>
            <span>{action.text}</span>
          </Link>
        ))}
      </div>
      <p><Link to="/read/gs-optimize">致密化与版本敏感的接口</Link></p>
    </div>
  )
}

export function GsTroublePage() {
  useEffect(() => {
    document.title = "排查 · 高斯溅射"
  }, [])
  return (
    <div className="page shelf">
      <nav className="detail-route"><BackLink fallback="/library/gs" /></nav>
      <p className="kicker">排查</p>
      <h1>重影和漂浮碎块</h1>
      <img className="compare" src="/figures/gs-compare.svg" alt="左图边缘清楚，右图同一物体出现重影，空中还有碎块" />
      <h2>可能原因</h2>
      <ul className="cause-list">
        <li>
          <strong>相机位姿漂了</strong>
          <p>验证：用校准后的相机重新对齐训练视角。若训练照片本身就重，先修位姿，而不是加长训练。</p>
        </li>
        <li>
          <strong>致密化在空处留下了高斯</strong>
          <p>验证：看不透明度很低、离表面很远的点。概念见优化一篇，具体删除阈值以你安装的版本为准。</p>
        </li>
        <li>
          <strong>视角没覆盖到的背面</strong>
          <p>验证：只在没参与训练的照片上检查。训练视角变清晰，不能说明新视角是对的。</p>
        </li>
      </ul>
    </div>
  )
}

export function GsFrontierPage() {
  useEffect(() => {
    document.title = "前沿来源 · 高斯溅射"
  }, [])
  const rows = [
    ["Kerbl 等，3D Gaussian Splatting", "2023-07", "ACM TOG 42(4)", "原文已核对题名", "https://arxiv.org/abs/2308.04079"],
    ["Kheradmand 等，3DGS as MCMC", "2024", "arXiv:2404.09591", "时效待核验", "https://arxiv.org/abs/2404.09591"],
    ["gsplat 文档", "随仓库变化", "不写死版本号", "接口待核验", "https://docs.gsplat.studio/main/"],
  ]
  return (
    <div className="page shelf">
      <nav className="detail-route"><BackLink fallback="/library/gs" /></nav>
      <p className="kicker">前沿 · 来源示例</p>
      <h1>可追溯的来源</h1>
      <p>编写于 2026-11-22，之后没有再巡检。这不是教材更新。</p>
      <table className="source-table">
        <thead>
          <tr><th>来源</th><th>发表</th><th>适用版本</th><th>核验</th></tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[0]}>
              <td><a href={row[4]} target="_blank" rel="noreferrer">{row[0]}</a></td>
              <td>{row[1]}</td>
              <td>{row[2]}</td>
              <td>{row[3]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
