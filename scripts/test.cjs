// Compile TS/TSX in memory so regression tests can render the actual React views.
const ts = require('typescript');
const run = require('jiti')(__filename, {
  extensions: ['.js', '.json', '.ts', '.tsx'],
  cache: false,
  transform: ({ source, filename }) => ({
    code: ts.transpileModule(source, {
      fileName: filename,
      compilerOptions: {
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
    }).outputText,
  }),
});
run('../src/test_scenarios.ts');
