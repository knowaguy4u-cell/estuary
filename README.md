# ESTUARY ENGINE

An offline hydraulic defense game with an integer Rust simulation and a WebGL2 cutaway city. Clear 18 waves and the Undertow Regent while keeping City Integrity above zero.

Serve `game/` with any static HTTP server and open `index.html` in desktop Chrome. The shipped Wasm is prebuilt. No runtime downloads or external services are used.

Controls: 1–3 selects a basin; Q fills, E drains, Space holds. Click a socket, then Z builds a Breaker, X a Harpoon, C a Cradle. U upgrades that socket, F repairs, P pumps. Escape pauses, R requests restart, M mutes. All gate and construction actions also have buttons.

For reproducible scenes, append `?shot=title&seed=41`, `?shot=boon&seed=41`, `?shot=boss&seed=41`, or `?shot=victory&seed=41`. The last three replay commands through the real core; their values are earned, rather than preset counters. Scene controls resume normal play. These replays take a moment to prepare.

Build the core with `cargo build --manifest-path core/Cargo.toml --release --target wasm32-unknown-unknown`, then copy its `estuary_core.wasm` to `game/vendor/estuary-core.wasm`. Build artifacts need not be shipped.

Run `node tools/verify.mjs` for full-run, defeat, reset, command-buffer and fixture checks. It writes evidence beside this repository. That policy is a verification strategy, not an automatic player in normal play.

The make.fun entrypoint is `main.ts`. After four actual captures are installed in `screenshots/` (cover first by name), `MAKEFUN_OUTPUT_DIR=/tmp/estuary-output node main.ts` copies the static game and builds the dossier with the unchanged kit library. Screenshots are not included in this build environment.
