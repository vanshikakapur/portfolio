import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './App'
import './styles/global.css'

const root = document.getElementById('root')
if (!root) throw new Error('#root missing from index.html — nothing to mount into.')

const tree = (
  <StrictMode>
    {/* basename comes from Vite's `base`, so the deploy subpath is declared once. */}
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
    </BrowserRouter>
  </StrictMode>
)

// The build prerenders every route, so production hydrates; `npm run dev` serves
// an empty #root and mounts fresh.
if (root.firstChild) hydrateRoot(root, tree)
else createRoot(root).render(tree)
