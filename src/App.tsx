import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { Shell } from './components/Shell'
import { Footer } from './components/Footer'
import { Discover } from './routes/Discover'
import { VariantDetail } from './routes/VariantDetail'
import { About } from './routes/About'
import { NotFound } from './routes/NotFound'
import { metaFor } from './lib/meta'

/** Each route is prerendered with its own title and description; this keeps them
 *  right after a client-side navigation, from the same derivation the build
 *  uses. */
function useDocumentMeta() {
  const { pathname } = useLocation()

  useEffect(() => {
    const { title, description } = metaFor(pathname)
    document.title = title
    document.querySelector('meta[name="description"]')?.setAttribute('content', description)
  }, [pathname])
}

function Titled({ children }: { children: React.ReactNode }) {
  useDocumentMeta()
  return <>{children}</>
}

export function App() {
  return (
    <Shell>
      <Routes>
        <Route
          path="/"
          element={
            <Titled>
              <Discover />
            </Titled>
          }
        />
        <Route
          path="/variants/:slug"
          element={
            <Titled>
              <VariantDetail />
            </Titled>
          }
        />
        <Route
          path="/about"
          element={
            <Titled>
              <About />
            </Titled>
          }
        />
        <Route
          path="*"
          element={
            <Titled>
              <NotFound />
            </Titled>
          }
        />
      </Routes>
      <Footer />
    </Shell>
  )
}
