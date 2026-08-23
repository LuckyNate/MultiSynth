import fs from "node:fs";
import path from "node:path";

const ROOT=path.resolve("app/src/main/assets");

// These are the only files allowed to own shared-control/prefab geometry.
// Module/theme files may set colors/tokens, labels and metadata, but not layout.
const OWNER_FILES=new Set([
  "control-surface.css",
  "control-performance-keyboard.css",
  "control-ribbon.css",
  "rack-instrument-editor.css",
  "rack-module-editor.css",
  "rack-ui-primitives.js",
  "rack-ui-prefabs.js"
]);

const PROTECTED_SELECTOR=/(?:\.ms-(?:control(?:-[\w-]+)?|knob(?:-[\w-]+)?|performance-keyboard|pk-[\w-]+)|\.rui[\w-]*|\.rackKnob[\w-]*|\.rackChoice[\w-]*|\.adsr(?:Container|Screen|Knobs)|\.performanceKeyboard|\.pinnedPerformanceKeyboard|\.scopeShell|\.scopeBezel|\.scopeLabel|\.ruiPinnedScope)/;
const GEOMETRY_PROPERTY=/^(?:position|inset|top|right|bottom|left|width|min-width|max-width|height|min-height|max-height|margin(?:-(?:top|right|bottom|left))?|padding(?:-(?:top|right|bottom|left))?|transform|translate|display|grid(?:-[\w-]+)?|flex(?:-[\w-]+)?|place-[\w-]+|align-[\w-]+|justify-[\w-]+|overflow(?:-[xy])?|box-sizing|z-index|float|clear)$/i;
const OBSOLETE_KEYBOARD_TOKEN=/(?:\.rackKeyboard\b|\.keyboardKeys\b|\brack-keyboard\.(?:js|css)\b|\bbuildKeyboard\s*\()/;

function walk(dir){
  const out=[];
  for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
    const p=path.join(dir,ent.name);
    if(ent.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}
function stripComments(s){return s.replace(/\/\*[\s\S]*?\*\//g,"");}
function lineOf(text,index){return text.slice(0,index).split("\n").length;}
function rel(file){return path.relative(process.cwd(),file);}
function isOwner(file){return OWNER_FILES.has(path.basename(file));}

const violations=[];
for(const file of walk(ROOT)){
  const ext=path.extname(file).toLowerCase();
  if(![".css",".js",".html"].includes(ext)) continue;
  const raw=fs.readFileSync(file,"utf8");

  // Deleted/parallel keyboard implementations are forbidden everywhere. The universal
  // keyboard is control-performance-keyboard.{js,css}; consumers only mount/configure it.
  if(path.basename(file)!=="control-performance-keyboard.js"&&path.basename(file)!=="control-performance-keyboard.css"){
    const m=OBSOLETE_KEYBOARD_TOKEN.exec(raw);
    if(m) violations.push({file:rel(file),line:lineOf(raw,m.index),selector:m[0],property:"obsolete parallel keyboard implementation"});
  }

  if(ext!==".css"||isOwner(file)) continue;
  const text=stripComments(raw),rule=/([^{}]+)\{([^{}]*)\}/g;
  let m;
  while((m=rule.exec(text))){
    const selector=m[1].trim();
    if(!PROTECTED_SELECTOR.test(selector)) continue;
    for(const decl of m[2].split(";")){
      const colon=decl.indexOf(":");
      if(colon<0) continue;
      const prop=decl.slice(0,colon).trim();
      if(!GEOMETRY_PROPERTY.test(prop)) continue;
      violations.push({file:rel(file),line:lineOf(text,m.index),selector,property:prop});
    }
  }
}

if(violations.length){
  console.error("Shared-control ownership audit FAILED. Shared controls/prefabs have exactly one geometry owner; modules may only configure/theme them.\n");
  for(const v of violations) console.error(`${v.file}:${v.line}  ${v.selector}  -> ${v.property}`);
  console.error(`\n${violations.length} ownership violation(s) must be removed or moved into the shared owner.`);
  process.exit(1);
}
console.log("Shared-control ownership audit passed: no module-specific geometry overrides or parallel keyboard implementations.");
