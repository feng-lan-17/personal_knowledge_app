import { useParams } from "react-router-dom"
import { PROBLEMS } from "../content/problems.ts"
import { AuthorShelf, EssayShelf } from "./shelves/EssayShelf.tsx"
import { CspShelf, ProblemPage } from "./shelves/CspShelf.tsx"
import { GsFrontierPage, GsShelf, GsTroublePage } from "./shelves/GsShelf.tsx"
import { LlmShelf } from "./shelves/LlmShelf.tsx"

export function ColumnPage() {
  const { columnId = "" } = useParams()
  if (columnId === "llm") return <LlmShelf />
  if (columnId === "essay") return <EssayShelf />
  if (columnId === "csp") return <CspShelf />
  if (columnId === "gs") return <GsShelf />
  return <p className="gate">没有这个书架。</p>
}

export function EssayAuthorsRoute() {
  return <AuthorShelf />
}

export function CspProblemRoute() {
  const { problemId = "" } = useParams()
  const problem = PROBLEMS.find((item) => item.id === problemId)
  if (!problem) return <p className="gate">题解索引里没有 {problemId}。</p>
  return <ProblemPage problem={problem} />
}

export function GsTroubleRoute() {
  return <GsTroublePage />
}

export function GsFrontierRoute() {
  return <GsFrontierPage />
}
