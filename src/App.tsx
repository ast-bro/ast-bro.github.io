import { useEffect, useState } from 'react'
import DeckV230 from './decks/DeckV230'
import DeckV240 from './decks/DeckV240'

// Hash-based routing so archived versions work on any static host
// (GitHub Pages, Vercel, local) with no server rewrite. `/` shows the
// latest landing; archived versions live at `#vX.Y.Z`.
function readVersion() {
  return window.location.hash.replace(/^#\/?/, '')
}

function App() {
  const [version, setVersion] = useState(readVersion)

  useEffect(() => {
    const onHashChange = () => setVersion(readVersion())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  if (version === 'v2.3.0') {
    return <DeckV230 />
  }

  return <DeckV240 />
}

export default App
