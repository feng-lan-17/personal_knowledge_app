import { BrowserRouter, Route, Routes } from "react-router-dom"
import { Shell } from "./components/Shell.tsx"
import { LibraryProvider } from "./library/context.tsx"
import { AskPage } from "./pages/AskPage.tsx"
import { ColumnPage } from "./pages/ColumnPage.tsx"
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
