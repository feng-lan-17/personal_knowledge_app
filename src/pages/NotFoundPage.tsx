import { Link } from "react-router-dom"

export function NotFoundPage() {
  return (
    <div className="page" style={{ paddingTop: "2rem" }}>
      <h1 className="block-title">这一页不在库里</h1>
      <p>
        <Link to="/">回首页</Link>
      </p>
    </div>
  )
}
