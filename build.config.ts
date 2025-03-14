import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  entries: ["src/index"],
  clean: true,
  declaration: true,
  rollup: {
    emitCJS: true,
    output: {
      exports: 'named',
      format: 'es',
      paths: {
        "vitepress-plugin-setfrontmatter": "./dist",
      },
    },
    esbuild: {
      minify: true,
    },
  },
  externals: ["@types/node", "typescript"],
});