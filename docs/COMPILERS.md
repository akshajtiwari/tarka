# Running and compiling code on a phone

How TARKA runs code, and the researched options for compiled languages (October 2026).
Sizes and licences were checked on 2026-10-09; re-check them before building anything here.

## Status in v0.2

| Language | How | Where |
|---|---|---|
| JavaScript, TypeScript | Web Worker in a hidden WebView; TS stripped by sucrase. `npm install` adds packages that load from esm.sh. | in-app terminal |
| Python | Pyodide (CPython in WASM), one session per project. `pip install` uses micropip. Live `input()` works through JSPI. | in-app terminal; Python is installed during setup |
| HTML/CSS | sandboxed iframe preview | `run page.html` |
| Anything Termux can run (gcc, clang, java, go, rust, node…) | **Termux bridge**: `termux <command>` copies the project to `~/tarka/<project>` in Termux and runs the command through the `RUN_COMMAND` intent. Output comes back when the command finishes, up to about 100 KB, and input can't be typed live. | needs the Termux app (F-Droid), see Settings → Termux |

## The constraints (why not just ship gcc)

- **Android 10+ W^X:** an app can only execute binaries shipped in its own APK, as `lib*.so` in `jniLibs`, run from
  `nativeLibraryDir`. Files in the app's data folders can't be executed, and Google Play requires target SDK 36.
- **No cross-origin isolation in Android WebView** (one renderer per app), so **no SharedArrayBuffer** and no WASM threads.
  Anything that needs COOP/COEP is out: `@wasmer/sdk`, Runno's worker host, WebContainers.
- **JSPI (Chrome 137+)** lets WASM pause for input. TARKA already uses it for Python's `input()`. The same trick
  gives compiled WASI programs live stdin.
- **iOS** forbids running downloaded native code, so WebAssembly is the only portable route.

## Options by language

### C and C++

| Option | Size | Licence | Verdict |
|---|---|---|---|
| **`@yowasp/clang`**: Clang/LLD 22 compiled to WASM, with the wasi-libc and libc++ sysroot | ~23 MB download (75 MB wasm unpacked) | ISC / Apache-2.0 | **Best full C/C++ route.** Needs no SharedArrayBuffer and runs in our worker. No C++ exceptions (no libunwind). The GitHub repo was archived 2026-03 (source moved to Codeberg), so pin the version and self-host the files. Check memory on a mid-range phone. |
| **xcc `wcc`**: a tiny C-to-WASM compiler | **166 KB** | MIT, active | **Instant C** (C only, small libc, no optimizer). Great first step and a fallback while clang downloads. |
| **Native TinyCC** in `jniLibs` (owner's idea) | +1–3 MB APK | LGPL-2.1 | Fast, native, real stdin through a Kotlin module. Output must run via `tcc -run` (compiles into memory) or `linker64 a.out`. Depends on SELinux and linker behaviour Google could tighten. C only. |
| `@live-codes/clang-wasm` | ~29 MB gz | MIT | an alternative packaging of clang-in-WASM |
| JSCPP, picoc | small | MIT | stale since 2021, subsets only: teaching toys |

Compiled `.wasm` programs run with **`@bjorn3/browser_wasi_shim`** (MIT/Apache).
- Live stdin: override `fd_read` with `WebAssembly.Suspending`, and run `_start` through `WebAssembly.promising` (JSPI).
- Older WebViews: give stdin up front instead.

### Java (and Kotlin)

| Option | Size | Licence | Verdict |
|---|---|---|---|
| **teavm-javac**: the real OpenJDK javac (JDK 25u) plus TeaVM in one WasmGC module | ~4 MB gz | Apache-2.0 (OpenJDK parts GPLv2 + Classpath Exception) | **Best fit**: offline, small, active. Programs run on TeaVM's partial copy of the Java standard library; stdin needs a shim. |
| CheerpJ 4.3 (JVM in WASM, runs javac from tools.jar) | large | the free tier needs their CDN; offline needs a paid licence | not suitable |
| **Native ECJ + D8 + `InMemoryDexClassLoader`** (as CodeAssist does) | +25–60 MB APK | EPL-2.0 / BSD-3 | the "full Java" route if TeaVM's gaps hurt. Run user code in a separate process. Copy no GPL code from CodeAssist. |
| Janino (owner's idea) | 1.1 MB | BSD-3 | **No**: no lambdas, `var` or method references, and archived 2026-07 |
| BeanShell (owner's idea) | 0.5 MB | — | **No**: a Java-like script language, not real Java |
| Kotlin | — | — | no on-device compiler today: use Termux |

### Others

| Language | Package | Size | Licence | Notes |
|---|---|---|---|---|
| Lua 5.4 | wasmoon 1.16 | 0.3 MB | MIT | easiest win |
| SQL | sql.js 1.14 / @sqlite.org/sqlite-wasm | 0.7 / ~3 MB | MIT / Apache-2.0 | easy win |
| Go | yaegi-wasm (interpreter) | 8.4 MB gz | ISC / Apache-2.0 | real Go compilers in the browser are unmaintained |
| Ruby 3.4 | @ruby/3.4-wasm-wasi | ~9 MB gz | MIT | |
| C# | @live-codes/blazor-wasm (Roslyn) | ~52 MB | MIT | |
| Zig 0.14 | @seth0x41/zig-wasm | ~6 MB | MIT | |
| Rust | Miri compiled to WASM (@live-codes/rust-wasm) | ~55 MB | MIT | an interpreter, slow, std only: teaching mode. Real Rust needs Termux. |
| Swift | @live-codes/swift-wasm | ~70 MB gz | MIT | |
| PHP | @php-wasm/web | tens of MB | **GPL-2.0+** | don't copy it into TARKA |

[LiveCodes](https://github.com/live-codes/livecodes) (MIT) wraps most of these and is a good reference.

### Remote execution (opt-in only: code leaves the phone)

- **Piston:** the public API needs a token since 2026-02 (non-commercial education only). Self-hosting with Docker is MIT.
- **Judge0:** GPL-3.0 to self-host; hosted plans are paid.
- **Godbolt:** donation-funded, so never point app traffic at it.
- Any remote option must use an endpoint the user types in, and be disclosed in the privacy policy.

### Android's own "Linux Terminal" (developer options)

It has no API for other apps. Its VM forwards ports ≥1024 to the phone's localhost, so a user could start an SSH
server there by hand. This is documentation-only for now.

## Recommended roadmap

1. **C, instantly, offline:** xcc `wcc` in the worker, plus `browser_wasi_shim` with JSPI stdin. Tiny download, about a day of work.
2. **Lua and SQL:** under 1 MB each.
3. **Java:** teavm-javac (about 4 MB gz) with a stdin shim.
4. **C++ (and full C):** `@yowasp/clang` as a downloadable "language pack" (about 23 MB, cached), measured on a mid-range phone first.
5. **More packs:** Go (Yaegi), Ruby, C#, Zig; then Rust and Swift as labelled teaching modes.
6. **Native options**, only if needed: TinyCC in `jniLibs` (`tcc -run`), or ECJ + D8 for full Java.
7. **Termux** stays the "real Linux" answer for everything else (already built).

## Sources

- C/C++: [@yowasp/clang](https://www.npmjs.com/package/@yowasp/clang), [YoWASP](https://yowasp.org/), [xcc](https://github.com/tyfkda/xcc), [browser_wasi_shim](https://github.com/bjorn3/browser_wasi_shim), [V8 JSPI](https://v8.dev/blog/jspi)
- Native binaries: [Termux tcc build](https://github.com/termux/termux-packages/blob/master/packages/tcc/build.sh), [termux-exec](https://github.com/fornwall/termux-exec), [Play target SDK](https://developer.android.com/google/play/requirements/target-sdk)
- Java: [teavm-javac](https://github.com/konsoletyper/teavm-javac), [CheerpJ licensing](https://cheerpj.com/docs/licensing), [Janino](https://janino-compiler.github.io/janino/), [CodeAssist](https://github.com/tyron12233/CodeAssist)
- Remote: [Piston](https://github.com/engineer-man/piston), [Judge0](https://github.com/judge0/judge0), [Godbolt API](https://github.com/compiler-explorer/compiler-explorer/blob/main/docs/API.md)
- Android WebView isolation: [Hermit known issues](https://hermit.chimbori.com/help/known-issues)
