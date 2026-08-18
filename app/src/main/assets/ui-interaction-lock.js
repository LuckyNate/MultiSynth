"use strict";
(function(global){
  const EDITABLE='input:not([type="button"]):not([type="range"]):not([type="checkbox"]):not([type="radio"]),textarea,[contenteditable="true"],[contenteditable="plaintext-only"]';
  const wiredFrames=new WeakSet();
  const observedDocs=new WeakSet();
  function isEditableTarget(t){return !!t?.closest?.(EDITABLE)}
  function install(doc){
    if(!doc||doc.documentElement?.dataset?.multiSynthInteractionLock)return;
    doc.documentElement.dataset.multiSynthInteractionLock='1';
    const style=doc.createElement('style');
    style.textContent=`
      html,body,body *{-webkit-user-select:none!important;user-select:none!important;-webkit-touch-callout:none!important}
      ${EDITABLE}{-webkit-user-select:text!important;user-select:text!important;-webkit-touch-callout:default!important}
      input[type="button"],input[type="range"],input[type="checkbox"],input[type="radio"],button,select,option{caret-color:transparent}
    `;
    (doc.head||doc.documentElement).appendChild(style);
    doc.addEventListener('selectstart',e=>{if(!isEditableTarget(e.target))e.preventDefault()},true);
    doc.addEventListener('contextmenu',e=>{if(!isEditableTarget(e.target))e.preventDefault()},true);
    const wireFrame=frame=>{
      if(wiredFrames.has(frame))return;
      wiredFrames.add(frame);
      const apply=()=>{try{install(frame.contentDocument)}catch(_){}};
      frame.addEventListener('load',apply);
      apply();
    };
    const wireFrames=root=>(root?.querySelectorAll?.('iframe')||[]).forEach(wireFrame);
    wireFrames(doc);
    if(!observedDocs.has(doc)){
      observedDocs.add(doc);
      new MutationObserver(records=>{
        for(const rec of records)for(const node of rec.addedNodes){
          if(node?.nodeType!==1)continue;
          if(node.tagName==='IFRAME')wireFrame(node);
          wireFrames(node);
        }
      }).observe(doc.documentElement,{childList:true,subtree:true});
    }
  }
  install(document);
  global.MultiSynthInteractionLock={install};
})(window);
