"use strict";
const MAX_VOICES=12,TOUCH_VELOCITY=127,STORAGE_KEY="NoQuarter.PersistentState.v1",TAU=Math.PI*2;
const macroState={bell:55,bark:45,noise:20,water:55,current:30,haunt:45,darkness:35};
const macroDefinitions=[["bell","BELL"],["bark","BARK"],["noise","NOISE"],["water","WATER"],["current","CURRENT"],["haunt","HAUNT"],["darkness","DARKNESS"]];
const envelopeState={attack:.002,decay:1.4,sustain:.32,release:.85};
let audioCtx=null,masterGain=null,analyser=null,keepAlive=null,keepAliveGain=null,instrumentBus=null,dryGain=null,wetGain=null,phaserLfo=null,phaserStages=[],phaserDepths=[],hauntDelay=null,hauntFeedback=null,hauntReturn=null,hammerBuffer=null,tineWave=null;
const voices=new Map(),touchNotes=new Map(),computerNotes=new Map(),barkCurveCache=new Map();
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function midiToFrequency(n){return 440*Math.pow(2,(n-69)/12);}
function saveState(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify({macros:macroState,envelope:envelopeState,master:Number(document.getElementById("master")?.value||.35)}));}catch(_){}}
function loadState(){try{const s=JSON.parse(localStorage.getItem(STORAGE_KEY)||"null");if(!s)return;if(s.macros)macroDefinitions.forEach(e=>{const v=Number(s.macros[e[0]]);if(Number.isFinite(v))macroState[e[0]]=Math.round(clamp(v,0,100));});if(s.envelope){envelopeState.attack=clamp(Number(s.envelope.attack)||.002,.001,2);envelopeState.decay=clamp(Number(s.envelope.decay)||.001,.001,2);envelopeState.sustain=clamp(Number(s.envelope.sustain)||0,0,1);envelopeState.release=clamp(Number(s.envelope.release)||.001,.001,3);}if(Number.isFinite(Number(s.master)))document.getElementById("master").value=String(clamp(Number(s.master),0,1));}catch(_){}}
function makeHammerBuffer(){const n=Math.max(64,Math.round(audioCtx.sampleRate*.045)),b=audioCtx.createBuffer(1,n,audioCtx.sampleRate),d=b.getChannelData(0);let s=0x4e4f5155;for(let i=0;i<n;i++){s^=s<<13;s^=s>>>17;s^=s<<5;d[i]=((s>>>0)/2147483648-1)*Math.pow(1-i/n,5);}return b;}
function makeTineWave(){const r=new Float32Array(10),i=new Float32Array(10);i[1]=.55;i[2]=1;i[3]=.34;i[4]=.18;i[6]=.10;i[9]=.05;return audioCtx.createPeriodicWave(r,i,{disableNormalization:false});}
function makeBarkCurve(d){const k=Math.round(d*10);if(barkCurveCache.has(k))return barkCurveCache.get(k);const n=2048,c=new Float32Array(n),s=Math.max(1,k/10),z=Math.tanh(s);for(let i=0;i<n;i++){const x=i/(n-1)*2-1;c[i]=Math.tanh(x*s)/z;}barkCurveCache.set(k,c);return c;}
function initializeEffects(){instrumentBus=audioCtx.createGain();dryGain=audioCtx.createGain();wetGain=audioCtx.createGain();instrumentBus.connect(dryGain);dryGain.connect(masterGain);let signal=instrumentBus;phaserStages=[];phaserDepths=[];[260,520,1040,2080].forEach(base=>{const stage=audioCtx.createBiquadFilter(),depth=audioCtx.createGain();stage.type="allpass";stage.frequency.value=base;stage.Q.value=1;depth.gain.value=0;phaserLfo.connect(depth);depth.connect(stage.frequency);signal.connect(stage);signal=stage;phaserStages.push(stage);phaserDepths.push({gain:depth,base});});signal.connect(wetGain);wetGain.connect(masterGain);hauntDelay=audioCtx.createDelay(1);hauntDelay.delayTime.value=.19;hauntFeedback=audioCtx.createGain();hauntReturn=audioCtx.createGain();wetGain.connect(hauntDelay);hauntDelay.connect(hauntFeedback);hauntFeedback.connect(hauntDelay);hauntDelay.connect(hauntReturn);hauntReturn.connect(masterGain);updateEffects();}
function updateEffects(){if(!audioCtx||!dryGain)return;const now=audioCtx.currentTime,w=macroState.water/100,h=macroState.haunt/100;dryGain.gain.setTargetAtTime(1-w*.22,now,.02);wetGain.gain.setTargetAtTime(w*.78,now,.02);phaserLfo.frequency.setTargetAtTime(.04+Math.pow(macroState.current/100,2)*1.8,now,.03);phaserDepths.forEach(x=>x.gain.gain.setTargetAtTime(x.base*w*.72,now,.03));phaserStages.forEach(x=>x.Q.setTargetAtTime(.3+h*7,now,.03));hauntFeedback.gain.setTargetAtTime(h*.68,now,.03);hauntReturn.gain.setTargetAtTime(h*.52,now,.03);hauntDelay.delayTime.setTargetAtTime(.12+h*.19,now,.03);}
function ensureAudio(){if(!audioCtx){const A=window.AudioContext||window.webkitAudioContext;if(!A)return false;audioCtx=new A({latencyHint:"interactive"});masterGain=audioCtx.createGain();masterGain.gain.value=Number(document.getElementById("master")?.value||.35);analyser=audioCtx.createAnalyser();analyser.fftSize=2048;analyser.smoothingTimeConstant=0;masterGain.connect(analyser);analyser.connect(audioCtx.destination);phaserLfo=audioCtx.createOscillator();phaserLfo.type="sine";initializeEffects();phaserLfo.start();hammerBuffer=makeHammerBuffer();tineWave=makeTineWave();keepAlive=audioCtx.createOscillator();keepAliveGain=audioCtx.createGain();keepAlive.frequency.value=20;keepAliveGain.gain.value=.0000001;keepAlive.connect(keepAliveGain);keepAliveGain.connect(masterGain);keepAlive.start();document.getElementById("status").textContent="AUDIO "+Math.round(audioCtx.sampleRate/1000)+"K";}if(audioCtx.state==="suspended")audioCtx.resume().catch(()=>{});return true;}
function warmAudioEngine(){ensureAudio();}
class NoQuarterVoice{
constructor(note,velocity,key){this.note=note;this.key=key;this.frequency=midiToFrequency(note);this.velocity=clamp(Number(velocity)/127,.001,1);this.releasing=false;this.stopped=false;this.body=audioCtx.createOscillator();this.body.type="sine";this.body.frequency.value=this.frequency;this.tine=audioCtx.createOscillator();this.tine.frequency.value=this.frequency;this.tine.setPeriodicWave(tineWave);this.bodyGain=audioCtx.createGain();this.tineGain=audioCtx.createGain();this.shaper=audioCtx.createWaveShaper();this.shaper.oversample="4x";this.toneFilter=audioCtx.createBiquadFilter();this.toneFilter.type="lowpass";this.voiceGain=audioCtx.createGain();this.voiceGain.gain.value=0;this.body.connect(this.bodyGain);this.tine.connect(this.tineGain);this.bodyGain.connect(this.shaper);this.tineGain.connect(this.shaper);this.shaper.connect(this.toneFilter);this.toneFilter.connect(this.voiceGain);this.voiceGain.connect(instrumentBus);this.update();const now=audioCtx.currentTime,a=Math.max(.001,envelopeState.attack),d=Math.max(.001,envelopeState.decay);this.voiceGain.gain.setValueAtTime(0,now);this.voiceGain.gain.linearRampToValueAtTime(this.velocity,now+a);this.voiceGain.gain.exponentialRampToValueAtTime(Math.max(.0001,this.velocity*envelopeState.sustain),now+a+d);if(macroState.noise>0&&hammerBuffer){const hammer=audioCtx.createBufferSource(),g=audioCtx.createGain();hammer.buffer=hammerBuffer;hammer.playbackRate.value=clamp(this.frequency/220,.65,2.4);g.gain.value=macroState.noise/100*Math.pow(this.velocity,2)*.42;hammer.connect(g);g.connect(this.toneFilter);hammer.start(now);}this.body.start(now);this.tine.start(now);}
update(){if(!audioCtx||this.stopped)return;const now=audioCtx.currentTime,b=macroState.bell/100;this.bodyGain.gain.setTargetAtTime(.82-b*.24,now,.006);this.tineGain.gain.setTargetAtTime((.04+b*.72)*(.18+Math.pow(this.velocity,1.45)*.82),now,.006);this.shaper.curve=makeBarkCurve(1+macroState.bark/100*Math.pow(this.velocity,1.7)*8);const dark=macroState.darkness/100;this.toneFilter.frequency.setTargetAtTime(650+Math.pow(1-dark,2)*14500,now,.012);this.toneFilter.Q.setTargetAtTime(.3+b*1.4,now,.012);}
release(){if(this.releasing||this.stopped||!audioCtx)return;this.releasing=true;const now=audioCtx.currentTime,r=Math.max(.005,envelopeState.release),g=this.voiceGain.gain;if(g.cancelAndHoldAtTime)g.cancelAndHoldAtTime(now);else{g.cancelScheduledValues(now);g.setValueAtTime(Math.max(.0001,g.value),now);}g.exponentialRampToValueAtTime(.0001,now+r);this.stopped=true;try{this.body.stop(now+r+.06);this.tine.stop(now+r+.06);}catch(_){}setTimeout(()=>{try{this.voiceGain.disconnect();}catch(_){}},(r+.12)*1000);}
kill(){if(this.stopped||!audioCtx)return;this.stopped=true;try{this.body.stop(audioCtx.currentTime);this.tine.stop(audioCtx.currentTime);}catch(_){}try{this.voiceGain.disconnect();}catch(_){}}
}
function noteOn(note, velocity = TOUCH_VELOCITY, _overrideState = null, voiceKey = null) {
    if (!ensureAudio() || !Number.isFinite(note = Number(note))) return;
    const key = voiceKey || `note:${note}`;
    if (voices.has(key)) {
        voices.get(key).kill();
        voices.delete(key);
    }
    if (voices.size >= MAX_VOICES) {
        const oldestKey = voices.keys().next().value;
        voices.get(oldestKey)?.kill();
        voices.delete(oldestKey);
    }
    voices.set(key, new NoQuarterVoice(note, velocity, key));
    setVisibleKey(note, true);
}

function noteOffByKey(key) {
    const voice = voices.get(key);
    if (!voice) return;
    voice.release();
    voices.delete(key);
    refreshVisibleKey(voice.note);
}

function panicAll() {
    voices.forEach(voice => voice.kill());
    voices.clear();
    touchNotes.clear();
    computerNotes.clear();
    document.querySelectorAll(".key.down").forEach(key => key.classList.remove("down"));
    document.querySelectorAll(".knob.active").forEach(knob => knob.classList.remove("active"));
}



function updateAllVoices(){voices.forEach(v=>v.update());updateEffects();}
function initializeMacros(){const c=document.getElementById("macros");c.innerHTML="";macroDefinitions.forEach(e=>{const box=document.createElement("div"),label=document.createElement("label"),knob=document.createElement("div"),out=document.createElement("output");box.className="macroControl";label.textContent=e[1];knob.className="knob";knob.setAttribute("role","slider");box.append(label,knob,out);c.appendChild(box);initializeMacroKnob(e[0],knob,out);});}
function initializeMacroKnob(name,knob,out){let value=macroState[name],dragging=false,pointerId=null,startY=0,startValue=value,lastTap=0;function apply(next){value=Math.round(clamp(next,0,100));macroState[name]=value;knob.style.setProperty("--rotation",(-135+value*2.7)+"deg");knob.setAttribute("aria-valuemin","0");knob.setAttribute("aria-valuemax","100");knob.setAttribute("aria-valuenow",String(value));out.textContent=value+"%";updateAllVoices();saveState();}knob.addEventListener("pointerdown",e=>{e.preventDefault();e.stopPropagation();ensureAudio();const now=performance.now();if(now-lastTap<320){apply(50);lastTap=0;return;}lastTap=now;dragging=true;pointerId=e.pointerId;startY=e.clientY;startValue=value;knob.classList.add("active");try{knob.setPointerCapture(pointerId);}catch(_){}});knob.addEventListener("pointermove",e=>{if(!dragging||e.pointerId!==pointerId)return;e.preventDefault();apply(startValue+(startY-e.clientY)*100/180);});function end(e){if(!dragging||e.pointerId!==pointerId)return;dragging=false;pointerId=null;knob.classList.remove("active");}knob.addEventListener("pointerup",end);knob.addEventListener("pointercancel",end);knob.addEventListener("lostpointercapture",end);apply(value);}
function initializeGlobalControls() {
    document.getElementById("attack").value = String(envelopeState.attack);
    document.getElementById("decay").value = String(envelopeState.decay);
    document.getElementById("sustain").value = String(envelopeState.sustain);
    document.getElementById("release").value = String(envelopeState.release);
    bindSlider("attack", value => { envelopeState.attack = value; return timeLabel(value); });
    bindSlider("decay", value => { envelopeState.decay = value; return timeLabel(value); });
    bindSlider("sustain", value => { envelopeState.sustain = value; return `${Math.round(value * 100)}%`; });
    bindSlider("release", value => { envelopeState.release = value; return timeLabel(value); });
    bindSlider("master", value => {
        if (masterGain && audioCtx) masterGain.gain.setTargetAtTime(value, audioCtx.currentTime, .01);
        return `${Math.round(value * 100)}%`;
    });
    document.getElementById("panic").addEventListener("click", panicAll);
}

function bindSlider(id, handler) {
    const slider = document.getElementById(id);
    const output = document.getElementById(`${id}-value`);
    function update() {
        output.textContent = handler(Number(slider.value));
        saveState();
    }
    slider.addEventListener("input", update);
    update();
}

function timeLabel(seconds) {
    return seconds < 1 ? `${Math.round(seconds * 1000)} ms` : `${seconds.toFixed(2)} s`;
}

function buildKeyboard() {
    const keyboard = document.getElementById("keyboard");
    keyboard.innerHTML = "";
    const startNote = 48;
    const endNote = 72;
    const blackClasses = new Set([1, 3, 6, 8, 10]);
    const whiteCount = Array.from({ length: endNote - startNote + 1 }, (_, i) => startNote + i)
        .filter(note => !blackClasses.has(note % 12)).length;
    const whiteWidth = 100 / whiteCount;
    let whiteIndex = 0;

    for (let note = startNote; note <= endNote; note++) {
        const black = blackClasses.has(note % 12);
        const key = document.createElement("div");
        key.className = `key ${black ? "black" : "white"}`;
        key.dataset.note = String(note);
        if (black) {
            const width = whiteWidth * .64;
            key.style.width = `${width}%`;
            key.style.left = `${whiteIndex * whiteWidth - width / 2}%`;
        } else {
            key.style.width = `${whiteWidth}%`;
            key.style.left = `${whiteIndex * whiteWidth}%`;
            whiteIndex++;
        }

        key.addEventListener("pointerdown", event => {
            event.preventDefault();
            event.stopPropagation();
            if (touchNotes.has(event.pointerId)) return;
            const voiceKey = `touch:${event.pointerId}`;
            touchNotes.set(event.pointerId, { note, voiceKey });
            try { key.setPointerCapture(event.pointerId); } catch (_) {}
            noteOn(note, TOUCH_VELOCITY, null, voiceKey);
        });

        function release(event) {
            const held = touchNotes.get(event.pointerId);
            if (!held) return;
            touchNotes.delete(event.pointerId);
            noteOffByKey(held.voiceKey);
        }

        key.addEventListener("pointerup", release);
        key.addEventListener("pointercancel", release);
        key.addEventListener("lostpointercapture", release);
        keyboard.appendChild(key);
    }
}

function setVisibleKey(note, down) {
    document.querySelectorAll(`.key[data-note="${note}"]`).forEach(key => key.classList.toggle("down", down));
}

function noteStillHeld(note) {
    for (const held of touchNotes.values()) if (held.note === note) return true;
    for (const held of computerNotes.values()) if (held.note === note) return true;
    return false;
}

function refreshVisibleKey(note) {
    setVisibleKey(note, noteStillHeld(note));
}

const computerKeyMap = {
    a: 48, w: 49, s: 50, e: 51, d: 52, f: 53, t: 54, g: 55,
    y: 56, h: 57, u: 58, j: 59, k: 60, o: 61, l: 62, p: 63, ";": 64
};

function setupComputerKeyboard() {
    window.addEventListener("keydown", event => {
        if (event.repeat) return;
        const key = event.key.toLowerCase();
        const note = computerKeyMap[key];
        if (note === undefined || computerNotes.has(key)) return;
        event.preventDefault();
        const voiceKey = `pc:${key}`;
        computerNotes.set(key, { note, voiceKey });
        noteOn(note, TOUCH_VELOCITY, null, voiceKey);
    });
    window.addEventListener("keyup", event => {
        const key = event.key.toLowerCase();
        const held = computerNotes.get(key);
        if (!held) return;
        event.preventDefault();
        computerNotes.delete(key);
        noteOffByKey(held.voiceKey);
    });
}

function initializeScope() {
    const canvas = document.getElementById("scope");
    const context = canvas.getContext("2d");
    let data = null;

    function resize() {
        const ratio = Math.max(1, window.devicePixelRatio || 1);
        const rectangle = canvas.getBoundingClientRect();
        canvas.width = Math.floor(rectangle.width * ratio);
        canvas.height = Math.floor(rectangle.height * ratio);
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
    }

    function draw() {
        requestAnimationFrame(draw);
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        context.clearRect(0, 0, width, height);
        context.beginPath();
        context.strokeStyle = analyser ? "#8cabff" : "#182f78";
        context.lineWidth = analyser ? 1.6 : 1;
        context.shadowColor = "#8cabff";
        context.shadowBlur = analyser ? 8 : 0;
        if (!analyser) {
            context.moveTo(0, height / 2);
            context.lineTo(width, height / 2);
        } else {
            if (!data || data.length !== analyser.fftSize) data = new Float32Array(analyser.fftSize);
            analyser.getFloatTimeDomainData(data);
            const visibleSamples = Math.min(512, data.length);
            let start = 0;
            for (let index = 1; index < data.length - visibleSamples; index++) {
                if (data[index - 1] <= 0 && data[index] > 0) {
                    start = index;
                    break;
                }
            }
            let peak = .0001;
            for (let index = 0; index < visibleSamples; index++) {
                peak = Math.max(peak, Math.abs(data[start + index]));
            }
            const displayGain = clamp(.42 / peak, 1, 14);
            for (let index = 0; index < visibleSamples; index++) {
                const x = index / (visibleSamples - 1) * width;
                const y = height / 2 - data[start + index] * displayGain * height / 2;
                index ? context.lineTo(x, y) : context.moveTo(x, y);
            }
        }
        context.stroke();
        context.shadowBlur = 0;
    }

    window.addEventListener("resize", resize);
    resize();
    draw();
}

function shutdownAudioEngine() {
    panicAll();
    if (audioCtx) {
        const closing = audioCtx;
        audioCtx = null;
        masterGain = null;
        analyser = null;
        keepAlive = null;
        keepAliveGain = null;
        
        closing.close().catch(() => {});
    }
}

function bootNoQuarter() {
    buildKeyboard();
    loadState();
    initializeMacros();
    initializeGlobalControls();
    setupComputerKeyboard();
    initializeScope();
    warmAudioEngine();
    console.log("No Quarter ready: velocity-responsive electric piano enabled.");
}

window.addEventListener("blur", panicAll);
window.addEventListener("pagehide", () => { saveState(); shutdownAudioEngine(); });
document.addEventListener("visibilitychange", () => { if (document.hidden) panicAll(); });
document.addEventListener("touchmove", event => {
    const target = event.target instanceof Element ? event.target : null;
    if ((target?.closest(".knob") || target?.closest("#keyboard")) && event.cancelable) event.preventDefault();
}, { passive: false });

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootNoQuarter, { once: true });
} else bootNoQuarter();
