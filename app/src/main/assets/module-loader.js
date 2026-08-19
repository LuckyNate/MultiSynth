"use strict";
(function(global){
  const MS=global.MultiSynth||{},I=MS.ModuleIds,X=MS.ModuleCompatibility;
  if(!I)throw new Error("ModuleIds must load before module-loader");
  for(const ident of Object.values(I.CATALOG)){
    if(X?.isRetired?.(ident.id))continue;
    document.write('<script src="'+ident.moduleScript+'"><\/script>');
  }
})(window);
