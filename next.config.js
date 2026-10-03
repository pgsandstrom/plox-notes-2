// plain js so the production image can load it without the swc compiler
/** @type {import("next").NextConfig} */
const nextConfig = {
  // fail the build instead of silently skipping a component the compiler cannot optimize
  reactCompiler: { panicThreshold: "all_errors" },
}

export default nextConfig
