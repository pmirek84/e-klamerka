import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FISH_SPECIES } from './game.js';

export function FishingModal({ game, onCatch, onClose, playSound }) {
  const [phase, setPhase] = useState('ready'); // ready, waiting, biting, reeling, caught, escaped
  const [progress, setProgress] = useState(30); // 0 to 100%
  const [cursorPos, setCursorPos] = useState(50); // 0 to 100%
  const [biteCountdown, setBiteCountdown] = useState(0);
  const [caughtFish, setCaughtFish] = useState(null);
  const [isRecord, setIsRecord] = useState(false);
  const biteTimerRef = useRef(null);
  const biteTimeoutRef = useRef(null);
  const reelAnimRef = useRef(null);

  // Cast the rod
  const startFishing = useCallback(() => {
    playSound?.('cast');
    setPhase('waiting');
    setProgress(55);
    setCursorPos(50);
    setCaughtFish(null);

    // Friendly wait for bite: 1.2 to 2.5 seconds
    const waitTime = 1200 + Math.random() * 1300;
    biteTimerRef.current = setTimeout(() => {
      playSound?.('bite');
      setPhase('biting');

      // Very generous 4.5 seconds reaction window to comfortably strike
      biteTimeoutRef.current = setTimeout(() => {
        setPhase('escaped');
        playSound?.('pop', 0.6);
      }, 4500);
    }, waitTime);
  }, [playSound]);

  // Hook strike when biting
  const strikeHook = useCallback(() => {
    if (phase !== 'biting') return;
    clearTimeout(biteTimeoutRef.current);
    playSound?.('pop', 1.3);
    setPhase('reeling');
  }, [phase, playSound]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeout(biteTimerRef.current);
      clearTimeout(biteTimeoutRef.current);
      cancelAnimationFrame(reelAnimRef.current);
    };
  }, []);

  // Reeling mini-game loop
  useEffect(() => {
    if (phase !== 'reeling') return;

    let dir = 1;
    let pos = 50;
    let currentProg = 65; // Friendly high start
    let lastTime = performance.now();

    const loop = (now) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      // Slow and predictable gentle oscillation
      pos += dir * (24 + Math.random() * 8) * dt;
      if (pos > 88) { pos = 88; dir = -1; }
      if (pos < 12) { pos = 12; dir = 1; }
      setCursorPos(pos);

      // Negligible decay, player never loses progress
      currentProg = Math.max(45, currentProg - 0.5 * dt);
      setProgress(currentProg);

      if (currentProg >= 100) {
        // CATCH SUCCESS!
        cancelAnimationFrame(reelAnimRef.current);

        // Weighted fish species
        const roll = Math.random();
        let sp = FISH_SPECIES[0];
        if (roll > 0.88) sp = FISH_SPECIES[3]; // Pike (Legendary)
        else if (roll > 0.65) sp = FISH_SPECIES[2]; // Trout (Rare)
        else if (roll > 0.35) sp = FISH_SPECIES[1]; // Carp
        else sp = FISH_SPECIES[0]; // Goldfish

        const len = Number((sp.minLen + Math.random() * (sp.maxLen - sp.minLen)).toFixed(1));
        const prevBest = game.fishRecords?.[sp.id] || 0;
        const record = len > prevBest;

        setCaughtFish({ species: sp, length: len });
        setIsRecord(record);
        setPhase('caught');
        playSound?.('fanfare');
        onCatch(sp, len);
        return;
      }

      reelAnimRef.current = requestAnimationFrame(loop);
    };

    reelAnimRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(reelAnimRef.current);
  }, [phase, game.fishRecords, onCatch, playSound]);

  // Pull / Reel button press
  const handleReelPulse = useCallback(() => {
    if (phase !== 'reeling') return;
    playSound?.('reel');

    // Huge 70% sweet spot between 15% and 85%
    const inZone = cursorPos >= 15 && cursorPos <= 85;
    setProgress(prev => {
      const next = inZone ? prev + 25 : prev + 12;
      return Math.min(100, next);
    });
  }, [phase, cursorPos, playSound]);

  // Keyboard shortcut (Space / Enter)
  useEffect(() => {
    const handleKey = (e) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        if (phase === 'ready' || phase === 'escaped') startFishing();
        else if (phase === 'biting') strikeHook();
        else if (phase === 'reeling') handleReelPulse();
        else if (phase === 'caught') startFishing();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [phase, startFishing, strikeHook, handleReelPulse]);

  return (
    <div className="veil" onPointerDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <section className="modal fishing-modal" role="dialog" aria-modal="true" aria-labelledby="fishing-title">
        <header>
          <div>
            <span className="eyebrow">LAZUROWE JEZIORO · ZŁOTA PRZYSTAŃ</span>
            <h2 id="fishing-title">Wędkowanie w czystych wodach</h2>
          </div>
          <button className="round" onClick={onClose} aria-label="Zamknij"><span aria-hidden="true">✕</span></button>
        </header>

        {/* FISHING STAGE CANVAS CONTAINER */}
        <div
          className="fishing-stage"
          onClick={() => {
            if (phase === 'biting') strikeHook();
            else if (phase === 'reeling') handleReelPulse();
          }}
          style={{ cursor: phase === 'biting' || phase === 'reeling' ? 'pointer' : 'default' }}
        >
          {/* Animated Water Ripples Background */}
          <div className="water-pond">
            <div className="water-wave wave-1" />
            <div className="water-wave wave-2" />
            
            {/* Lilies and bubbles */}
            <div className="water-lily lily-1">🪷</div>
            <div className="water-lily lily-2">🌿</div>

            {/* Bobber & Fish Animation */}
            {(phase === 'waiting' || phase === 'biting' || phase === 'reeling') && (
              <div className={`bobber-wrapper ${phase === 'biting' ? 'biting' : 'floating'}`}>
                <div className="fishing-line" />
                <div className="cork-bobber">
                  <span className="bobber-top" />
                  <span className="bobber-bottom" />
                </div>
                <div className="bobber-ripple" />
              </div>
            )}

            {/* Fish Shadow approaching */}
            {phase === 'waiting' && (
              <div className="fish-shadow">
                <span className="fish-silhouette">🐟</span>
              </div>
            )}

            {/* BITE ALERT BADGE */}
            {phase === 'biting' && (
              <div className="bite-alert bounce-pop" onClick={strikeHook}>
                <span className="bite-exclamation">❗ BRANIE! ❗</span>
                <span className="bite-prompt">ZACINAJ TERAZ!</span>
              </div>
            )}
          </div>

          {/* STATUS BANNER */}
          <div className="fishing-status-bar">
            {phase === 'ready' && (
              <p>Zarzuć haczyk do lazurowej wody i poczekaj na ruch spławika.</p>
            )}
            {phase === 'waiting' && (
              <p className="pulse-text">Czekasz cierpliwie... woda jest spokojna... 💧</p>
            )}
            {phase === 'biting' && (
              <p style={{ color: '#d94336', fontWeight: 800 }}>Spławik zanurkował! Zacinaj wędkę!</p>
            )}
            {phase === 'reeling' && (
              <p>Rybka na haczyku! Klikaj przycisk lub spację, by zwinąć kołowrotek!</p>
            )}
            {phase === 'escaped' && (
              <p style={{ color: '#c2593f' }}>Rybka zerwała się z haczyka! Nie zniechęcaj się, spróbuj ponownie.</p>
            )}
          </div>

          {/* REELING MINI-GAME CONTROLS */}
          {phase === 'reeling' && (
            <div className="reel-gauge-card">
              <div className="tension-track">
                {/* Wide 70% Target Zone */}
                <div className="tension-sweet-zone" style={{ left: '15%', width: '70%' }}>
                  <span>SZEROKA STREFA POŁOWU ✓</span>
                </div>
                {/* Moving Indicator */}
                <div className="tension-pointer" style={{ left: `${cursorPos}%` }}>
                  <span>🐟</span>
                </div>
              </div>

              {/* Catch Progress Bar */}
              <div className="catch-meter-wrapper">
                <div className="catch-meter-fill" style={{ width: `${progress}%` }} />
                <span className="catch-meter-label">Zwijanie żyłki: {Math.round(progress)}%</span>
              </div>

              <button className="primary reel-pulse-btn" onClick={handleReelPulse}>
                🎣 CIĄGNIJ RYBKĘ! (Spacja / Klik)
              </button>
            </div>
          )}

          {/* CAUGHT FISH SHOWCASE */}
          {phase === 'caught' && caughtFish && (
            <div className="caught-showcase bounce-pop">
              {isRecord && <div className="record-badge">🏆 NOWY REKORD! 🏆</div>}
              <div className="caught-avatar-frame">
                <span className="caught-icon">{caughtFish.species.icon}</span>
              </div>
              <h3 className="caught-title">{caughtFish.species.name}</h3>
              <div className="caught-tags">
                <span className="rarity-pill" style={{ background: caughtFish.species.rarityColor }}>
                  {caughtFish.species.rarity}
                </span>
                <span className="length-pill">
                  Długość: <strong>{caughtFish.length} cm</strong>
                </span>
                <span className="reward-pill">
                  Zapłata: <strong>+{caughtFish.species.coins} 🪙</strong>
                </span>
              </div>
              <p className="caught-desc">{caughtFish.species.desc}</p>
            </div>
          )}
        </div>

        {/* MODAL FOOTER BUTTONS */}
        <div className="modal-actions-bar" style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '16px' }}>
          {phase === 'ready' && (
            <button className="primary big-btn" onClick={startFishing}>
              🎣 Zarzuć wędkę (Spacja)
            </button>
          )}

          {phase === 'biting' && (
            <button className="primary big-btn strike-btn" onClick={strikeHook}>
              ⚡ ZACINAJ!
            </button>
          )}

          {phase === 'escaped' && (
            <button className="secondary big-btn" onClick={startFishing}>
              Spróbuj ponownie 🎣
            </button>
          )}

          {phase === 'caught' && (
            <>
              <button className="primary big-btn" onClick={startFishing}>
                Złów kolejną rybkę 🎣
              </button>
              <button className="secondary big-btn" onClick={onClose}>
                Wróć na brzeg
              </button>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
