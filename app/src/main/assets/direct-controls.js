"use strict";
(()=>{
function convert(sel){if(!sel||sel.dataset.directified||sel.closest('.pcmTouchscreen'))return;sel.dataset.directified='1';const opts=[...sel.options];if(!opts.length)return;const bank=document.createElement('div');bank.className='choiceBank'+(opts.length>8?' scrollChoiceBank':'');function draw(){bank.innerHTML='';for(const o of opts){const b=document.createElement('button');b.type='button';b.className='choiceButton'+(String(sel.value)===String(o.value)?' active':'');b.textContent=o.textContent;b.onclick=()=>{sel.value=o.value;sel.dispatchEvent(new Event('change',{bubbles:true}));draw()};bank.appendChild(b)}}sel.style.display='none';sel.insertAdjacentElement('afterend',bank);draw();sel.addEventListener('change',draw)}
function scan(root=document){root.querySelectorAll?.('select').forEach(convert)}
new MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes)if(n.nodeType===1){if(n.matches?.('select'))convert(n);scan(n)}}).observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('DOMContentLoaded',()=>scan(),{once:true});setTimeout(()=>scan(),0);
})();
