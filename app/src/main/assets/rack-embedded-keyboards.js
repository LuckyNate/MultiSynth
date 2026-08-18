"use strict";
(function(){
  const frame=document.getElementById("moduleEditorFrame");
  if(!frame)return;

  function restoreModuleKeyboards(){
    const doc=frame.contentDocument;
    if(!doc)return;
    doc.querySelectorAll('#keyboardShell,#keyboard,.keyboard,[data-standalone-keyboard]').forEach(el=>{
      if(el.style.display==="none")el.style.removeProperty("display");
    });
  }

  frame.addEventListener("load",()=>{
    restoreModuleKeyboards();
    requestAnimationFrame(restoreModuleKeyboards);
    setTimeout(restoreModuleKeyboards,0);
  });
})();
