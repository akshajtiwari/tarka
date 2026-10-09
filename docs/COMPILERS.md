# Running and compiling code on a phone

Research notes (October 2026) on how TARKA can run code. v1 runs code **on the device only**.
This page lists what works today, what could come next, and the trade-offs.
Re-check versions and licenses before building any of the "next" options.

## The constraint

A phone app can't just run `gcc` or `javac`:

- **iOS** forbids executing downloaded native code. Anything that runs code has to be an interpreter or WebAssembly.
- **Android 10+** only lets an app execute binaries that ship inside its own APK, in the native library folder (the W^X rule).
  Downloaded binaries can't be executed directly.
- Phones throttle CPU and kill background work. Long builds belong on a real computer.

That leaves three families: **WebAssembly/JS inside a WebView** (works on both platforms),
**Android-native tricks**, and **remote execution**.

## 1. Inside the WebView (works on Android and iOS, offline after the first download)

The WebView ships a fast JavaScript engine and WebAssembly. TARKA's runner is a hidden DOM component
that runs code in a Web Worker, so a stuck loop can be killed.

| Language | Technology | Size / speed | Status for TARKA |
|---|---|---|---|
| JavaScript | the WebView's own engine | instant | **v1** |
| TypeScript | `sucrase` strips the types → JS | ~200 KB, instant | **v1** |
| HTML/CSS | sandboxed iframe preview | instant | **v1** |
| Python | **Pyodide** (CPython compiled to WASM) | ~10 MB first load, then cached; near-native for pure Python | **v1** |
| Lua | `wasmoon` (Lua 5.4 in WASM) | ~300 KB | easy next |
| SQL | `sql.js` (SQLite in WASM) | ~1 MB | easy next |
| Ruby | `ruby.wasm` | ~20 MB | possible |
| PHP | `php-wasm` (from WordPress Playground) | ~15 MB | possible |
| C / C++ | **clang + lld compiled to WASM**, e.g. `@yowasp/clang` (~25 MB gzipped, ~100 MB of toolchain on the first run) or Wasmer's clang package. The output is a WASI program run with a small WASI shim such as `@bjorn3/browser_wasi_shim`. | heavy download, compiles in seconds | **spike needed**: can a phone WebView hold the toolchain in memory? |
| C (light) | `picoc` interpreter in WASM, or `JSCPP` (a C++ subset interpreter in JS) | small | good for learning and small programs, not real projects |
| Java | **CheerpJ**: a JVM in WASM that can run the real `javac` | large; check the license (free for personal and open-source use?) | possible |
| Go | `yaegi` (a Go interpreter) compiled to WASM | ~10 MB | possible |
| Rust | none practical today (rustc is too big for a WebView) | — | remote only |

**What v1 learned on a real Android WebView (2026-10):**
- `importScripts()` from another site fails inside a worker, but `fetch` and `import()` work.
- Pyodide 314 needs a *module* worker: `new Worker(url, { type: 'module' })` plus `await import('…/pyodide.mjs')`.
- DOM-component props arrive as fresh JSON copies on every re-render. Key effects on ids, not objects, or a run restarts on every output line.

**Recommendation after v1:** add Lua and SQL (tiny, offline, easy), then run a C/C++ spike with `@yowasp/clang`.
Measure memory use on a mid-range phone before promising C++.

## 2. Android-only native options

| Option | How it works | Pros | Cons |
|---|---|---|---|
| **Termux bridge** | The user installs Termux (F-Droid or GitHub build, **not** the Play Store build). Turn on `allow-external-apps=true` in `~/.termux/termux.properties`, and TARKA declares `com.termux.permission.RUN_COMMAND`. TARKA sends the `com.termux.RUN_COMMAND` intent (with `RUN_COMMAND_PATH`, arguments and `RUN_COMMAND_BACKGROUND=true`). | real gcc, clang, python, node, go, rust, openjdk from `pkg install` | needs a native module to send intents and receive results (a PendingIntent callback; Termux:Tasker caps results at 100 KB); extra setup for the user |
| **Bundled binaries** | Ship small toolchains (e.g. `tcc`) as `lib*.so` files in `jniLibs`, then run them with `ProcessBuilder` from `nativeLibraryDir`. | no extra app needed | bigger APK, a native module, every architecture must be built |
| **PRoot + Ubuntu** (NimoteCode's "Local Linux") | Ship PRoot, download an Ubuntu rootfs, `apt install` toolchains. Talk to it over a local SSH server. | a full Linux userland, no root | large and complex; PRoot is not a VM (ptrace and /proc quirks); Android kills background processes |

**Recommendation:** a Termux bridge is the cheapest way to get "real" compilers on Android.
Build it as a later phase with a small Expo native module.

## 3. Remote execution (any language, but needs a network)

| Option | Notes |
|---|---|
| **Piston** (`engineer-man/piston`) | Open source, MIT, many languages. Self-host it with one `docker run` (the laptop already has Docker). The public `emkc.org` API is rate-limited to 5 requests per second and no longer hands out unlimited keys. |
| **Judge0 CE** | Open source, many languages; self-host or use RapidAPI. |
| **SSH to your own machine** | The most powerful: real projects, real toolchains. Needs a native SSH library and a terminal (xterm.js). This is NimoteCode's main model and is on our roadmap. |

## Summary

- **v1 (now):** JS, TS, HTML and Python, fully on the phone, on Android and iOS.
- **Next:** Lua and SQL in WASM, then a C/C++ clang-in-WASM spike.
- **Android power users:** the Termux bridge.
- **Big projects:** SSH workspaces, with Piston as a self-hosted option.
