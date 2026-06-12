import { useEffect, useState } from 'react'
import DeckV230 from './decks/DeckV230'
import DeckV240 from './decks/DeckV240'
import DeckV300 from './decks/DeckV300'

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

  switch (version) {
    case 'v2.3.0':
      return <DeckV230 />
    case 'v2.4.0':
      return <DeckV240 />
    default:
      return <DeckV300 />
  }
}

export default App
