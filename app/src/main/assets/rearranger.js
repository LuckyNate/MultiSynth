"use strict";
(function(){
const q=new URLSearchParams(location.search),instance=q.get("instance"),P=parent.MultiSynth||{},E=P.NodeGraphEngine,R=window.MultiSynth?.ControlSurfaceRenderer,root=document.getElementById("controls");if(!instance||!E||!R||!root)return;
function bank(title){const s=document.createElement("section"),h=document.createElement("div"),g=document.createElement("div");s.className="ms-module-bank";h.className="ms-module-bank-title";h.textContent=title;g.className="ms-control-grid";s.append(h,g);root.appendChild(s);return g}
const host=bank("REARRANGER");R.mount(host,{id:"status",control:"screen",label:"ROUTING OFFLINE",meta:{visual:{variant:"screen"}}});const note=document.createElement("div");note.className="rrPatchEmpty";note.textContent="ARRANGER ROUTING IS DISABLED UNTIL THE STANDALONE ROUTING SYSTEM IS REBUILT.";host.appendChild(note);
})();
