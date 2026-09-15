import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const files = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
  .split("\0")
  .filter(Boolean);

const textExt = /\.(?:js|mjs|cjs|ts|tsx|jsx|css|html|htm|md|txt|list|json|xml|yml|yaml|gradle|kts|java|kt|py|sh)$/i;
const textNames = new Set(["gradle.properties", "settings.gradle.kts", "build.gradle.kts", ".gitignore"]);

const forbidden = [
  { name: "mouse token", re: /\bmouse(?:down|up|move|enter|leave|over|out|wheel)?\b/i },
  { name: "MouseEvent", re: /\bMouseEvent\b/ },
  { name: "mouse pointerType branch", re: /pointerType\s*(?:===|!==|==|!=)\s*["']mouse["']/ },
  { name: "wheel interaction", re: /addEventListener\s*\(\s*["']wheel["']/ },
  { name: "mouse cursor styling", re: /\bcursor\s*:/i },
];

const moduleGesture = /app\/src\/main\/assets\/modules\/.*\.js$/i;
const directGesture = /addEventListener\s*\(\s*["'](?:pointerdown|pointermove|pointerup|pointercancel|touchstart|touchmove|touchend|touchcancel)["']/;

const violations = [];
let scanned = 0;

for (const file of files) {
  if (!(textExt.test(file) || textNames.has(file))) continue;
  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  if (text.includes("\u0000")) continue;
  scanned++;
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const rule of forbidden) {
      if (rule.re.test(line)) violations.push(`${file}:${i + 1}: ${rule.name}: ${line.trim()}`);
    }
    if (moduleGesture.test(file) && directGesture.test(line)) {
      violations.push(`${file}:${i + 1}: module-local direct gesture handler overrides canonical interaction ownership: ${line.trim()}`);
    }
  }
}

console.log(`Touch interaction audit scanned ${scanned} tracked text files.`);
if (violations.length) {
  console.error("Touch interaction audit FAILED:\n" + violations.join("\n"));
  process.exit(1);
}
console.log("Touch interaction audit passed: no mouse-specific behavior or module-local canonical gesture overrides found.");
