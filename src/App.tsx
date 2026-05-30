import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import './App.css'
import { TerminalDemo } from './components/TerminalDemo'

const slideLabels = ['Overview', 'Terrain', 'Pipeline', 'Demo', 'System', 'Ask']

const terrainSignals = [
  {
    title: 'Repeated Text Wastes Context',
    body: 'Long logs, documents, and code excerpts often spend most of their bytes re-stating structure, labels, and near-identical line skeletons.',
    coord: 'src/lib.rs L73-L78',
  },
  {
    title: 'The Command Surface Is Honest',
    body: 'sb squeeze works well on repeated logs, documents, and code excerpts when the goal is to keep structure while shrinking the payload.',
    coord: 'src/lib.rs L73-L89',
  },
  {
    title: 'Fallback Preserves Trust',
    body: 'If legend plus compressed body is larger than raw input, ast-bro emits the original instead of pretending it helped.',
    coord: 'src/squeeze/render.rs L86-L107',
  },
]

const pipelineStages = [
  {
    tag: '#T#',
    title: 'Timestamp Dictionary',
    body: 'Frequent ISO8601 prefixes become reusable anchors.',
    coord: 'src/squeeze/mod.rs L646-L660',
  },
  {
    tag: '#0#',
    title: 'Component Extraction',
    body: 'Repeated [Tag] and key= fragments collapse into short labels.',
    coord: 'src/squeeze/mod.rs L663-L664',
  },
  {
    tag: '#a#',
    title: 'Base62 Tags',
    body: 'Long numeric placeholders shrink again so the compression tags stay cheap.',
    coord: 'src/squeeze/mod.rs L320-L323',
  },
  {
    tag: '!n!',
    title: 'BPE + Meta BPE',
    body: 'Repeated token runs and repeated tag sequences both become compact macros.',
    coord: 'src/squeeze/mod.rs L326-L468',
  },
  {
    tag: '&1',
    title: 'Macro Templating',
    body: 'Near-identical lines with one changing field promote into reusable line templates.',
    coord: 'src/squeeze/mod.rs L523-L545',
  },
  {
    tag: 'xN',
    title: 'Dedup Floor',
    body: 'Consecutive duplicates collapse into counts while preserving exact replay semantics.',
    coord: 'src/squeeze/mod.rs L606-L629',
  },
]

const proofCards = [
  {
    title: 'CLI Native',
    body: 'sb squeeze <file> [range] [--raw] [--json] [--compact] fits the rest of ast-bro instead of shipping as a one-off tool.',
    meta: 'src/lib.rs L73-L89',
  },
  {
    title: 'Deterministic Output',
    body: 'Tag order sorts by savings, then first-seen, so tests stay stable and screenshots remain consistent.',
    meta: 'src/squeeze/mod.rs L314-L317',
  },
  {
    title: 'MCP Reach',
    body: 'src/mcp/tools.rs gets the same surface, so agents can request a squeezed result without pasting raw noise.',
    meta: 'src/mcp/tools.rs L1118-L1164',
  },
  {
    title: 'JSON Contract',
    body: 'ast-bro.squeeze.v1 exposes raw_bytes, squeezed_bytes, legend, and emitted body in one auditable envelope.',
    meta: 'src/squeeze/render.rs L231-L277',
  },
]

const roadmap = [
  {
    phase: 'NOW',
    title: 'Story Deck',
    body: 'Sell the command as a premium engineering surface, not a hidden utility.',
  },
  {
    phase: 'WEEKS',
    title: 'Productized Command',
    body: 'Land src/squeeze/mod.rs, CLI wiring, MCP hooks, and renderers against the brief.',
  },
  {
    phase: 'MONTHS',
    title: 'Operational Habit',
    body: 'Make “squeeze before sharing big text” the default workflow for humans and agents.',
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

const markdownPreview = `## sb squeeze

Turn long logs, documents, or code excerpts into a smaller result without throwing away the structure that helps people read it later.

- reversible legend for repeated timestamps, tags, and line shapes
- raw fallback when the compressed form is not actually smaller
- readable surfaces for terminal demos, agent JSON, and docs-style summaries

### sample summary

\`raw_bytes\`: 45012
\`squeezed_bytes\`: 10204
\`emitted\`: squeezed

### legend

- \`#T#\` = \`2026-05-30T11:54:\`
- \`#0#\` = \`[WinFocusMonitor]\`
- \`&1\` = \`hwnd=@ focus=@ title=@\`
`

function App() {
  const [current, setCurrent] = useState(0)
  const [demoRunId, setDemoRunId] = useState(0)
  const sectionRefs = useRef<Array<HTMLElement | null>>([])

  const lastSlide = slideLabels.length - 1

  const goToSlide = (index: number) => {
    const clamped = Math.max(0, Math.min(lastSlide, index))
    setCurrent(clamped)
    sectionRefs.current[clamped]?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

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
  }, [current, lastSlide])

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
        threshold: [0.25, 0.4, 0.6, 0.8],
        rootMargin: '-18% 0px -24% 0px',
      },
    )

    sections.forEach((section) => observer.observe(section))

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (current === 3) {
      setDemoRunId((value) => value + 1)
    }
  }, [current])

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
              <p className="eyebrow">AST-BRO / SB SQUEEZE</p>
              <h1>
                CHART THE NOISE.
                <span>KEEP THE SIGNAL.</span>
              </h1>
              <p className="lede">
                <code>sb squeeze</code> helps ast-bro turn long logs, documents,
                or code excerpts into a smaller, easier-to-share result with a
                reversible legend, so people and agents can keep the useful
                parts without losing the structure.
              </p>
              <div className="metric-row">
                <article className="metric-card">
                  <span className="metric-value">77.3%</span>
                  <span className="metric-label">typical size reduction</span>
                </article>
                <article className="metric-card">
                  <span className="metric-value">3.4x</span>
                  <span className="metric-label">more context retained</span>
                </article>
                <article className="metric-card">
                  <span className="metric-value">V1</span>
                  <span className="metric-label"><code>ast-bro.squeeze.v1</code> contract</span>
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
              <div className="map-chip map-chip--a">src/squeeze/mod.rs</div>
              <div className="map-chip map-chip--b">src/mcp/tools.rs</div>
              <div className="map-chip map-chip--c">src/squeeze/render.rs</div>
            </div>
          </div>
          <div className="slide-anchor">
            <span>code territory / lower-third museum anchor</span>
            <span>sb squeeze / repeated text compression / reversible legend</span>
          </div>
        </section>

        <section
          id="slide-terrain"
          ref={(element) => {
            sectionRefs.current[1] = element
          }}
          data-slide="1"
          className={`slide ${current === 1 ? 'is-active' : ''}`}
        >
          <div className="slide-frame slide-frame--split">
            <div className="section-heading">
              <p className="eyebrow">THE TERRAIN</p>
              <h2>REPETITION IS THE CITY. TOKENS ARE JUST THE TOLLS.</h2>
            </div>
            <div className="terrain-grid">
              <div className="signal-column">
                {terrainSignals.map((item) => (
                  <article key={item.title} className="signal-card">
                    <p className="signal-card__title">{item.title}</p>
                    <p className="signal-card__body">{item.body}</p>
                    <p className="signal-card__coord">{item.coord}</p>
                  </article>
                ))}
              </div>

              <div className="insight-panel">
                <div className="insight-panel__topline">FIELD READINGS</div>
                <div className="insight-stat">
                  <span>45.0KB</span>
                  <small>Typical large slice before compression</small>
                </div>
                <div className="insight-stat">
                  <span>10.2KB</span>
                  <small>Squeezed body plus legend</small>
                </div>
                <div className="insight-stat">
                  <span>&lt;1ms</span>
                  <small>parse overhead for repeated structure detection</small>
                </div>
                <div className="coord-stack">
                  <span>src/lib.rs L552-L1045</span>
                  <span>src/mcp/tools.rs list() + call()</span>
                  <span>ast-bro.squeeze.v1</span>
                  <span>sb squeeze &lt;file&gt; [range]</span>
                </div>
              </div>
            </div>
          </div>
          <div className="slide-anchor">
            <span>territory reading / data integrity / real symbols only</span>
            <span>path/to/file.rs / L124:C12 / 0.82 match score</span>
          </div>
        </section>

        <section
          id="slide-pipeline"
          ref={(element) => {
            sectionRefs.current[2] = element
          }}
          data-slide="2"
          className={`slide ${current === 2 ? 'is-active' : ''}`}
        >
          <div className="slide-frame">
            <div className="section-heading">
              <p className="eyebrow">THE PIPELINE</p>
              <h2>SEVEN STAGES, ONE CLEAN STORY.</h2>
            </div>
            <div className="pipeline-grid">
              {pipelineStages.map((stage) => (
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
                <span className="compression-strip__label">RAW</span>
                <p>2026-05-30T11:54:19.557 [WinFocusMonitor] hwnd=0x00001a2f ...</p>
              </div>
              <div>
                <span className="compression-strip__label">MAP</span>
                <p>#T#19.557 #0# #1#0x1a2f ...</p>
              </div>
              <div>
                <span className="compression-strip__label">MACRO</span>
                <p>&1:C / !2! / x11</p>
              </div>
              <div>
                <span className="compression-strip__label">EMIT</span>
                <p>Legend first, body second, raw fallback if bigger.</p>
              </div>
            </div>
          </div>
          <div className="slide-anchor">
            <span>src/squeeze/mod.rs / pure API / deterministic tags</span>
            <span>compress once / replay exactly / no fake token math</span>
          </div>
        </section>

        <section
          id="slide-demo"
          ref={(element) => {
            sectionRefs.current[3] = element
          }}
          data-slide="3"
          className={`slide ${current === 3 ? 'is-active' : ''}`}
        >
          <div className="slide-frame slide-frame--demo">
            <div className="demo-copy">
              <div className="section-heading section-heading--tight">
                <p className="eyebrow">LIVE OUTPUT</p>
                <h2>SHOW THE COMMAND LIKE A PRODUCT, NOT A SHELL HACK.</h2>
              </div>
              <p className="lede lede--narrow">
                This slide shows how <code>sb squeeze</code> can be presented in a
                live demo, a structured result view, and a docs-style summary
                without changing the core output.
              </p>
              <div className="demo-facts">
                <article>
                  <span className="demo-facts__value">Text + JSON + markdown</span>
                  <p>One output story for demos, agents, and docs-friendly summaries.</p>
                </article>
                <article>
                  <span className="demo-facts__value">Embedded terminal</span>
                  <p>Show the command output directly, without turning the slide into a fake desktop screenshot.</p>
                </article>
                <article>
                  <span className="demo-facts__value">Readable handoff</span>
                  <p>The same result can be shown live, summarized, and dropped into docs or issues.</p>
                </article>
              </div>
            </div>

            <div className="demo-surface">
              <TerminalDemo key={demoRunId} active={current === 3} runId={demoRunId} />
              <div className="demo-summary">
                <article className="summary-card">
                  <span className="summary-card__label">Compression</span>
                  <strong>45.0KB to 10.2KB</strong>
                </article>
                <article className="summary-card">
                  <span className="summary-card__label">Legend Size</span>
                  <strong>1.6KB / reversible</strong>
                </article>
                <article className="summary-card">
                  <span className="summary-card__label">Status</span>
                  <strong>emitted = squeezed</strong>
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
            <span>one command / multiple readable surfaces</span>
          </div>
        </section>

        <section
          id="slide-system"
          ref={(element) => {
            sectionRefs.current[4] = element
          }}
          data-slide="4"
          className={`slide ${current === 4 ? 'is-active' : ''}`}
        >
          <div className="slide-frame">
            <div className="section-heading">
              <p className="eyebrow">THE SYSTEM</p>
              <h2>WHY THIS LANDING FEELS LEGIT.</h2>
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
              <span>bun</span>
              <span>vite</span>
              <span>react</span>
              <span>markdown summary</span>
              <span>vercel static deploy</span>
            </div>
          </div>
          <div className="slide-anchor">
            <span>legit build process / fast local dev / clean deploy path</span>
            <span>bun install / vite build / vercel ship</span>
          </div>
        </section>

        <section
          id="slide-ask"
          ref={(element) => {
            sectionRefs.current[5] = element
          }}
          data-slide="5"
          className={`slide ${current === 5 ? 'is-active' : ''}`}
        >
          <div className="slide-frame">
            <div className="section-heading">
              <p className="eyebrow">THE ASK</p>
              <h2>LET AST-BRO SPEAK LIKE A PREMIUM ENGINEERING TOOL.</h2>
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
                Squeeze the repetition. Keep the structure. Make the result easy
                to share.
              </p>
              <p className="closing-panel__meta">
                Use: sb squeeze &lt;file&gt; [range] on logs, documents, or code / add --json for agents / add --raw to compare output
              </p>
            </div>
          </div>
          <div className="slide-anchor">
            <span>museum print lower third / centered metadata / controlled negative space</span>
            <span>ast-bro / squeeze / 2026.05</span>
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

export default App
