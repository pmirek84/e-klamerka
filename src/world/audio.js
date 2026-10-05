// Procedural ambient audio (no asset files): birds by day, crickets at night,
// water near rivers, soft wind, footsteps and a happy chime on actions.
const MUTE_KEY = 'eklamerka-muted';

export function createAudio() {
  let ctx = null, master = null, waterGain = null, windGain = null, cricketGain = null, noiseBuf = null;
  let muted = localStorage.getItem(MUTE_KEY) === '1';
  let nextBird = 0, night = 0;

  function start() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = muted ? 0 : .7; master.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0); let last = 0;
    for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; last = (last + .02 * w) / 1.02; d[i] = last * 3.5; } // brown-ish noise
    const loop = (freq, type, q = .7) => {
      const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
      const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
      const g = ctx.createGain(); g.gain.value = 0; src.connect(f).connect(g).connect(master); src.start();
      return g;
    };
    waterGain = loop(900, 'bandpass', .5);
    windGain = loop(380, 'lowpass');
    // Crickets: amplitude-modulated high sine.
    const osc = ctx.createOscillator(); osc.frequency.value = 4400;
    const am = ctx.createOscillator(); am.frequency.value = 28; const amGain = ctx.createGain(); amGain.gain.value = .5;
    const chirpGate = ctx.createGain(); chirpGate.gain.value = .5;
    am.connect(amGain).connect(chirpGate.gain);
    cricketGain = ctx.createGain(); cricketGain.gain.value = 0;
    osc.connect(chirpGate).connect(cricketGain).connect(master); osc.start(); am.start();
  }

  function bird(t) {
    const notes = 2 + Math.floor(Math.random() * 4), base = 2400 + Math.random() * 1600;
    for (let i = 0; i < notes; i++) {
      const o = ctx.createOscillator(), g = ctx.createGain(), s = t + i * (.09 + Math.random() * .05);
      o.type = 'sine'; o.frequency.setValueAtTime(base * (1 + Math.random() * .2), s);
      o.frequency.exponentialRampToValueAtTime(base * (1.3 + Math.random() * .4), s + .07);
      g.gain.setValueAtTime(0, s); g.gain.linearRampToValueAtTime(.045, s + .015); g.gain.exponentialRampToValueAtTime(.0005, s + .09);
      o.connect(g).connect(master); o.start(s); o.stop(s + .1);
    }
  }

  function update({ night: n, water = 0, moving = false }) {
    if (!ctx) return;
    night = n;
    const t = ctx.currentTime;
    waterGain.gain.setTargetAtTime(Math.min(1, water) * .22, t, .4);
    windGain.gain.setTargetAtTime(.05 + (moving ? .01 : 0), t, .8);
    cricketGain.gain.setTargetAtTime(Math.max(0, night - .35) * .012, t, .8);
    if (t > nextBird) { if (night < .5) bird(t); nextBird = t + 1.2 + Math.random() * 4; }
  }

  function step(surface = 'grass') {
    if (!ctx || muted) return;
    const t = ctx.currentTime, src = ctx.createBufferSource(); src.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = surface === 'path' ? 1500 : surface === 'wood' ? 700 : 2600; f.Q.value = surface === 'wood' ? 4 : 1.2;
    const g = ctx.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(surface === 'wood' ? .35 : .18, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + .09);
    src.connect(f).connect(g).connect(master); src.start(t, Math.random() * 1.5, .12);
  }

  function chime() {
    if (!ctx || muted) return;
    const t = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((fq, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain(), s = t + i * .07;
      o.type = 'triangle'; o.frequency.value = fq;
      g.gain.setValueAtTime(0, s); g.gain.linearRampToValueAtTime(.09, s + .01); g.gain.exponentialRampToValueAtTime(.0005, s + .45);
      o.connect(g).connect(master); o.start(s); o.stop(s + .5);
    });
  }

  function setMuted(v) {
    muted = v; localStorage.setItem(MUTE_KEY, v ? '1' : '0');
    if (master) master.gain.setTargetAtTime(v ? 0 : .7, ctx.currentTime, .1);
  }

  function dispose() { ctx?.close(); ctx = null; }

  return { start, update, step, chime, setMuted, get muted() { return muted; }, dispose };
}
