import { NavLink, Outlet } from "react-router-dom"
import { useLibraryState } from "../library/context.tsx"

const NAV = [
  ["/", "首页"],
  ["/library", "知识库"],
  ["/discover", "发现"],
  ["/ask", "AI 搜索"],
  ["/me", "我的"],
  ["/settings", "设置"],
] as const

export function Shell() {
  const state = useLibraryState()
  const engine =
    state.status === "ready"
      ? `${state.info.engineLabel} · ${state.info.locationLabel}`
      : state.status === "error"
        ? "库没有打开"
        : "正在打开本地库"
  return (
    <div className="app-frame">
      <a className="skip" href="#content">
        跳到正文
      </a>
      <header className="mast">
        <NavLink to="/" className="brand" end>
          <span className="seal">藏</span>
          <span>
            <p className="brand-name">私人知识图书馆</p>
            <p className="brand-sub">长期阅读</p>
          </span>
        </NavLink>
        <nav className="nav" aria-label="主导航">
          {NAV.map(([href, label]) => (
            <NavLink key={href} to={href} end={href === "/"}>
              {label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main id="content">
        {state.status === "loading" ? <p className="gate">正在打开本地库…</p> : null}
        {state.status === "error" ? <p className="gate">{state.message}</p> : null}
        {state.status === "ready" ? <Outlet /> : null}
      </main>
      <footer className="site-footer">
        <p data-testid="engine-label">{engine}</p>
        <p>没有进度、打卡或积分。已读和收藏只用来以后把文章找回来。</p>
      </footer>
    </div>
  )
}
