/**
 * 按需组装 Monaco：编辑器本体 + 基础命令 + 查找替换 + 判题支持的语言。
 * 直接 import "monaco-editor" 会把全部语言和功能都打包进来，体积大很多。
 * JavaScript 的补全和报错由 TypeScript 语言服务提供，跑在单独的 worker 里。
 */
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import "monaco-editor/esm/vs/editor/browser/coreCommands";
import "monaco-editor/esm/vs/editor/contrib/find/browser/findController";
import "monaco-editor/esm/vs/basic-languages/cpp/cpp.contribution";
import "monaco-editor/esm/vs/basic-languages/go/go.contribution";
import "monaco-editor/esm/vs/basic-languages/java/java.contribution";
import "monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution";
import "monaco-editor/esm/vs/basic-languages/python/python.contribution";
import "monaco-editor/esm/vs/basic-languages/typescript/typescript.contribution";
import "monaco-editor/esm/vs/language/typescript/monaco.contribution";
import EditorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import TsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";

self.MonacoEnvironment = {
  getWorker: (_workerId: string, label: string) =>
    label === "typescript" || label === "javascript"
      ? new TsWorker()
      : new EditorWorker(),
};

export default monaco;
