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

  function pop(pitch = 1) {
    if (!ctx || muted) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(650 * pitch, t);
    o.frequency.exponentialRampToValueAtTime(220 * pitch, t + .07);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(.12, t + .008);
    g.gain.exponentialRampToValueAtTime(.0005, t + .08);
    o.connect(g).connect(master);
    o.start(t); o.stop(t + .09);
  }

  function harvest() {
    if (!ctx || muted) return;
    const t = ctx.currentTime;
    // Cheerful ascending 3-note marimba chord (G4, B4, D5, G5)
    [392.00, 493.88, 587.33, 783.99].forEach((fq, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain(), s = t + i * .055;
      o.type = 'triangle';
      o.frequency.setValueAtTime(fq, s);
      g.gain.setValueAtTime(0, s);
      g.gain.linearRampToValueAtTime(.11, s + .008);
      g.gain.exponentialRampToValueAtTime(.0004, s + .28);
      o.connect(g).connect(master);
      o.start(s); o.stop(s + .3);
    });
  }

  function water() {
    if (!ctx || muted) return;
    const t = ctx.currentTime;
    // Bubbly water droplet frequency drops
    [740, 880].forEach((fq, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain(), s = t + i * .08;
      o.type = 'sine';
      o.frequency.setValueAtTime(fq, s);
      o.frequency.exponentialRampToValueAtTime(fq * .45, s + .09);
      g.gain.setValueAtTime(0, s);
      g.gain.linearRampToValueAtTime(.13, s + .01);
      g.gain.exponentialRampToValueAtTime(.0005, s + .12);
      o.connect(g).connect(master);
      o.start(s); o.stop(s + .13);
    });
  }

  function coin() {
    if (!ctx || muted) return;
    const t = ctx.currentTime;
    // Dual bright metallic coin ring
    [1760, 2637].forEach((fq, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain(), s = t + i * .06;
      o.type = 'sine';
      o.frequency.setValueAtTime(fq, s);
      g.gain.setValueAtTime(0, s);
      g.gain.linearRampToValueAtTime(.08, s + .006);
      g.gain.exponentialRampToValueAtTime(.0003, s + .32);
      o.connect(g).connect(master);
      o.start(s); o.stop(s + .35);
    });
  }

  function squeak() {
    if (!ctx || muted) return;
    const t = ctx.currentTime;
    // Cute bunny squeak / chirpy inflection
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(1250, t);
    o.frequency.exponentialRampToValueAtTime(1920, t + .08);
    o.frequency.exponentialRampToValueAtTime(1600, t + .14);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(.07, t + .02);
    g.gain.exponentialRampToValueAtTime(.0004, t + .18);
    o.connect(g).connect(master);
    o.start(t); o.stop(t + .2);
  }

  function chop() {
    if (!ctx || muted) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(220, t);
    o.frequency.exponentialRampToValueAtTime(80, t + .08);
    g.gain.setValueAtTime(.18, t);
    g.gain.exponentialRampToValueAtTime(.0005, t + .1);
    o.connect(g).connect(master);
    o.start(t); o.stop(t + .11);
    // Subtle wood snap click
    const src = ctx.createBufferSource(); src.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1400; f.Q.value = 2.5;
    const ng = ctx.createGain(); ng.gain.setValueAtTime(.15, t); ng.gain.exponentialRampToValueAtTime(.001, t + .06);
    src.connect(f).connect(ng).connect(master); src.start(t, 0, .07);
  }

  function mine() {
    if (!ctx || muted) return;
    const t = ctx.currentTime;
    // Crystal chime ping
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(1864, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(.09, t + .006);
    g.gain.exponentialRampToValueAtTime(.0002, t + .45);
    o.connect(g).connect(master);
    o.start(t); o.stop(t + .48);
  }

  function fanfare() {
    if (!ctx || muted) return;
    const t = ctx.currentTime;
    // Triumphant chord fanfare
    [523.25, 659.25, 783.99, 1046.50].forEach((fq, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain(), s = t + i * .09;
      o.type = 'triangle';
      o.frequency.setValueAtTime(fq, s);
      g.gain.setValueAtTime(0, s);
      g.gain.linearRampToValueAtTime(.11, s + .012);
      g.gain.exponentialRampToValueAtTime(.0004, s + .65);
      o.connect(g).connect(master);
      o.start(s); o.stop(s + .7);
    });
  }

  function cast() {
    if (!ctx || muted) return;
    const t = ctx.currentTime;
    // Whoosh
    const src = ctx.createBufferSource(); src.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 800; f.Q.value = 2;
    const g = ctx.createGain(); g.gain.setValueAtTime(.08, t); g.gain.exponentialRampToValueAtTime(.001, t + .2);
    src.connect(f).connect(g).connect(master); src.start(t, 0, .22);
    // Soft water landing splash
    setTimeout(() => water(), 180);
  }

  function bite() {
    if (!ctx || muted) return;
    const t = ctx.currentTime;
    // Exclamation alert ping
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(1174, t);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.15, t + .01); g.gain.exponentialRampToValueAtTime(.001, t + .25);
    o.connect(g).connect(master); o.start(t); o.stop(t + .26);
    // Sudden splash
    const o2 = ctx.createOscillator(), g2 = ctx.createGain();
    o2.type = 'triangle'; o2.frequency.setValueAtTime(440, t); o2.frequency.exponentialRampToValueAtTime(140, t + .12);
    g2.gain.setValueAtTime(.12, t); g2.gain.exponentialRampToValueAtTime(.001, t + .14);
    o2.connect(g2).connect(master); o2.start(t); o2.stop(t + .15);
  }

  function reel() {
    if (!ctx || muted) return;
    const t = ctx.currentTime;
    // Rapid cute wooden ratchet click
    [580, 720].forEach((fq, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain(), s = t + i * .025;
      o.type = 'triangle'; o.frequency.setValueAtTime(fq, s);
      g.gain.setValueAtTime(.08, s); g.gain.exponentialRampToValueAtTime(.0005, s + .03);
      o.connect(g).connect(master); o.start(s); o.stop(s + .035);
    });
  }

  function sizzle() {
    if (!ctx || muted) return;
    const t = ctx.currentTime;
    // Sizzling pan / pot bubbles
    const src = ctx.createBufferSource(); src.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2400; f.Q.value = 1.8;
    const g = ctx.createGain(); g.gain.setValueAtTime(.001, t); g.gain.linearRampToValueAtTime(.12, t + .05); g.gain.exponentialRampToValueAtTime(.0005, t + .5);
    src.connect(f).connect(g).connect(master); src.start(t, 0, .55);
    // Little boiling pops
    [620, 840, 760].forEach((fq, i) => {
      const o = ctx.createOscillator(), og = ctx.createGain(), s = t + .08 + i * .09;
      o.type = 'sine'; o.frequency.setValueAtTime(fq, s); o.frequency.exponentialRampToValueAtTime(fq * .6, s + .05);
      og.gain.setValueAtTime(.06, s); og.gain.exponentialRampToValueAtTime(.0005, s + .06);
      o.connect(og).connect(master); o.start(s); o.stop(s + .07);
    });
  }

  function meow() {
    if (!ctx || muted) return;
    const t = ctx.currentTime;
    // Cute kitty meow / chirp
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(740, t);
    o.frequency.exponentialRampToValueAtTime(1080, t + .12);
    o.frequency.exponentialRampToValueAtTime(860, t + .28);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(.11, t + .03);
    g.gain.exponentialRampToValueAtTime(.0005, t + .3);
    o.connect(g).connect(master);
    o.start(t); o.stop(t + .32);
  }

  function setMuted(v) {
    muted = v; localStorage.setItem(MUTE_KEY, v ? '1' : '0');
    if (master) master.gain.setTargetAtTime(v ? 0 : .7, ctx.currentTime, .1);
  }

  function dispose() { ctx?.close(); ctx = null; }

  return {
    start,
    update,
    step,
    chime,
    pop,
    harvest,
    water,
    coin,
    squeak,
    chop,
    mine,
    fanfare,
    cast,
    bite,
    reel,
    sizzle,
    meow,
    setMuted,
    get muted() { return muted; },
    dispose
  };
}
