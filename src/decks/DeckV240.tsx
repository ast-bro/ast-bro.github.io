import { useCallback, useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import '../App.css'
import { TerminalDemo, type Frame } from '../components/TerminalDemo'

const slideLabels = ['Overview', 'Video', 'Trace', 'Cache', 'Search', 'Demo', 'System', 'Ask']

const traceSignals = [
  {
    title: 'Shortest Path, Inlined',
    body: 'A breadth-first search over the call graph maps how one function reaches another, inlining each hop’s source body so the whole chain reads in one pass.',
    coord: 'src/calls/trace.rs',
  },
  {
    title: 'Graceful On Broken Chains',
    body: 'When the path snaps at a dynamic-dispatch or trait-object boundary, trace falls back to showing both endpoints plus the target’s sibling callables instead of failing.',
    coord: 'src/calls/trace.rs',
  },
  {
    title: 'CLI And MCP Parity',
    body: 'The same trace surface ships to agents through the MCP tool layer, so a model can request a call path without pasting raw source.',
    coord: 'src/mcp/tools.rs',
  },
]

const cacheStages = [
  {
    tag: 'init',
    title: 'Revalidate Every Call',
    body: 'get_or_init() now checks the cached graph against the working tree on every single call instead of trusting a one-time load.',
    coord: 'src/graph_cache/shared.rs',
  },
  {
    tag: 'stat',
    title: 'Cheap Stat-Walk',
    body: 'A fast walk over file metadata detects whether the tree changed before any heavier work runs.',
    coord: 'src/graph_cache/shared.rs',
  },
  {
    tag: 'Δ',
    title: 'Compute Delta',
    body: 'Only the files that moved are diffed into a compact delta, never the whole repository.',
    coord: 'src/graph_cache/delta.rs',
  },
  {
    tag: 'patch',
    title: 'Patch In Memory',
    body: 'patch_in_memory() applies the delta directly to the live graph — no graph.bin round-trip from disk.',
    coord: 'src/graph_cache/shared.rs',
  },
  {
    tag: 'Arc',
    title: 'Swap The Pointer',
    body: 'The patched graph is published by swapping the Arc, so concurrent readers always see a consistent snapshot.',
    coord: 'src/graph_cache/shared.rs',
  },
  {
    tag: 'live',
    title: 'No Stale MCP',
    body: 'Long-lived MCP sessions stop serving stale graphs without paying for a full reload on every request.',
    coord: 'src/graph_cache/shared.rs',
  },
]

const searchFilters = [
  {
    tag: 'lang:',
    title: 'Language',
    body: 'Restrict hybrid retrieval to one source language before scoring runs.',
    meta: 'lang:rust  /  language:rust',
  },
  {
    tag: 'path:',
    title: 'Path Substring',
    body: 'Keep only chunks whose repo-relative path contains the fragment.',
    meta: 'path:src/auth',
  },
  {
    tag: 'name:',
    title: 'Filename',
    body: 'Match on filename substring to home in on a known module.',
    meta: 'name:login',
  },
  {
    tag: 'rest',
    title: 'Free Text Remainder',
    body: 'Whatever is left after the prefixes feeds the vector + BM25 hybrid score.',
    meta: 'src/search/query.rs',
  },
]

const proofCards = [
  {
    title: 'Purely Additive',
    body: 'trace, live revalidation, and inline filters land with zero breaking changes — existing commands and contracts are untouched.',
    meta: 'summary / no breaking changes',
  },
  {
    title: 'Honest Fallbacks',
    body: 'A broken call chain reports the gap and shows endpoints rather than inventing a path, matching ast-bro’s no-fake-data stance.',
    meta: 'src/calls/trace.rs',
  },
  {
    title: 'JSON Contract',
    body: 'ast-bro.trace.v1 exposes the resolved path in one auditable envelope, so agents and CI parse the same shape.',
    meta: 'src/mcp/tools.rs',
  },
  {
    title: 'Known Risk, Named',
    body: 'Single-threaded LOAD_LOCK in the cache registry is the one watch-point; compute_delta is fast enough that it rarely matters.',
    meta: 'src/graph_cache/shared.rs',
  },
]

const roadmap = [
  {
    phase: 'NOW',
    title: 'Trace Goes Wide',
    body: 'Make “trace from A to B” the first move when reading an unfamiliar call chain.',
  },
  {
    phase: 'WEEKS',
    title: 'Always-Fresh Graph',
    body: 'Lean on live revalidation so MCP sessions never reason over a stale call graph.',
  },
  {
    phase: 'MONTHS',
    title: 'Filtered By Default',
    body: 'Teach humans and agents to scope every search with lang:, path:, and name:.',
  },
]

const ambientNodes = [
  { x: '12%', y: '18%', size: 'lg' },
  { x: '19%', y: '58%', size: 'sm' },
  { x: '33%', y: '30%', size: 'sm' },
  { x: '48%', y: '42%', size: 'lg' },
  { x: '63%', y: '18%', size: 'sm' },
  { x: '74%', y: '62%', size: 'lg' },
  { x: '86%', y: '34%', size: 'sm' },
]

const traceScript: Frame[] = [
  {
    delay: 180,
    text: '\x1b[38;5;179msb trace run_search render_results\x1b[0m\r\n',
  },
  { delay: 420, text: '\r\n' },
  {
    delay: 300,
    text: '\x1b[38;5;108m# trace: run_search → render_results   3 hops\x1b[0m\r\n',
  },
  { delay: 320, text: '\r\n' },
  { delay: 200, text: '\x1b[38;5;250m## path:\x1b[0m\r\n' },
  {
    delay: 260,
    text: '\x1b[38;5;110m1. src/search/query.rs::run_search\x1b[0m  src/search/query.rs:42  [function]\r\n',
  },
  { delay: 160, text: '       pub fn run_search(raw: &str) -> Vec<Hit> {\r\n' },
  { delay: 160, text: '           let q = parse_query(raw);\r\n' },
  { delay: 160, text: '           let hits = hybrid_retrieve(&q);\r\n' },
  { delay: 160, text: '           render_results(&hits)\r\n' },
  { delay: 160, text: '       }\r\n' },
  {
    delay: 260,
    text: '\x1b[38;5;110m2. src/search/retrieve.rs::hybrid_retrieve\x1b[0m  src/search/retrieve.rs:88  [function]\r\n',
  },
  { delay: 160, text: '       pub fn hybrid_retrieve(q: &Query) -> Vec<Hit> {\r\n' },
  { delay: 160, text: '           let dense = vector_scan(q);\r\n' },
  { delay: 160, text: '           merge(dense, bm25_scan(q))\r\n' },
  { delay: 160, text: '       }\r\n' },
  {
    delay: 260,
    text: '\x1b[38;5;110m3. src/search/render.rs::render_results\x1b[0m  src/search/render.rs:12  [function]\r\n',
  },
  { delay: 160, text: '       pub fn render_results(hits: &[Hit]) -> String { ... }\r\n' },
  { delay: 420, text: '\r\n' },
  {
    delay: 320,
    text: '\x1b[38;5;179m# 3 hops resolved, each body inlined (ast-bro.trace.v1)\x1b[0m\r\n',
  },
  {
    delay: 320,
    text: '\x1b[38;5;250m# broken chains fall back to endpoints + sibling callables\x1b[0m\r\n',
  },
]

const markdownPreview = `## sb trace

Compute the shortest static call path between two symbols and inline each hop’s source body, so you can read the whole chain in one pass.

- BFS over the call graph, deepest hop capped by \`--depth\` (default 12)
- graceful fallback to endpoints + siblings on dynamic dispatch
- same surface in CLI and MCP via \`ast-bro.trace.v1\`

### sample trace

\`from\`: run_search
\`to\`: render_results
\`hops\`: 3
\`emitted\`: path
`

function DeckV240() {
  const [current, setCurrent] = useState(0)
  const sectionRefs = useRef<Array<HTMLElement | null>>([])

  const lastSlide = slideLabels.length - 1
  // Bumps when the demo slide is entered, remounting the terminal to replay.
  const demoRunId = current === 5 ? 1 : 0

  const goToSlide = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(lastSlide, index))
    setCurrent(clamped)

    // Fallback if ref isn't available
    const sectionElement = sectionRefs.current[clamped]
    if (sectionElement) {
      sectionElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    } else {
      // Direct DOM query fallback for mobile
      const element = document.querySelector(`[data-slide="${clamped}"]`)
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      }
    }
  }, [lastSlide])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return
      }

      if (
        event.key === 'ArrowRight' ||
        event.key === 'ArrowDown' ||
        event.key === ' ' ||
        event.key === 'Enter' ||
        event.key === 'PageDown'
      ) {
        event.preventDefault()
        goToSlide(current + 1)
      }

      if (
        event.key === 'ArrowLeft' ||
        event.key === 'ArrowUp' ||
        event.key === 'Backspace' ||
        event.key === 'PageUp'
      ) {
        event.preventDefault()
        goToSlide(current - 1)
      }

      if (event.key === 'Home') {
        event.preventDefault()
        goToSlide(0)
      }

      if (event.key === 'End') {
        event.preventDefault()
        goToSlide(lastSlide)
      }

      if (/^[1-6]$/.test(event.key)) {
        event.preventDefault()
        goToSlide(Number(event.key) - 1)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [current, lastSlide, goToSlide])

  useEffect(() => {
    const sections = sectionRefs.current.filter(
      (section): section is HTMLElement => section !== null,
    )

    if (!sections.length) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]

        if (!visible) {
          return
        }

        const index = Number(visible.target.getAttribute('data-slide'))

        if (!Number.isNaN(index)) {
          setCurrent(index)
        }
      },
      {
        threshold: [0.1, 0.25, 0.4, 0.6, 0.8],
        rootMargin: '-10% 0px -20% 0px',
      },
    )

    sections.forEach((section) => observer.observe(section))

    return () => observer.disconnect()
  }, [])

  return (
    <div className="deck-shell">
      <div className="ambient-layer" aria-hidden="true">
        <div className="ambient-grid" />
        <div className="ambient-radial ambient-radial--left" />
        <div className="ambient-radial ambient-radial--right" />
        <div className="ambient-roads">
          <span />
          <span />
          <span />
        </div>
        {ambientNodes.map((node) => (
          <span
            key={`${node.x}-${node.y}`}
            className={`ambient-node ambient-node--${node.size}`}
            style={{ left: node.x, top: node.y }}
          />
        ))}
      </div>

      <header className="deck-chrome deck-chrome--top">
        <div className="brand-lockup">
          <img
            className="brand-mark"
            src="/sb-192.png"
            alt="ast-bro sb logo"
            width="56"
            height="56"
          />
          <div>
            <div className="brand-name">ast-bro</div>
            <div className="brand-subtitle">Technical Cartography</div>
          </div>
        </div>
        <a
          className="chrome-coords chrome-coords--link"
          href="https://github.com/aeroxy/ast-bro"
          target="_blank"
          rel="noreferrer"
        >
          https://github.com/aeroxy/ast-bro
        </a>
      </header>

      <main className="deck">
        <section
          id="slide-overview"
          ref={(element) => {
            sectionRefs.current[0] = element
          }}
          data-slide="0"
          className={`slide ${current === 0 ? 'is-active' : ''}`}
        >
          <div className="slide-frame slide-frame--hero">
            <div className="hero-copy">
              <p className="eyebrow">AST-BRO / V2.4.0</p>
              <h1>
                TRACE EVERY HOP.
                <span>SERVE NOTHING STALE.</span>
              </h1>
              <p className="lede">
                <code>sb trace</code> walks the shortest static call path between
                two symbols and inlines every body, the graph cache revalidates
                itself live, and search now reads <code>lang:</code>,{' '}
                <code>path:</code>, and <code>name:</code> filters straight from
                the query.
              </p>
              <div className="metric-row">
                <article className="metric-card">
                  <span className="metric-value">BFS</span>
                  <span className="metric-label">shortest call-path trace</span>
                </article>
                <article className="metric-card">
                  <span className="metric-value">Δ</span>
                  <span className="metric-label">live in-memory cache patch</span>
                </article>
                <article className="metric-card">
                  <span className="metric-value">3</span>
                  <span className="metric-label">inline search filters</span>
                </article>
              </div>
            </div>

            <div className="hero-map">
              <svg viewBox="0 0 640 480" className="hero-map__svg" aria-hidden="true">
                <path d="M48 376 L170 282 L252 286 L336 210 L486 172 L588 94" />
                <path d="M88 124 L170 180 L252 154 L388 192 L506 320" />
                <path d="M126 418 L218 344 L274 352 L408 388 L540 350" />
                <path d="M248 286 L246 154" className="hero-map__minor" />
                <path d="M336 210 L408 388" className="hero-map__minor" />
                <path d="M486 172 L506 320" className="hero-map__minor" />
                <circle cx="48" cy="376" r="8" />
                <circle cx="170" cy="282" r="11" />
                <circle cx="252" cy="286" r="7" />
                <circle cx="336" cy="210" r="10" />
                <circle cx="486" cy="172" r="8" />
                <circle cx="588" cy="94" r="12" />
                <circle cx="170" cy="180" r="7" />
                <circle cx="252" cy="154" r="8" />
                <circle cx="388" cy="192" r="6" />
                <circle cx="506" cy="320" r="9" />
              </svg>
              <div className="map-chip map-chip--a">src/calls/trace.rs</div>
              <div className="map-chip map-chip--b">src/graph_cache/shared.rs</div>
              <div className="map-chip map-chip--c">src/search/query.rs</div>
            </div>
          </div>
          <div className="slide-anchor">
            <span>code territory / lower-third museum anchor</span>
            <span>sb trace / live graph cache / inline search filters</span>
          </div>
        </section>

        <section
          id="slide-video"
          ref={(element) => {
            sectionRefs.current[1] = element
          }}
          data-slide="1"
          className={`slide ${current === 1 ? 'is-active' : ''}`}
        >
          <div className="slide-frame">
            <div className="section-heading">
              <p className="eyebrow">V2.4.0 INTRO</p>
              <h2>WATCH THE INTRO.</h2>
            </div>
            <div className="video-container">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/t5uKtaPzEH8?rel=0"
                title="ast-bro v2.4.0 Intro Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              ></iframe>
            </div>
          </div>
          <div className="slide-anchor">
            <span>release intro / direct capability proof</span>
            <span>ast-bro v2.4.0 / trace · live cache · inline filters</span>
          </div>
        </section>

        <section
          id="slide-trace"
          ref={(element) => {
            sectionRefs.current[2] = element
          }}
          data-slide="2"
          className={`slide ${current === 2 ? 'is-active' : ''}`}
        >
          <div className="slide-frame slide-frame--split">
            <div className="section-heading">
              <p className="eyebrow">CALL PATH TRACING</p>
              <h2>HOW DOES A REACH B? FOLLOW THE LINE.</h2>
            </div>
            <div className="terrain-grid">
              <div className="signal-column">
                {traceSignals.map((item) => (
                  <article key={item.title} className="signal-card">
                    <p className="signal-card__title">{item.title}</p>
                    <p className="signal-card__body">{item.body}</p>
                    <p className="signal-card__coord">{item.coord}</p>
                  </article>
                ))}
              </div>

              <div className="insight-panel">
                <div className="insight-panel__topline">TRACE PARAMS</div>
                <div className="insight-stat">
                  <span>from → to</span>
                  <small>Required source and destination symbols</small>
                </div>
                <div className="insight-stat">
                  <span>depth = 12</span>
                  <small>Max path length in hops before giving up</small>
                </div>
                <div className="insight-stat">
                  <span>ast-bro.trace.v1</span>
                  <small>JSON envelope when --json is passed</small>
                </div>
                <div className="coord-stack">
                  <span>sb trace &lt;FROM&gt; &lt;TO&gt; [root]</span>
                  <span>src/calls/trace.rs</span>
                  <span>src/mcp/tools.rs trace()</span>
                  <span>--depth N / --rebuild / --json</span>
                </div>
              </div>
            </div>
          </div>
          <div className="slide-anchor">
            <span>shortest path / inlined bodies / honest fallback</span>
            <span>from symbol / to symbol / N hops resolved</span>
          </div>
        </section>

        <section
          id="slide-cache"
          ref={(element) => {
            sectionRefs.current[3] = element
          }}
          data-slide="3"
          className={`slide ${current === 3 ? 'is-active' : ''}`}
        >
          <div className="slide-frame">
            <div className="section-heading">
              <p className="eyebrow">LIVE GRAPH CACHE</p>
              <h2>REVALIDATE IN PLACE. NEVER SERVE STALE.</h2>
            </div>
            <div className="pipeline-grid">
              {cacheStages.map((stage) => (
                <article key={stage.title} className="pipeline-card">
                  <div className="pipeline-card__tag">{stage.tag}</div>
                  <p className="pipeline-card__title">{stage.title}</p>
                  <p className="pipeline-card__body">{stage.body}</p>
                  <p className="pipeline-card__coord">{stage.coord}</p>
                </article>
              ))}
            </div>
            <div className="compression-strip">
              <div>
                <span className="compression-strip__label">CALL</span>
                <p>get_or_init() runs on every request</p>
              </div>
              <div>
                <span className="compression-strip__label">CHECK</span>
                <p>stat-walk detects a changed tree</p>
              </div>
              <div>
                <span className="compression-strip__label">PATCH</span>
                <p>compute_delta → patch_in_memory()</p>
              </div>
              <div>
                <span className="compression-strip__label">SWAP</span>
                <p>Arc pointer swap, no graph.bin reload</p>
              </div>
            </div>
          </div>
          <div className="slide-anchor">
            <span>src/graph_cache/shared.rs / delta.rs / incremental patch</span>
            <span>cheap stat-walk / in-memory Arc swap / no full reload</span>
          </div>
        </section>

        <section
          id="slide-search"
          ref={(element) => {
            sectionRefs.current[4] = element
          }}
          data-slide="4"
          className={`slide ${current === 4 ? 'is-active' : ''}`}
        >
          <div className="slide-frame">
            <div className="section-heading">
              <p className="eyebrow">INLINE SEARCH FILTERS</p>
              <h2>NARROW FIRST, THEN SCORE.</h2>
            </div>
            <div className="proof-grid">
              {searchFilters.map((filter) => (
                <article key={filter.tag} className="proof-card">
                  <p className="proof-card__title">
                    <code>{filter.tag}</code> {filter.title}
                  </p>
                  <p className="proof-card__body">{filter.body}</p>
                  <p className="proof-card__meta">{filter.meta}</p>
                </article>
              ))}
            </div>

            <div className="stack-strip">
              <span>lang:rust</span>
              <span>path:src/auth</span>
              <span>name:login</span>
              <span>+ hybrid vector + BM25</span>
              <span>src/search/query.rs</span>
            </div>
          </div>
          <div className="slide-anchor">
            <span>field-qualified prefixes / parsed before retrieval</span>
            <span>lang: / path: / name: / free-text remainder</span>
          </div>
        </section>

        <section
          id="slide-demo"
          ref={(element) => {
            sectionRefs.current[5] = element
          }}
          data-slide="5"
          className={`slide ${current === 5 ? 'is-active' : ''}`}
        >
          <div className="slide-frame slide-frame--demo">
            <div className="demo-copy">
              <div className="section-heading section-heading--tight">
                <p className="eyebrow">LIVE OUTPUT</p>
                <h2>READ THE WHOLE CALL CHAIN IN ONE PASS.</h2>
              </div>
              <p className="lede lede--narrow">
                This is <code>sb trace</code> resolving a path between two
                symbols — each hop printed with its file, line, and inlined body,
                the same surface a model gets over MCP.
              </p>
              <div className="demo-facts">
                <article>
                  <span className="demo-facts__value">Text + JSON</span>
                  <p>Human-readable hops live, or ast-bro.trace.v1 for agents.</p>
                </article>
                <article>
                  <span className="demo-facts__value">Bodies inlined</span>
                  <p>Every hop carries its source, so you never re-open files to follow the chain.</p>
                </article>
                <article>
                  <span className="demo-facts__value">Honest gaps</span>
                  <p>A broken chain falls back to endpoints and siblings instead of pretending.</p>
                </article>
              </div>
            </div>

            <div className="demo-surface">
              <TerminalDemo
                key={demoRunId}
                active={current === 5}
                runId={demoRunId}
                script={traceScript}
                meta={{ title: 'sb trace', subtitle: 'live command output' }}
              />
              <div className="demo-summary">
                <article className="summary-card">
                  <span className="summary-card__label">Path</span>
                  <strong>3 hops resolved</strong>
                </article>
                <article className="summary-card">
                  <span className="summary-card__label">Bodies</span>
                  <strong>inlined per hop</strong>
                </article>
                <article className="summary-card">
                  <span className="summary-card__label">Status</span>
                  <strong>emitted = path</strong>
                </article>
              </div>

              <article className="markdown-surface">
                <div className="markdown-surface__meta">
                  <span>Docs View</span>
                  <span>markdown renderer / summary surface</span>
                </div>
                <div className="markdown-surface__body">
                  <ReactMarkdown>{markdownPreview}</ReactMarkdown>
                </div>
              </article>
            </div>
          </div>
          <div className="slide-anchor">
            <span>embedded terminal / docs summary / structured output</span>
            <span>one command / shortest path / inlined hops</span>
          </div>
        </section>

        <section
          id="slide-system"
          ref={(element) => {
            sectionRefs.current[6] = element
          }}
          data-slide="6"
          className={`slide ${current === 6 ? 'is-active' : ''}`}
        >
          <div className="slide-frame">
            <div className="section-heading">
              <p className="eyebrow">IMPACT & RISK</p>
              <h2>HIGH IMPACT. ZERO BREAKING CHANGES.</h2>
            </div>
            <div className="proof-grid">
              {proofCards.map((card) => (
                <article key={card.title} className="proof-card">
                  <p className="proof-card__title">{card.title}</p>
                  <p className="proof-card__body">{card.body}</p>
                  <p className="proof-card__meta">{card.meta}</p>
                </article>
              ))}
            </div>

            <div className="stack-strip">
              <span>trace</span>
              <span>live cache</span>
              <span>inline filters</span>
              <span>ast-bro.trace.v1</span>
              <span>additive only</span>
            </div>
          </div>
          <div className="slide-anchor">
            <span>additive feature set / honest fallbacks / named risk</span>
            <span>no breaking changes / LOAD_LOCK watch-point</span>
          </div>
        </section>

        <section
          id="slide-ask"
          ref={(element) => {
            sectionRefs.current[7] = element
          }}
          data-slide="7"
          className={`slide ${current === 7 ? 'is-active' : ''}`}
        >
          <div className="slide-frame">
            <div className="section-heading">
              <p className="eyebrow">THE ASK</p>
              <h2>MAKE TRACE, FRESH GRAPHS, AND FILTERS THE DEFAULT.</h2>
            </div>
            <div className="roadmap-grid">
              {roadmap.map((item) => (
                <article key={item.phase} className="roadmap-card">
                  <span className="roadmap-card__phase">{item.phase}</span>
                  <p className="roadmap-card__title">{item.title}</p>
                  <p className="roadmap-card__body">{item.body}</p>
                </article>
              ))}
            </div>
            <div className="closing-panel">
              <p className="closing-panel__quote">
                Trace the path. Keep the graph fresh. Filter before you search.
              </p>
              <p className="closing-panel__meta">
                Use: sb trace &lt;from&gt; &lt;to&gt; [--depth N] / live cache revalidation is automatic / scope search with lang: path: name: ·{' '}
                <a className="chrome-coords--link" href="#v2.3.0">
                  v2.3.0 archive
                </a>
              </p>
            </div>
          </div>
          <div className="slide-anchor">
            <span>museum print lower third / centered metadata / controlled negative space</span>
            <span>ast-bro / trace / v2.4.0</span>
          </div>
        </section>
      </main>

      <footer className="deck-chrome deck-chrome--bottom">
        <div className="slide-dots" aria-label="Slide navigation">
          {slideLabels.map((label, index) => (
            <button
              key={label}
              type="button"
              className={index === current ? 'is-active' : ''}
              onClick={() => goToSlide(index)}
              aria-label={`Go to ${label}`}
            />
          ))}
        </div>

        <div className="nav-hint">
          <span>1-6 jump</span>
          <span>arrows move</span>
          <span>{current + 1} / {slideLabels.length}</span>
        </div>

        <div className="step-controls">
          <button
            type="button"
            onClick={() => goToSlide(current - 1)}
          >
            Prev
          </button>
          <button
            type="button"
            onClick={() => goToSlide(current + 1)}
          >
            Next
          </button>
        </div>
      </footer>
    </div>
  )
}

export default DeckV240
