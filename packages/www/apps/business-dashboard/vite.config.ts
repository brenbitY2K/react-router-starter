import { sentryVitePlugin } from "@sentry/vite-plugin";
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import babel from "vite-plugin-babel";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";
import { glob } from "glob";

const MODE = process.env.NODE_ENV;

declare module "react-router" {
  interface Future {
    v3_singleFetch: true;
  }
}

const ReactCompilerConfig = {
  /* ... */
};

export default defineConfig({
  define: {
    global: {},
  },
  plugins: [
    reactRouter(),
    babel({
      filter: /\.[jt]sx?$/,
      babelConfig: {
        presets: ["@babel/preset-typescript"],
        plugins: [["babel-plugin-react-compiler", ReactCompilerConfig]],
      },
    }),
    tsconfigPaths(),
    process.env.SENTRY_AUTH_TOKEN
      ? sentryVitePlugin({
          disable: MODE !== "production",
          authToken: process.env.SENTRY_AUTH_TOKEN,
          org: process.env.SENTRY_ORG,
          project: process.env.SENTRY_PROJECT,
          // TODO: Maybe do this?
          // release: {
          //   name: process.env.COMMIT_SHA,
          //   setCommits: {
          //     auto: true,
          //   },
          // },
          sourcemaps: {
            filesToDeleteAfterUpload: await glob([
              "./build/**/*.map",
              ".server-build/**/*.map",
            ]),
          },
        })
      : null,
  ],

  server: {
    port: 3000,
  },

  resolve: {
    alias: {
      "~": path.resolve(__dirname, "app"),
    },
  },

  build: {
    cssMinify: MODE === "production",

    rollupOptions: {
      external: [/node:.*/, "stream", "crypto", "fsevents"],
    },

    assetsInlineLimit: (source: string) => {
      if (source.endsWith("sprite.svg")) {
        return false;
      }
    },

    sourcemap: true,
  },
});
