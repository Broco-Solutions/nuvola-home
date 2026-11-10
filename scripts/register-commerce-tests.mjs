import { registerHooks } from "node:module";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const sourceRoot = new URL("../src/", import.meta.url);

// Use the installed TypeScript compiler, preserving the app's @/ imports.
// Only application files are transformed; no extra test dependencies or build.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      const base = new URL(specifier.slice(2), sourceRoot);
      for (const extension of [".ts", ".tsx"]) {
        if (existsSync(fileURLToPath(base) + extension)) {
          return nextResolve(base.href + extension, context);
        }
      }
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.startsWith(sourceRoot.href) && /\.tsx?$/.test(url)) {
      const filename = fileURLToPath(url);
      return {
        format: "module",
        shortCircuit: true,
        source: ts.transpileModule(readFileSync(filename, "utf8"), {
          fileName: filename,
          compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
        }).outputText,
      };
    }
    return nextLoad(url, context);
  },
});
