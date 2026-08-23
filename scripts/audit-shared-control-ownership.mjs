import fs from "node:fs";
import path from "node:path";

const ROOT=path.resolve("app/src/main/assets");
const OWNER_FILES=new Set([
  "control-surface.css",
  "control-performance-keyboard.css",
  "control-ribbon.css",
  "rack-instrument-editor.css"
]);

const PROTECTED_SELECTOR=/(?:\.ms-(?:control(?:-[\w-]+)?|knob(?:-[\w-]+)?|performance-keyboard|pk-[\w-]+)|\.rui[\w-]*|\.rackKnob[\w-]*|\.rackChoice[\w-]*|\.adsr(?:Container|Screen|Knobs)|\.performanceKeyboard|\.pinnedPerformanceKeyboard|\.scopeShell|\.ruiPinnedScope)/;
const GEOMETRY_PROPERTY=/^(?:position|inset|top|right|bottom|left|width|min-width|max-width|height|min-height|max-height|margin(?:-(?:top|right|bottom|left))?|padding(?:-(?:top|right|bottom|left))?|transform|translate|display|grid(?:-[\w-]+)?|flex(?:-[\w-]+)?|place-[\w-]+|align-[\w-]+|justify-[\w-]+|overflow(?:-[xy])?|box-sizing|z-index|float|clear)$/i;

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

const violations=[];
for(const file of walk(ROOT)){
  if(path.extname(file)!==".css") continue;
  const base=path.basename(file);
  if(OWNER_FILES.has(base) || base.startsWith("control-") || base.startsWith("rack-ui-")) continue;
  const raw=fs.readFileSync(file,"utf8"),text=stripComments(raw);
  const rule=/([^{}]+)\{([^{}]*)\}/g;
  let m;
  while((m=rule.exec(text))){
    const selector=m[1].trim();
    if(!PROTECTED_SELECTOR.test(selector)) continue;
    const declarations=m[2].split(";");
    for(const decl of declarations){
      const colon=decl.indexOf(":");
      if(colon<0) continue;
      const prop=decl.slice(0,colon).trim();
      if(!GEOMETRY_PROPERTY.test(prop)) continue;
      violations.push({file:path.relative(process.cwd(),file),line:lineOf(text,m.index),selector,property:prop});
    }
  }
}

if(violations.length){
  console.error("Shared-control ownership audit FAILED. Modules may theme shared controls with variables/colors, but may not own shared control/prefab geometry.\n");
  for(const v of violations) console.error(`${v.file}:${v.line}  ${v.selector}  -> ${v.property}`);
  console.error(`\n${violations.length} geometry override(s) must be removed or moved into the shared control/prefab owner.`);
  process.exit(1);
}
console.log("Shared-control ownership audit passed: no module-specific geometry overrides of library controls/prefabs.");
