import esbuild from "esbuild";
import glob from "tiny-glob";

const entryPoints = await glob("src/**/*(.ts|.tsx)");

esbuild.build({
  entryPoints,
  bundle: true,
  outdir: "dist",
  platform: "node",
  format: "esm",
  sourcemap: true,
  external: ["react", "react-dom"],
  target: ["esnext"],
});
