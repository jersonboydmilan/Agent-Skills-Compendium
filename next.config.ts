import { join } from "node:path";
import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  // Pin the trace root: a lockfile in a parent directory otherwise makes Next
  // guess wrong about where this project starts.
  outputFileTracingRoot: join(process.cwd()),
  // Content and the generated schema are read from disk at request time; keep
  // both traceable so a standalone deployment ships them.
  outputFileTracingIncludes: { "/**": ["./content/**/*", "./schema/*.json"] },
};

export default config;
