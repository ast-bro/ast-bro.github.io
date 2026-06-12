import { useCallback, useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import '../App.css'
import { TerminalDemo, type Frame } from '../components/TerminalDemo'

const slideLabels = ['Overview', 'Impact', 'Context', 'Surface', 'Filters', 'Demo', 'System', 'Ask']

const impactStages = [
  {
    tag: 'callers',
    title: 'Reverse Edges',
    body: 'Traverse the call-graph in reverse to find every call site that routes through the target symbol.',
    coord: 'src/impact.rs build_callers_section',
  },
  {
    tag: 'callees',
    title: 'Forward Edges',
    body: 'One-hop callees surface as the first dependency section, so you see what the symbol touches internally.',
    coord: 'src/impact.rs build_callees_section',
  },
  {
    tag: 'file deps',
    title: 'File Reverse & Forward',
    body: 'The target file\'s import and importer lists ride alongside symbol edges — blast radius in both directions.',
    coord: 'src/impact.rs build_file_reverse_deps_section',
  },
  {
    tag: 'transitive',
    title: 'Depth-2+ Callers',
    body: 'Anything further out is bucketed into a transitive section with its depth tagged, so a three-hop blast still reads as one report.',
    coord: 'src/impact.rs transitive collection',
  },
  {
    tag: 'tests',
    title: 'Affected Tests',
    body: 'The same BFS walk filters into an affected-tests section using is_test_file(), answering "what breaks" in one pass.',
    coord: 'src/file_filter.rs is_test_file',
  },
  {
    tag: 'type',
    title: 'Type-Aware',
    body: 'Trait and class targets additionally enumerate implementors, methods, and method callers — a single command covers the whole type.',
    coord: 'src/context.rs build_context (type branch)',
  },
]

const contextPipeline = [
  {
    tag: '1',
    title: 'Target Body',
    body: 'Full function or type source is always the first entry — budget permitting it anchors everything that follows.',
    meta: 'ast-bro.context.v1 / entries[]',
  },
  {
    tag: '2',
    title: 'Direct Callees (Body)',
    body: 'One-hop callees are pulled with full bodies while the budget still fits, otherwise only their signatures are emitted.',
    meta: 'bodies then degrade to sigs',
  },
  {
    tag: '3',
    title: 'Direct Callers (Sig)',
    body: 'Callers land as signatures — usually one or two lines each — because the agent rarely needs a caller\'s body.',
    meta: 'callers at depth 1',
  },
  {
    tag: '4',
    title: 'Transitive Depth-2',
    body: 'Depth-2 callees and callers ship as signatures only — enough breadcrumbs to follow up, never enough to flood the window.',
    meta: 'truncated flag set if cut short',
  },
  {
    tag: '5',
    title: 'Budget Bound',
    body: 'A caller-supplied --budget N ceiling is a hard limit. target_omitted / truncated flip to true when the budget ran first.',
    meta: '--budget 8000 default',
  },
]

const surfaceSignals = [
  {
    tag: 'callers',
    title: 'Ambiguous Edges Surface By Default',
    body: 'Three-pass resolver tags edges Exact / Inferred / Ambiguous. Ambiguous callers used to be hidden; now they print with a red tag so the agent sees the full set and opts out with --hide-ambiguous when it wants clean output.',
    coord: 'src/calls/cli.rs',
  },
  {
    tag: 'callees',
    title: 'Unresolved And External, Always Shown',
    body: 'Unresolved ([unresolved] cyan) and external ([external] red) callees print by default. The --external opt-in flag is gone; --hide-external keeps the narrow view.',
    coord: 'src/calls/traverse.rs',
  },
  {
    tag: 'deps',
    title: 'Footer-Listed Imports',
    body: 'File deps now close with a footer enumerating unresolved imports tagged [external], so "what did this file try to pull in?" is answered alongside what resolved.',
    coord: 'src/deps/render.rs render_deps_text',
  },
  {
    tag: 'graph',
    title: 'Graph Shows External Nodes',
    body: 'sb graph . renders external nodes by default tagged [external]; the old --include-external toggle is deprecated in favour of --hide-external.',
    coord: 'src/deps/cli.rs run_graph',
  },
]

const filterSignals = [
  {
    tag: 'tests',
    title: '--tests',
    body: 'Limit every section of callers / reverse-deps / impact to files recognised as tests by is_test_file(). Answer "what breaks in the test suite?" without a second command.',
    coord: 'src/file_filter.rs',
  },
  {
    tag: 'exclude',
    title: '--exclude-tests',
    body: 'The inverse filter drops test-file edges from every section. Useful when you want the production blast radius only.',
    coord: 'src/file_filter.rs',
  },
  {
    tag: '#!',
    title: 'Shebang Detection',
    body: 'Explicitly-passed extensionless files (bin/deploy, ~/.local/bin/my-script) resolve through #! — python3 → Python, node → TypeScript, ruby → Ruby. Directory walks stay fast (no file opens without an extension).',
    coord: 'src/file_filter.rs detect_language',
  },
  {
    tag: 'skill',
    title: 'SKILL.md Is The Source Of Truth',
    body: 'prompt.rs embeds skills/ast-bro/SKILL.md via include_str!() and strips the YAML frontmatter on first access. Installers, the prompt snippet, and the Claude Code skill all read the same file. Edit once, ship everywhere.',
    coord: 'src/prompt.rs include_str!',
  },
]

const proofCards = [
  {
    title: '19 MCP Tools',
    body: 'Two new tools — impact and context — ride alongside the existing 17. Schema names ast-bro.impact.v1 and ast-bro.context.v1 let downstream agents parse without drift.',
    meta: 'src/mcp/tools.rs',
  },
  {
    title: 'One Edit Ships Everywhere',
    body: 'Because SKILL.md is embedded at compile time, editing it triggers a rebuild and propagates to ast-bro prompt, installed config files, and the Claude Code skill in one motion.',
    meta: 'src/prompt.rs + installers',
  },
  {
    title: 'Breaking Surface, Named',
    body: 'Flag inversions (--include-ambient → --hide-ambient, --external → --hide-external) are the breaking change, so v3.0.0 bumps major and deprecation notes stay for a release.',
    meta: 'src/calls/cli.rs, src/deps/cli.rs',
  },
  {
    title: '1119 Tests Green',
    body: 'Existing suites plus new context_e2e, impact type-transitive, struct-literal construction, and prompt-module tests — 306 unit + 48+ integration — ship alongside the flags.',
    meta: 'cargo test / cargo test --test',
  },
]

const roadmap = [
  {
    phase: 'NOW',
    title: 'Impact Becomes The First Move',
    body: 'Make "blast radius of touching X" the default first question when reading anything unfamiliar.',
  },
  {
    phase: 'WEEKS',
    title: 'Context Packs Over Read Chains',
    body: 'Teach agents to call sb context once instead of show + callers + callees + reverse-deps chains.',
  },
  {
    phase: 'MONTHS',
    title: 'Filter By Default',
    body: 'Scope every search and impact query with --tests / --exclude-tests so production vs. test blast radii stay distinct.',
  },
]

const ambientNodes = [
  { x: '10%', y: '20%', size: 'lg' },
  { x: '22%', y: '62%', size: 'sm' },
  { x: '38%', y: '28%', size: 'sm' },
  { x: '52%', y: '48%', size: 'lg' },
  { x: '66%', y: '16%', size: 'sm' },
  { x: '76%', y: '66%', size: 'lg' },
  { x: '88%', y: '32%', size: 'sm' },
]

const impactScript: Frame[] = [
  {
    delay: 180,
    text: '\x1b[38;5;179msb impact LanguageAdapter --mode all --depth 2\x1b[0m\r\n',
  },
  { delay: 420, text: '\r\n' },
  {
    delay: 300,
    text: '\x1b[38;5;108m⊕ trait LanguageAdapter  L5-10\x1b[0m\r\n',
  },
  { delay: 260, text: '\x1b[38;5;250m## callees (2)\x1b[0m\r\n' },
  { delay: 160, text: '  → fn language_name()  L6\r\n' },
  { delay: 160, text: '  → fn parse()         L9\r\n' },
  { delay: 260, text: '\x1b[38;5;250m## called by (1)\x1b[0m\r\n' },
  {
    delay: 200,
    text: '  fn parse_file_for_hook  src/main_helpers.rs:40  \x1b[38;5;110m(Exact)\x1b[0m\r\n',
  },
  { delay: 260, text: '\x1b[38;5;250m## implementors (11)\x1b[0m\r\n' },
  { delay: 140, text: '  struct CppAdapter      src/adapters/cpp.rs:6\r\n' },
  { delay: 140, text: '  struct PythonAdapter   src/adapters/python.rs:6\r\n' },
  { delay: 140, text: '  struct RustAdapter     src/adapters/rust.rs:6\r\n' },
  { delay: 140, text: '  struct GoAdapter       src/adapters/go.rs:6\r\n' },
  { delay: 140, text: '  struct JavaAdapter     src/adapters/java.rs:6\r\n' },
  { delay: 140, text: '  ... (11 total)\r\n' },
  { delay: 260, text: '\x1b[38;5;250m## file reverse-deps (4)\x1b[0m\r\n' },
  { delay: 140, text: '  src/main_helpers.rs\r\n' },
  { delay: 140, text: '  src/installers/mod.rs\r\n' },
  { delay: 140, text: '  src/calls/cli.rs\r\n' },
  { delay: 140, text: '  src/search/query.rs\r\n' },
  { delay: 260, text: '\x1b[38;5;250m## transitive callers at depth 2 (3)\x1b[0m\r\n' },
  { delay: 140, text: '  fn run  depth=2  src/lib.rs:739\r\n' },
  { delay: 140, text: '  fn install_prompt  depth=2  src/installers.rs\r\n' },
  { delay: 140, text: '  fn agent_skill_md  depth=2  src/prompt.rs\r\n' },
  { delay: 260, text: '\x1b[38;5;250m## affected tests (3)\x1b[0m\r\n' },
  { delay: 140, text: '  test parses_all_adapters  tests/adapters.rs\r\n' },
  { delay: 140, text: '  test main_helpers_routes_languages  tests/main_helpers.rs\r\n' },
  { delay: 140, text: '  test installers_write_skill  tests/installers.rs\r\n' },
  { delay: 420, text: '\r\n' },
  {
    delay: 320,
    text: '\x1b[38;5;179m# ast-bro.impact.v1 / 1 target, 6 sections, 24 edges resolved\x1b[0m\r\n',
  },
]

const markdownPreview = `## sb impact <Symbol>

Combine \`callers\` + \`callees\` + file \`deps\` + \`reverse-deps\` + test detection into a single "blast radius" report.

- \`--mode all|deps|dependents|tests\` selects sections
- \`--tests\` / \`--exclude-tests\` narrows every section
- Types list implementors and file-level reverse-deps
- Ambiguous callers and unresolved callees surface by default

\`\`\`
sb impact LanguageAdapter --mode tests
sb impact run_impact --exclude-tests --depth 3
\`\`\`
`

function DeckV300() {
  const [current, setCurrent] = useState(0)
  const sectionRefs = useRef<Array<HTMLElement | null>>([])

  const lastSlide = slideLabels.length - 1
  const demoRunId = current === 5 ? 1 : 0

  const goToSlide = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(lastSlide, index))
    setCurrent(clamped)

    const sectionElement = sectionRefs.current[clamped]
    if (sectionElement) {
      sectionElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    } else {
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

      if (/^[1-8]$/.test(event.key)) {
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
              <p className="eyebrow">AST-BRO / V3.0.0</p>
              <h1>
                SHOW WHAT MATTERS.
                <span>HIDE WHAT DOESN'T.</span>
              </h1>
              <p className="lede">
                <code>sb impact</code> prints the full blast radius of touching
                a symbol — callers, callees, file deps, implementors, and
                affected tests — in one call. <code>sb context</code> packs "
                everything an agent needs" into a token budget. And every edge
                that used to hide behind an opt-in flag now prints by default.
              </p>
              <div className="metric-row">
                <article className="metric-card">
                  <span className="metric-value">impact</span>
                  <span className="metric-label">6 sections, 1 round-trip</span>
                </article>
                <article className="metric-card">
                  <span className="metric-value">context</span>
                  <span className="metric-label">token-budgeted packs</span>
                </article>
                <article className="metric-card">
                  <span className="metric-value">19</span>
                  <span className="metric-label">MCP tools exposed</span>
                </article>
              </div>
            </div>

            <div className="hero-map">
              <svg viewBox="0 0 640 480" className="hero-map__svg" aria-hidden="true">
                <path d="M52 400 L180 290 L260 300 L340 220 L490 180 L590 100" />
                <path d="M90 140 L180 190 L260 160 L400 200 L520 340" />
                <path d="M130 430 L230 360 L290 370 L420 400 L550 360" />
                <path d="M260 300 L258 160" className="hero-map__minor" />
                <path d="M340 220 L420 400" className="hero-map__minor" />
                <path d="M490 180 L520 340" className="hero-map__minor" />
                <circle cx="52" cy="400" r="8" />
                <circle cx="180" cy="290" r="11" />
                <circle cx="260" cy="300" r="7" />
                <circle cx="340" cy="220" r="10" />
                <circle cx="490" cy="180" r="8" />
                <circle cx="590" cy="100" r="12" />
                <circle cx="180" cy="190" r="7" />
                <circle cx="260" cy="160" r="8" />
                <circle cx="400" cy="200" r="6" />
                <circle cx="520" cy="340" r="9" />
              </svg>
              <div className="map-chip map-chip--a">src/impact.rs</div>
              <div className="map-chip map-chip--b">src/context.rs</div>
              <div className="map-chip map-chip--c">src/file_filter.rs</div>
            </div>
          </div>
          <div className="slide-anchor">
            <span>code territory / lower-third museum anchor</span>
            <span>sb impact / sb context / show-by-default</span>
          </div>
        </section>

        <section
          id="slide-impact"
          ref={(element) => {
            sectionRefs.current[1] = element
          }}
          data-slide="1"
          className={`slide ${current === 1 ? 'is-active' : ''}`}
        >
          <div className="slide-frame">
            <div className="section-heading">
              <p className="eyebrow">BLAST RADIUS</p>
              <h2>ONE COMMAND FOR EVERYTHING IT TOUCHES.</h2>
            </div>
            <div className="pipeline-grid">
              {impactStages.map((stage) => (
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
                <span className="compression-strip__label">MODES</span>
                <p>all · deps · dependents · tests</p>
              </div>
              <div>
                <span className="compression-strip__label">FILTER</span>
                <p>--tests / --exclude-tests per section</p>
              </div>
              <div>
                <span className="compression-strip__label">TYPE</span>
                <p>implementors · methods · method callers</p>
              </div>
              <div>
                <span className="compression-strip__label">DEPTH</span>
                <p>--depth N on transitive callers</p>
              </div>
            </div>
          </div>
          <div className="slide-anchor">
            <span>src/impact.rs / six section builders / type-aware blast radius</span>
            <span>callers · callees · file deps · implementors · tests</span>
          </div>
        </section>

        <section
          id="slide-context"
          ref={(element) => {
            sectionRefs.current[2] = element
          }}
          data-slide="2"
          className={`slide ${current === 2 ? 'is-active' : ''}`}
        >
          <div className="slide-frame">
            <div className="section-heading">
              <p className="eyebrow">TOKEN-BUDGETED CONTEXT</p>
              <h2>PACK THE WINDOW. NEVER OVERFLOW IT.</h2>
            </div>
            <div className="proof-grid">
              {contextPipeline.map((step) => (
                <article key={step.tag} className="proof-card">
                  <p className="proof-card__title">
                    <code>{step.tag}</code> {step.title}
                  </p>
                  <p className="proof-card__body">{step.body}</p>
                  <p className="proof-card__meta">{step.meta}</p>
                </article>
              ))}
            </div>

            <div className="stack-strip">
              <span>target body</span>
              <span>direct callees (body→sig)</span>
              <span>direct callers (sig)</span>
              <span>transitive depth-2 (sig)</span>
              <span>ast-bro.context.v1</span>
            </div>
          </div>
          <div className="slide-anchor">
            <span>greedy knapsack / budget-bounded / type-aware walk</span>
            <span>truncated · target_omitted · body_unavailable flags</span>
          </div>
        </section>

        <section
          id="slide-surface"
          ref={(element) => {
            sectionRefs.current[3] = element
          }}
          data-slide="3"
          className={`slide ${current === 3 ? 'is-active' : ''}`}
        >
          <div className="slide-frame slide-frame--split">
            <div className="section-heading">
              <p className="eyebrow">SHOW BY DEFAULT</p>
              <h2>NO MORE OPT-IN FLAGS FOR THE NOISY BUCKET.</h2>
            </div>
            <div className="terrain-grid">
              <div className="signal-column">
                {surfaceSignals.map((item) => (
                  <article key={item.title} className="signal-card">
                    <p className="signal-card__title">
                      <code>{item.tag}</code> {item.title}
                    </p>
                    <p className="signal-card__body">{item.body}</p>
                    <p className="signal-card__coord">{item.coord}</p>
                  </article>
                ))}
              </div>

              <div className="insight-panel">
                <div className="insight-panel__topline">FLAG INVERSIONS</div>
                <div className="insight-stat">
                  <span>--include-ambiguous → --hide-ambiguous</span>
                  <small>Ambiguous callers print by default with a red tag</small>
                </div>
                <div className="insight-stat">
                  <span>--external → --hide-external</span>
                  <small>Unresolved and external callees print by default</small>
                </div>
                <div className="insight-stat">
                  <span>--include-external → --hide-external</span>
                  <small>Graph and impact sections show external nodes</small>
                </div>
                <div className="coord-stack">
                  <span>deprecation notes for the old flags</span>
                  <span>src/calls/cli.rs</span>
                  <span>src/deps/cli.rs</span>
                  <span>MCP keeps old names via a rename shim</span>
                </div>
              </div>
            </div>
          </div>
          <div className="slide-anchor">
            <span>three-pass resolver / surface-by-default / tagged red & cyan</span>
            <span>hide-* replaces include-* / deprecation warnings preserved</span>
          </div>
        </section>

        <section
          id="slide-filters"
          ref={(element) => {
            sectionRefs.current[4] = element
          }}
          data-slide="4"
          className={`slide ${current === 4 ? 'is-active' : ''}`}
        >
          <div className="slide-frame">
            <div className="section-heading">
              <p className="eyebrow">FILTERS & FALLBACKS</p>
              <h2>NARROW THE SCOPE. OPEN THE FILE.</h2>
            </div>
            <div className="proof-grid">
              {filterSignals.map((filter) => (
                <article key={filter.tag} className="proof-card">
                  <p className="proof-card__title">
                    <code>{filter.tag}</code> {filter.title}
                  </p>
                  <p className="proof-card__body">{filter.body}</p>
                  <p className="proof-card__meta">{filter.coord}</p>
                </article>
              ))}
            </div>

            <div className="stack-strip">
              <span>--tests</span>
              <span>--exclude-tests</span>
              <span>#!/usr/bin/env python3</span>
              <span>skills/ast-bro/SKILL.md</span>
              <span>include_str!()</span>
            </div>
          </div>
          <div className="slide-anchor">
            <span>test-file heuristics / shebang detection / single-source prompt</span>
            <span>--tests · --exclude-tests · #!/usr/bin/env · SKILL.md</span>
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
                <h2>THE FULL BLAST RADIUS, ONE CALL.</h2>
              </div>
              <p className="lede lede--narrow">
                <code>sb impact LanguageAdapter</code> walks callers, callees,
                file deps, implementors, and affected tests in a single pass —
                the same envelope a model receives over MCP for a one-shot tool
                call.
              </p>
              <div className="demo-facts">
                <article>
                  <span className="demo-facts__value">One call</span>
                  <p>Six sections ship in ast-bro.impact.v1 — no chained round-trips.</p>
                </article>
                <article>
                  <span className="demo-facts__value">Type-aware</span>
                  <p>Traits and classes enumerate implementors and methods, not just call sites.</p>
                </article>
                <article>
                  <span className="demo-facts__value">Test-filtered</span>
                  <p>An affected-tests section answers "what breaks" alongside production impact.</p>
                </article>
              </div>
            </div>

            <div className="demo-surface">
              <TerminalDemo
                key={demoRunId}
                active={current === 5}
                runId={demoRunId}
                script={impactScript}
                meta={{ title: 'sb impact', subtitle: 'live command output' }}
              />
              <div className="demo-summary">
                <article className="summary-card">
                  <span className="summary-card__label">Sections</span>
                  <strong>6 resolved</strong>
                </article>
                <article className="summary-card">
                  <span className="summary-card__label">Implementors</span>
                  <strong>11 adapters</strong>
                </article>
                <article className="summary-card">
                  <span className="summary-card__label">Status</span>
                  <strong>ast-bro.impact.v1</strong>
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
            <span>one command / full blast radius / test-aware</span>
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
              <h2>BREAKING SURFACE. NAMED AND DOCUMENTED.</h2>
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
              <span>impact</span>
              <span>context</span>
              <span>show-by-default</span>
              <span>ast-bro.impact.v1</span>
              <span>ast-bro.context.v1</span>
              <span>v3.0.0 major bump</span>
            </div>
          </div>
          <div className="slide-anchor">
            <span>flag inversions / single-source prompt / named breaking surface</span>
            <span>19 MCP tools / 1119 tests / deprecation warnings ship</span>
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
              <h2>MAKE IMPACT, CONTEXT, AND FILTERS DEFAULT.</h2>
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
                Show the blast radius. Pack the window. Filter what you don't need.
              </p>
              <p className="closing-panel__meta">
                Use: sb impact &lt;symbol&gt; [--mode all|deps|dependents|tests] /
                sb context &lt;symbol&gt; [--budget N] /
                scope with --tests · --exclude-tests ·{' '}
                <a className="chrome-coords--link" href="#v2.4.0">
                  v2.4.0 archive
                </a>
              </p>
            </div>
          </div>
          <div className="slide-anchor">
            <span>museum print lower third / centered metadata / controlled negative space</span>
            <span>ast-bro / v3.0.0 / impact · context · filters</span>
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
          <span>1-8 jump</span>
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

export default DeckV300
