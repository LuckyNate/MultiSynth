"use strict";
(function(){
function fmt(v){const n=Number(v)||0;return (n>0?"+":"")+n.toFixed(n%1?1:0)+" dB";}
for(const id of ["low","mid","high"]){const el=document.getElementById(id),out=document.getElementById(id+"Out");if(!el||!out)continue;const sync=()=>out.textContent=fmt(el.value);el.addEventListener("input",sync);sync();}
})();
