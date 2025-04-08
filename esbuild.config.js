import { build } from "esbuild";
import { nodeExternalsPlugin } from "esbuild-node-externals";

build({
  entryPoints: ["src/app.ts"],
  bundle: true,
  platform: "node",
  target: "es2022",
  outdir: "dist",
  format: "esm",
  sourcemap: true,
  minify: false,
  splitting: false,
  tsconfig: "tsconfig.json",
  outExtension: { ".js": ".js" },
  plugins: [nodeExternalsPlugin()],
  alias: {
    "@": "./src",
  },
}).catch(() => process.exit(1));
