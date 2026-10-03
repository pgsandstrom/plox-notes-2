import type { KnipConfig } from "knip"

// `!` suffix marks a pattern as production. The next plugin finds the pages router entries.
// The custom server is only reachable through the `start` script, which --production does not
// follow, so it has to be listed as a production entry itself.
const config: KnipConfig = {
  entry: ["server/index.ts!"],
  project: ["**/*.{ts,tsx}!"],
  // an export used inside its own file is a style nit, not dead code
  ignoreExportsUsedInFile: true,
}

export default config
