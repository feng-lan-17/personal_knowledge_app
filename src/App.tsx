import { BrowserRouter, Route, Routes } from "react-router-dom"
import { Shell } from "./components/Shell.tsx"
import { LibraryProvider } from "./library/context.tsx"
import { AskPage } from "./pages/AskPage.tsx"
import { ColumnPage, CspProblemRoute, EssayAuthorsRoute, GsFrontierRoute, GsTroubleRoute } from "./pages/ColumnPage.tsx"
import { EncyclopediaPage } from "./pages/EncyclopediaPage.tsx"
import { DiscoverPage } from "./pages/DiscoverPage.tsx"
import { HomePage } from "./pages/HomePage.tsx"
import { LibraryPage } from "./pages/LibraryPage.tsx"
import { MePage } from "./pages/MePage.tsx"
import { NotFoundPage } from "./pages/NotFoundPage.tsx"
import { ReaderPage } from "./pages/ReaderPage.tsx"
import { SettingsPage } from "./pages/SettingsPage.tsx"
import { TopicPage } from "./pages/TopicPage.tsx"

export function App() {
  return (
    <LibraryProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Shell />}>
            <Route index element={<HomePage />} />
            <Route path="library" element={<LibraryPage />} />
            <Route path="library/llm/encyclopedia" element={<EncyclopediaPage />} />
            <Route path="library/llm/encyclopedia/:termId" element={<EncyclopediaPage />} />
            <Route path="library/essay/authors" element={<EssayAuthorsRoute />} />
            <Route path="library/csp/p/:problemId" element={<CspProblemRoute />} />
            <Route path="library/gs/trouble" element={<GsTroubleRoute />} />
            <Route path="library/gs/frontier" element={<GsFrontierRoute />} />
            <Route path="library/:columnId" element={<ColumnPage />} />
            <Route path="read/:id" element={<ReaderPage />} />
            <Route path="discover" element={<DiscoverPage />} />
            <Route path="discover/:id" element={<DiscoverPage />} />
            <Route path="ask" element={<AskPage />} />
            <Route path="me" element={<MePage />} />
            <Route path="me/topics/:id" element={<TopicPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </LibraryProvider>
  )
}
