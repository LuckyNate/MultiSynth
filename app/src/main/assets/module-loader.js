"use strict";
(function(global){
  const I=global.MultiSynth?.ModuleIds;
  if(!I)throw new Error("ModuleIds must load before module-loader");
  for(const ident of Object.values(I.CATALOG)){
    document.write('<script src="'+ident.moduleScript+'"><\/script>');
  }
})(window);
