import { useEffect, useRef, useState } from "react"
import { NavLink, Outlet, useLocation } from "react-router-dom"
import { useLibraryState } from "../library/context.tsx"
import { Omnibox } from "./Omnibox.tsx"
import { Dialog, DialogContent, DialogTitle } from "./ui/dialog.tsx"

const CENTER = [
  ["/", "首页"],
  ["/library", "知识库"],
  ["/discover", "发现"],
  ["/me", "我的藏书"],
] as const

export function Shell() {
  const state = useLibraryState()
  const location = useLocation()
  const reading = location.pathname.startsWith("/read/")
  const [palette, setPalette] = useState(false)
  const searchOrigin = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        if (reading) {
          if (document.activeElement instanceof HTMLElement && !document.activeElement.closest('[role="dialog"]')) searchOrigin.current = document.activeElement
          setPalette(true)
        }
        else document.querySelector<HTMLInputElement>("#library-search input")?.focus()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [reading])

  return (
    <div className={reading ? "app-frame" : "app-frame desktop-library"}>
      <a className="skip" href="#content">跳到正文</a>
      {reading ? null : (
        <header className="topbar">
          <div className="topbar-inner">
            <NavLink to="/" className="brand" end>
              <span className="brand-symbol" aria-hidden="true"><i /><i /><i /></span>
              <span className="brand-name">私人知识图书馆</span>
            </NavLink>
            <div id="library-search">{state.status === "ready" && <Omnibox />}</div>
            <nav className="topnav" aria-label="主导航">
              {CENTER.map(([href, label]) => (
                <NavLink key={href} to={href} end={href === "/" || href === "/library"}>{label}</NavLink>
              ))}
            </nav>
            <nav className="shelf-shortcuts" aria-label="领域书架">
              <p>书架</p>
              {[["llm", "大模型"], ["essay", "散文"], ["csp", "CSP 算法"], ["gs", "高斯溅射"]].map(([id, label]) => <NavLink key={id} to={`/library/${id}`}>{label}</NavLink>)}
            </nav>
            <div className="top-tools">
              <NavLink to="/ask" className="full-search">全文检索</NavLink>
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
      {palette && state.status === "ready" ? (
        <Dialog open onOpenChange={setPalette}>
          <DialogContent className="reader-search-dialog" aria-describedby={undefined} onCloseAutoFocus={(event) => {
            event.preventDefault()
            searchOrigin.current?.focus({ preventScroll: true })
          }}>
            <DialogTitle>搜索知识库</DialogTitle>
            <Omnibox autoFocus onNavigate={() => setPalette(false)} />
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  )
}
