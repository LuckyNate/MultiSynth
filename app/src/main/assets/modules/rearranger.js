"use strict";
(function(global){
const MS=global.MultiSynth||{},C=MS.ModuleContract,I=MS.ModuleIds,B=MS.ModuleBuilderDefinitions;if(!C||!I||!B)throw new Error("Rearranger requires ModuleContract, ModuleIds and ModuleBuilderDefinitions");
const model=B.define({id:I.REARRANGER,model:"module-builder",version:9,package:{id:I.REARRANGER,version:9,behavior:{role:"inert-shell",stateOwnership:"none"}},faceplate:{livery:"violet-arranger",primary:"#190d24",secondary:"#b75cff",tertiary:"#f2ddff"},defaults:{},controls:[],sources:[],actions:[],nodes:{connections:[]}});
C.define({type:I.REARRANGER,version:"module-builder-9",description:"INERT SHELL · REDESIGN PENDING",defaults:{},serialize:()=>({}),restore:()=>({}),moduleBuilder:model});
})(window);
