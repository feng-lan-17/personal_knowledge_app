import { Link, useNavigate } from "react-router-dom"

export function BackLink({ fallback, label = "返回" }: { fallback: string; label?: string }) {
  const navigate = useNavigate()
  return <Link className="back-control" to={fallback} onClick={(event) => {
    if (event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey && window.history.state?.idx > 0) {
      event.preventDefault()
      navigate(-1)
    }
  }}><span aria-hidden="true">←</span> {label}</Link>
}
