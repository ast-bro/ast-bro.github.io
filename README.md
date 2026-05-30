# ast-bro Website

Presentation website and landing-page deck for [ast-bro](https://github.com/aeroxy/ast-bro), a fast AST-based code navigation toolkit for source files, coding agents, and developers who want code structure without paying to read every file line-by-line.

This site is built to present the ast-bro visual identity, the `sb squeeze` story, and the broader ast-bro product surface: `map`, `show`, `digest`, `surface`, dependency graphs, call graphs, hybrid semantic code search, and reversible log compression.

## What Is ast-bro?

`ast-bro` is an AST-based code-navigation toolkit that helps humans and LLM coding agents understand unfamiliar repositories faster and with fewer tokens.

Core capabilities include:

- `map`, `digest`, `show`: inspect file shape and symbol source without dumping full bodies by default
- `surface`: resolve the true public API of a package, crate, or module
- `deps`, `reverse-deps`, `cycles`, `graph`: inspect file-level dependency graphs
- `callers`, `callees`: inspect AST-accurate symbol-level call graphs
- `search`, `find-related`: hybrid symbol and behaviour search across the repo
- `squeeze`: compress repetitive logs and text into a smaller reversible format

## ast-outline Rename

`ast-bro` was previously called `ast-outline`.

That rename matters for both users and search:

- `ast-outline` is the legacy project name
- `ast-bro` is the current and canonical project name
- `sb` is the short command alias
- searches for `ast outline`, `ast-outline`, `ast-bro`, `sb squeeze`, `AST code navigation`, `dependency graph`, `call graph`, and `semantic code search` should all point back to the same product story

## Local Development

```bash
bun install
bun run dev
bun run build
```

## Main Project

- Main repo: [github.com/aeroxy/ast-bro](https://github.com/aeroxy/ast-bro)
- Main product docs: [github.com/aeroxy/ast-bro#readme](https://github.com/aeroxy/ast-bro#readme)
