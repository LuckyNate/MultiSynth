"use strict";
(function(global){
const MS=global.MultiSynth||{},C=MS.ModuleContract,I=MS.ModuleIds,B=MS.ModuleBuilderDefinitions;if(!C||!I||!B)return;
const model=B.define({id:I.TEST_MODULE,model:"module-builder",version:1,package:{id:I.TEST_MODULE,version:1,behavior:{role:"control-library-specimen",stateOwnership:"none"}},faceplate:{livery:"test-module",primary:"#111",secondary:"#d8d8d8",tertiary:"#fff"},defaults:{},controls:[],sources:[],actions:[],nodes:{connections:[]}});
C.define({type:I.TEST_MODULE,version:"test-module-1",description:"SHARED CONTROL LIBRARY SPECIMEN",defaults:{},serialize:()=>({}),restore:()=>({}),moduleBuilder:model});
})(window);
