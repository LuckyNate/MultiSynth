import fs from "node:fs";
import path from "node:path";

const ROOT=path.resolve("app/src/main/assets");
const SHARED_CSS=new Set(["control-surface.css","control-performance-keyboard.css"]);
const FINISHED_MODULES=new Set(["ws","no-quarter","time-bandits","big-deal","big-mouth","control-freak","denzels-equalizer","echo-canyon","been-served","garage-band","live-wire","lowrider-lfo","master-of-levels","randrone","sample-library","sample-surgery","tail-gator","the-chopper"]);
const DELETED_LAYERS=["console-fit.css","device-controls.css","control-ribbon.css"];
const FORBIDDEN_RUNTIME=/\b(?:ModuleUI|rackKnob|deviceKnob|bmKnob|rdKnob|lrKnob|verticalRibbon(?:Control|Track|Thumb)|knobControl)\b/;
const RAW_HARDWARE=/<(?:input|select)\b[^>]*(?:type=["'](?:range|checkbox|radio)["'])?[^>]*>|<button\b/i;
const SHARED_ANATOMY=/(?:\.ms-(?:control(?:-[\w-]+)?|knob(?:-[\w-]+)?|dial(?:-[\w-]+)?|button(?:-[\w-]+)?|pad(?:-[\w-]+)?|fader(?:-[\w-]+)?|ribbon(?:-[\w-]+)?|switch(?:-[\w-]+)?|screen(?:-[\w-]+)?|xy(?:-[\w-]+)?))/;
const ANATOMY_GEOMETRY=/^(?:position|inset|top|right|bottom|left|width|min-width|max-width|height|min-height|max-height|display|grid(?:-[\w-]+)?|flex(?:-[\w-]+)?|place-[\w-]+|align-[\w-]+|justify-[\w-]+|transform|overflow(?:-[xy])?|box-sizing)$/i;

function walk(dir){const out=[];for(const ent of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,ent.name);if(ent.isDirectory())out.push(...walk(p));else out.push(p)}return out}
function rel(file){return path.relative(process.cwd(),file).replaceAll("\\","/")}
function stripComments(s){return s.replace(/\/\*[\s\S]*?\*\//g,"")}
function lineOf(text,index){return text.slice(0,index).split("\n").length}
function moduleStem(file){return path.basename(file,path.extname(file))}
const files=walk(ROOT),violations=[];

for(const file of files){
  const ext=path.extname(file).toLowerCase(),name=path.basename(file),text=fs.readFileSync(file,"utf8"),where=rel(file);
  for(const dead of DELETED_LAYERS)if(text.includes(dead))violations.push(`${where}: references deleted transitional stylesheet ${dead}`);
  const old=FORBIDDEN_RUNTIME.exec(text);if(old)violations.push(`${where}:${lineOf(text,old.index)} contains forbidden private/retired control token ${old[0]}`);
  if(ext===".html"&&FINISHED_MODULES.has(moduleStem(file))){
    if(!text.includes("control-surface.css"))violations.push(`${where}: finished module does not load control-surface.css`);
    const body=text.replace(/<script[\s\S]*?<\/script>/gi,"");
    const raw=RAW_HARDWARE.exec(body);if(raw)violations.push(`${where}:${lineOf(text,raw.index)} contains raw form/button hardware instead of shared controls`);
  }
  if(ext!==".css"||SHARED_CSS.has(name))continue;
  const css=stripComments(text),rule=/([^{}]+)\{([^{}]*)\}/g;let m;
  while((m=rule.exec(css))){
    const selector=m[1].trim();if(!SHARED_ANATOMY.test(selector))continue;
    for(const decl of m[2].split(";")){const at=decl.indexOf(":");if(at<0)continue;const prop=decl.slice(0,at).trim();if(ANATOMY_GEOMETRY.test(prop))violations.push(`${where}:${lineOf(css,m.index)} ${selector} owns shared-control geometry property ${prop}`)}
  }
}

if(violations.length){console.error("Shared control/CSS contract audit FAILED:\n");for(const v of violations)console.error("- "+v);console.error(`\n${violations.length} violation(s). Fix the shared owner or migrate the module; do not add a compatibility layer.`);process.exit(1)}
console.log("Shared control/CSS contract audit passed.");
