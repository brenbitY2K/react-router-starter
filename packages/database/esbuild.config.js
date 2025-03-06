import esbuild from "esbuild";

esbuild.build({
  entryPoints: [
    "./src/index.ts",
    "./src/schema/index.ts",
    "./src/utils/index.ts",
  ],
  bundle: true,
  platform: "node",
  outdir: "./dist",
  format: "esm",
  sourcemap: false,
  logLevel: "info",
  external: ["@paralleldrive/cuid2"],
});
