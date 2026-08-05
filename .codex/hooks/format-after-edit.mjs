import { existsSync, readFileSync } from "node:fs";
import { isAbsolute, join, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const input = JSON.parse(readFileSync(0, "utf8"));
const patch =
  typeof input?.tool_input === "string"
    ? input.tool_input
    : input?.tool_input?.command ?? input?.tool_input?.input;
const toolName = input?.tool_name ?? "";

if (!toolName.endsWith("apply_patch") || typeof patch !== "string") {
  process.exit(0);
}

const rootResult = spawnSync("git", ["rev-parse", "--show-toplevel"], {
  cwd: input.cwd || process.cwd(),
  encoding: "utf8",
});

if (rootResult.status !== 0) {
  process.stderr.write("Automatic formatting skipped: git root not found.\n");
  process.exit(2);
}

const root = rootResult.stdout.trim();
const files = [
  ...patch.matchAll(/^\*\*\* (?:Add|Update|Move to) File: (.+)$/gm),
]
  .map((match) => match[1].trim())
  .map((file) => (isAbsolute(file) ? resolve(file) : resolve(root, file)))
  .filter((file) => {
    const pathFromRoot = relative(root, file);
    return (
      pathFromRoot !== "" &&
      !pathFromRoot.startsWith("..") &&
      !isAbsolute(pathFromRoot) &&
      existsSync(file)
    );
  });

const uniqueFiles = [...new Set(files)];
if (uniqueFiles.length === 0) process.exit(0);

const prettier = join(root, "node_modules", "prettier", "bin-prettier.js");

if (!existsSync(prettier)) {
  process.stderr.write(
    "Automatic formatting failed: Prettier is not installed.\n"
  );
  process.exit(2);
}

const formatResult = spawnSync(
  process.execPath,
  [prettier, "--write", "--ignore-unknown", ...uniqueFiles],
  {
    cwd: root,
    stdio: "inherit",
  }
);

if (formatResult.status !== 0) {
  process.stderr.write("Automatic formatting failed for edited files.\n");
  process.exit(2);
}
