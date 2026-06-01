import { useEffect, useMemo, useState } from 'react'
import { Terminal, useTerminal } from '@wterm/react'
import '@wterm/react/css'

export type Frame = {
  delay: number
  text: string
}

type TerminalDemoProps = {
  active: boolean
  runId: number
  script?: Frame[]
  meta?: { title: string; subtitle: string }
}

const squeezeScript: Frame[] = [
  {
    delay: 180,
    text: '\x1b[38;5;179msb squeeze logs/desktop-ci.log 140:220 --json\x1b[0m\r\n',
  },
  { delay: 420, text: '\r\n' },
  { delay: 360, text: '{\r\n' },
  { delay: 180, text: '  "schema": "ast-bro.squeeze.v1",\r\n' },
  { delay: 180, text: '  "path": "logs/desktop-ci.log",\r\n' },
  { delay: 180, text: '  "range": { "start": 140, "end": 220 },\r\n' },
  { delay: 180, text: '  "raw_bytes": 46080,\r\n' },
  { delay: 180, text: '  "squeezed_bytes": 10440,\r\n' },
  { delay: 180, text: '  "savings_pct": 77.3,\r\n' },
  { delay: 180, text: '  "emitted": "squeezed",\r\n' },
  {
    delay: 180,
    text: '  "legend": [\r\n',
  },
  {
    delay: 180,
    text: '    { "tag": "#T#", "value": "2026-05-30T11:54:" },\r\n',
  },
  {
    delay: 180,
    text: '    { "tag": "#0#", "value": "[WinFocusMonitor]" },\r\n',
  },
  {
    delay: 180,
    text: '    { "tag": "#1#", "value": "hwnd=" },\r\n',
  },
  {
    delay: 180,
    text: '    { "tag": "&1", "value": "#T#19.557 #0##@##8##81# #90#" }\r\n',
  },
  { delay: 180, text: '  ],\r\n' },
  {
    delay: 180,
    text: '  "body": "&1:C\\n&T#19.558 #0##@##8##81# #90# x11\\n#T#19.560 #0# #1#0x1a2f"\r\n',
  },
  { delay: 240, text: '}\r\n' },
  { delay: 420, text: '\r\n' },
  {
    delay: 320,
    text: '\x1b[38;5;179m# squeezed 45.0KB -> 10.2KB (-77.3%)\x1b[0m\r\n',
  },
  {
    delay: 320,
    text: '\x1b[38;5;250m# downstream models recover exact text via legend replay\x1b[0m\r\n',
  },
]

export function TerminalDemo({
  active,
  runId,
  script,
  meta = { title: 'sb squeeze', subtitle: 'live command output' },
}: TerminalDemoProps) {
  const { ref, write } = useTerminal()
  const [ready, setReady] = useState(false)
  const frames = useMemo(() => script ?? squeezeScript, [script])

  useEffect(() => {
    if (!active || !ready) {
      return
    }

    write('\x1bc\x1b[2J\x1b[3J\x1b[H')

    let elapsed = 120
    const timers = frames.map((frame) => {
      elapsed += frame.delay
      return window.setTimeout(() => {
        write(frame.text)
      }, elapsed)
    })

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [active, frames, ready, runId, write])

  return (
    <div className="terminal-shell" aria-hidden={!active} inert={!active}>
      <div className="terminal-shell__meta">
        <span>{meta.title}</span>
        <span>{meta.subtitle}</span>
      </div>
      <Terminal
        key={runId}
        ref={ref}
        className="demo-terminal"
        rows={18}
        cols={76}
        cursorBlink
        onData={() => {}}
        onReady={() => setReady(true)}
      />
    </div>
  )
}
