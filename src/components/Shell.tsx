import { useEffect, useState } from "react"
import { NavLink, Outlet, useLocation } from "react-router-dom"
import { useLibraryState } from "../library/context.tsx"
import { Omnibox } from "./Omnibox.tsx"

const CENTER = [
  ["/library/llm", "大模型"],
  ["/library/essay", "散文"],
  ["/library/csp", "CSP"],
  ["/library/gs", "高斯"],
] as const

export function Shell() {
  const state = useLibraryState()
  const location = useLocation()
  const reading = location.pathname.startsWith("/read/")
  const [palette, setPalette] = useState(false)
  const engine = state.status === "ready" ? `${state.info.engineLabel} · ${state.info.locationLabel}` : state.status === "error" ? state.message : "正在打开本地库"

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        if (reading) setPalette(true)
        else document.getElementById("library-search")?.focus()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [reading])

  return (
    <div className="app-frame">
      <a className="skip" href="#content">跳到正文</a>
      {reading ? null : (
        <header className="topbar">
          <div className="topbar-inner">
            <NavLink to="/" className="brand" end>
              <span className="seal">藏</span>
              <span className="brand-name">私人知识图书馆</span>
            </NavLink>
            <nav className="topnav" aria-label="书架">
              {CENTER.map(([href, label]) => (
                <NavLink key={href} to={href}>{label}</NavLink>
              ))}
            </nav>
            <div className="top-tools">
              {state.status === "ready" ? (
                <div id="library-search">
                  <Omnibox />
                </div>
              ) : (
                <span className="meta">{engine}</span>
              )}
              <NavLink to="/me">藏书</NavLink>
              <NavLink to="/settings">设置</NavLink>
            </div>
          </div>
        </header>
      )}
      <main id="content">
        {state.status === "loading" ? <p className="gate">正在打开本地库…</p> : null}
        {state.status === "error" ? <p className="gate">{state.message}</p> : null}
        {state.status === "ready" ? <Outlet /> : null}
      </main>
      {reading ? null : (
        <footer className="site-footer">
          <p data-testid="engine-label">{engine}</p>
        </footer>
      )}
      {palette && state.status === "ready" ? (
        <div className="palette-layer" role="dialog" aria-label="搜索">
          <button className="palette-dismiss" type="button" aria-label="关闭搜索" onClick={() => setPalette(false)} />
          <div className="palette-card">
            <Omnibox autoFocus onNavigate={() => setPalette(false)} />
          </div>
        </div>
      ) : null}
    </div>
  )
}
