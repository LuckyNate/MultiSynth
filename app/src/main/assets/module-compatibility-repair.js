"use strict";
(function(global){
 const MS=global.MultiSynth=global.MultiSynth||{};
 try{MS.ModuleCompatibility?.registerBuilderPackages?.();MS.ModuleCompatibility?.repairSavedProject?.()}catch(e){console.error("Module compatibility startup repair",e)}
})(window);
