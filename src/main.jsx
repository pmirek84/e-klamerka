import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createWorld } from './world/scene.js';
import { loadGame, SAVE_KEY, transact, PLACES, actionFor, maxBabies, OWL_RIDDLES } from './game.js';
import { Icon } from './icons.jsx';
import './style.css';
import { WorldMap } from './WorldMap.jsx';
import { REGIONS, visiblePlace } from './world/regions.js';

const resourceNames = { wood: 'drewno', stone: 'kamień', carrots: 'marchewki', apples: 'jabłka', coins: 'monety', seeds: 'nasionka', crystals: 'kryształy' };
const resourceIcons = { wood: 'wood', stone: 'stone', carrots: 'carrot', apples: 'apple', coins: 'coins', seeds: 'seeds', crystals: 'crystal', helper: 'helper', stall: 'stall' };

function Resources({ state, all = false }) {
  const keys = all
    ? ['wood', 'stone', 'carrots', 'apples', 'coins', 'seeds', 'crystals']
    : ['wood', 'stone', 'carrots', ...(state.apples > 0 || state.orchardLevel > 0 ? ['apples'] : []), 'coins', ...(state.world?.quarry || state.crystals ? ['crystals'] : [])];

  return (
    <div className="resources" aria-label="Zasoby">
      {keys.map(k => (
        <span className={`resource ${k}`} key={k} title={resourceNames[k]}>
          <Icon name={resourceIcons[k]} size={22} />
          <b data-resource={k}>{state[k]}</b>
          <span className="sr-only"> {resourceNames[k]}</span>
        </span>
      ))}
    </div>
  );
}

function Cost({ cost, state }) {
  return cost && (
    <span className="cost">
      {Object.entries(cost).map(([k, n]) => (
        <span className={(state[k] || 0) < n ? 'missing' : ''} key={k}>
          <Icon name={resourceIcons[k] || 'leaf'} size={18} />
          {n}
        </span>
      ))}
    </span>
  );
}

function Modal({ title, subtitle, children, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const prior = document.activeElement;
    ref.current?.querySelector('button,input')?.focus();
    const handler = e => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab') {
        const items = [...ref.current.querySelectorAll('button:not(:disabled),input')];
        const first = items[0], last = items.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => {
      document.removeEventListener('keydown', handler);
      prior?.focus();
    };
  }, [onClose]);

  return (
    <div className="veil" onPointerDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <section ref={ref} className="modal" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        <header>
          <div>
            <span className="eyebrow">{subtitle}</span>
            <h2 id="dialog-title">{title}</h2>
          </div>
          <button className="round" onClick={onClose} aria-label="Zamknij"><Icon name="close" /></button>
        </header>
        {children}
      </section>
    </div>
  );
}

function App() {
  const [game, setGame] = useState(loadGame);
  const gameRef = useRef(game);
  const worldRef = useRef(null);
  const hostRef = useRef(null);
  const actionRef = useRef(() => {});
  const [frame, setFrame] = useState({ near: null, moving: false, busy: false, labels: {} });
  const [selected, setSelected] = useState(null);
  const [modal, setModal] = useState(null);
  const [notice, setNotice] = useState(null);
  const [shopMessage, setShopMessage] = useState('');
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now());
  const [name, setName] = useState(game.name);
  const [avatar, setAvatar] = useState(game.avatar);
  const [storageWarning, setStorageWarning] = useState(false);
  const toastTimer = useRef();
  const tickRef = useRef();
  const visitRef = useRef(() => {});

  const say = useCallback((message, ok = true) => {
    if (!message) return;
    setNotice({ message, ok });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setNotice(null), 3800);
  }, []);

  function commit(next) {
    gameRef.current = next;
    setGame(next);
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(next));
    } catch {
      setStorageWarning(true);
    }
    worldRef.current?.setGame(next);
  }

  const perform = useCallback((action) => {
    const result = transact(gameRef.current, action);
    if (result.ok) commit(result.state);
    if (action.startsWith('buy') || action.startsWith('sell')) setShopMessage(result.message);
    say(result.message, result.ok);
    return result;
  }, [say]);

  useEffect(() => {
    let world;
    try {
      world = createWorld(hostRef.current, {
        onSelect: setSelected,
        onFrame: setFrame,
        onRegion: id => visitRef.current(id),
        onAction: () => actionRef.current()
      });
      worldRef.current = world;
      world.setGame(gameRef.current);
      setReady(true);
      if (import.meta.env.DEV) window.__farm = { inspect: () => world.inspect(), state: () => gameRef.current };
    } catch (e) {
      console.error(e);
      setError('Nie udało się uruchomić grafiki 3D. Otwórz grę w aktualnej przeglądarce Chrome, Safari lub Firefox.');
    }
    return () => {
      world?.destroy();
      delete window.__farm;
      clearTimeout(toastTimer.current);
    };
  }, []);

  useEffect(() => {
    tickRef.current = setInterval(() => {
      const t = Date.now();
      setNow(t);
      const result = transact(gameRef.current, 'tick', t);
      if (result.ok) {
        commit(result.state);
        say(result.message);
      }
    }, 1000);
    return () => clearInterval(tickRef.current);
  }, [say]);

  useEffect(() => {
    worldRef.current?.pause(!!modal);
  }, [modal]);

  const active = frame.near || selected;
  const place = PLACES[active];
  const task = actionFor(active, game);
  const canAct = frame.near === active;

  const [owlRiddleId, setOwlRiddleId] = useState(1);
  const [owlAnswerState, setOwlAnswerState] = useState(null); // { selected, correct, fact }

  function interact() {
    if (!canAct || frame.busy || modal || task?.disabled) return;
    if (task.action.startsWith('travel:')) {
      worldRef.current?.select(task.action.split(':')[1]);
      return;
    }
    if (task.action === 'shop') {
      setShopMessage('');
      setModal('shop');
      return;
    }
    if (task.action === 'stall-modal') {
      setModal('stall');
      return;
    }
    if (task.action === 'helper-status') {
      setModal('helper');
      return;
    }
    if (task.action === 'owl-modal') {
      setOwlAnswerState(null);
      // Pick first unsolved or current
      const unsolved = OWL_RIDDLES.find(r => !game.solvedRiddles?.includes(r.id));
      if (unsolved) setOwlRiddleId(unsolved.id);
      setModal('owl');
      return;
    }
    const result = perform(task.action);
    if (result.ok) worldRef.current?.animateAction(task.action);
  }
  actionRef.current = interact;

  visitRef.current = id => {
    if (id !== 'farm') perform(`visit:${id}`);
  };

  const closeModal = useCallback(() => setModal(null), []);

  const quest = !game.houseLevel
    ? { title: 'Zbuduj swój dom', text: 'Zbierz drewno i kamień. Postaw pierwsze piętro.', target: 'house', progress: Math.min(game.wood / 6, 1) * 0.5 + Math.min(game.stone / 5, 1) * 0.5 }
    : !game.pen
    ? { title: 'Zagroda dla przyjaciół', text: 'Zbuduj zagrodę dla Bezucha i Karmelki.', target: 'pen', progress: 0.3 }
    : !game.babies
    ? { title: 'Pierwszy mały króliczek', text: game.nextBirthAt ? 'Maluszek jest w drodze!' : 'Wyhoduj marchewki i nakarm króliczki.', target: 'pen', progress: 0.5 }
    : !game.helper
    ? { title: 'Zatrudnij pomocnika', text: 'Pomocnik Franek zajmie się podlewaniem ogrodu.', target: 'helper', progress: 0.6 }
    : !game.stall
    ? { title: 'Wybuduj stragan', text: 'Stwórz kramik, by handlować z wędrowcami.', target: 'stall', progress: 0.75 }
    : !game.world?.orchard
    ? { title: 'Zasadź sad jabłoniowy', text: 'Odkryj łąkę i zbieraj świeże czerwone jabłka.', target: !game.world?.meadow ? 'meadowGate' : 'orchard', progress: 0.85 }
    : { title: 'Kraina wielkiego rozkwitu', text: 'Rozbuduj dom, powiększ zagrodę i handluj z gośćmi!', target: 'stall', progress: 1 };

  const currentRegion = frame.region || 'farm';
  const worldQuest = currentRegion !== 'farm'
    ? { title: REGIONS[currentRegion].name, text: REGIONS[currentRegion].subtitle, target: REGIONS[currentRegion].destination, progress: (game.world?.visited?.length || 1) / 4 }
    : quest;

  const remaining = game.nextBirthAt ? Math.max(0, Math.ceil((game.nextBirthAt - now) / 1000)) : 0;

  return (
    <main className="game-shell">
      <div className="world" ref={hostRef} />
      <div className="vignette" />

      <header className="hud">
        <button className="identity" onClick={() => { setName(game.name); setAvatar(game.avatar); setModal('profile'); }} aria-label="Zmień imię i postać">
          <span className="brand-mark"><Icon name="peg" size={27} /></span>
          <span>
            <small>e-klamerka</small>
            <strong>{game.name ? `Farma · ${game.name}` : 'Twoja mała farma'}<span className="edit-dot">✎</span></strong>
          </span>
        </button>
        <Resources state={game} />
        <div className="header-actions">
          <button className="map-shortcut" aria-label="Otwórz mapę świata" onClick={() => setModal('map')}>
            <Icon name="map" />
            <span>Mapa świata</span>
          </button>
          <button className="shop-shortcut" onClick={() => worldRef.current?.select('shop')}>
            <Icon name="shop" />
            <span>Sklep</span>
          </button>
        </div>
      </header>

      <aside className="quest-card">
        <span className="eyebrow"><span className="sun-dot" /> ZADANIE</span>
        <h1>{worldQuest.title}</h1>
        <p>{worldQuest.text}</p>
        <button className="quest-link" onClick={() => worldRef.current?.select(worldQuest.target)}>
          Prowadź mnie <Icon name="arrow" size={15} />
        </button>
        <div className="quest-progress"><i style={{ width: `${worldQuest.progress * 100}%` }} /></div>
      </aside>

      {!modal && (
        <div className="travel-tools">
          <button onClick={() => worldRef.current?.returnHome()}><Icon name="house" size={16} /> Do domu</button>
          {frame.moving && <button onClick={() => worldRef.current?.stop()}>Zatrzymaj</button>}
        </div>
      )}

      {ready && !modal && (
        <div className="world-labels">
          {Object.entries(PLACES).map(([id, p]) => visiblePlace(p, game) && (
            <button
              key={id}
              className={`place-label ${selected === id || frame.near === id ? 'selected' : ''}`}
              onClick={() => worldRef.current?.select(id)}
              onDoubleClick={() => worldRef.current?.performDirectAction(id)}
              data-place={id}
            >
              <span className="label-dot" />
              {p.short}
              {id === 'pen' && game.babies > 0 && <b>{game.babies}/{maxBabies(game)}</b>}
              {id === 'stall' && game.stall && <b>Goście</b>}
            </button>
          ))}
        </div>
      )}

      {game.nextBirthAt && (
        <div className="nursery">
          <Icon name="rabbit" size={20} />
          <span>Maluszek za <b>{remaining}s</b></span>
        </div>
      )}

      {notice && !modal && (
        <div className={`toast ${!notice.ok ? 'warning' : ''}`} role="status">
          <Icon name={notice.ok ? 'check' : 'leaf'} size={20} />
          {notice.message}
        </div>
      )}

      <div className="bottom-hud">
        {place && task ? (
          <section className="action-card">
            <div className="action-symbol"><Icon name={task.icon} size={27} /></div>
            <div className="action-copy">
              <span className="eyebrow">{canAct ? 'JESTEŚ NA MIEJSCU' : frame.moving ? 'W DRODZE' : 'CEL'}</span>
              <h2>{place.title}</h2>
              <p>{task.hint}</p>
              <Cost cost={task.cost} state={game} />
            </div>
            <button
              className="primary action"
              onClick={canAct ? interact : () => worldRef.current?.select(active)}
              disabled={canAct && (frame.busy || task.disabled)}
            >
              {canAct ? (frame.busy ? 'Chwileczkę…' : task.label) : 'Podejdź'}
              <Icon name={canAct ? 'check' : 'arrow'} size={19} />
            </button>
          </section>
        ) : (
          <div className="welcome-hint">
            <span className="hint-spark">✧</span>
            <strong>Twoja mała wielka farma</strong>
            <span>Dotknij dowolnego miejsca lub etykiety, aby podejść.</span>
          </div>
        )}

        <nav className="camera-controls" aria-label="Sterowanie kamerą">
          <button title="Wyśrodkuj widok" aria-label="Pokaż farmę" onClick={() => worldRef.current?.home()}><Icon name="compass" /></button>
          <button className="desktop-only" title="Obróć kamerę" aria-label="Obróć kamerę" onClick={() => worldRef.current?.turn(Math.PI / 4)}><Icon name="rotate" /></button>
          <button className="desktop-only" title="Przybliż" aria-label="Przybliż" onClick={() => worldRef.current?.zoom(-0.12)}><Icon name="plus" /></button>
          <button className="desktop-only" title="Oddal" aria-label="Oddal" onClick={() => worldRef.current?.zoom(0.12)}><Icon name="minus" /></button>
        </nav>
      </div>

      <div className="world-caption">
        <Icon name="leaf" size={15} />
        <span>{REGIONS[currentRegion].name.toLocaleUpperCase('pl')}</span>
        <span className="saved-dot" />
        {storageWarning ? 'Zapis niedostępny' : 'Zapis na urządzeniu'}
      </div>

      {!ready && (
        <div className="loading">
          <Icon name="peg" size={44} />
          <h2>{error ? 'Nie można otworzyć polany' : 'Otwieramy Twoją polanę…'}</h2>
          <p>{error || 'Za chwilę zacznie się mała wielka przygoda.'}</p>
        </div>
      )}

      {modal === 'map' && (
        <Modal title="Świat za klamerką" subtitle="MAPA KRAIN" onClose={closeModal}>
          <WorldMap game={game} current={currentRegion} position={frame.position} onTravel={id => { closeModal(); worldRef.current?.select(id); }} onOverview={() => { closeModal(); worldRef.current?.worldView(); }} />
        </Modal>
      )}

      {modal === 'shop' && (
        <Modal title="Sklepik pod klamerką" subtitle="DOBRZE CIĘ WIDZIEĆ" onClose={closeModal}>
          <Resources state={game} all />
          <div className="shop-feedback" role="status">{shopMessage || 'Wybierz nasiona lub towary do wymiany.'}</div>
          <div className="shop-items">
            {[
              { action: 'buy-seeds', icon: 'seeds', title: 'Paczuszka nasion', desc: 'Jedno sadzenie · co najmniej 3 marchewki', label: 'Kup · 2', available: game.coins >= 2 },
              { action: 'buy-carrots', icon: 'carrot', title: 'Dwie marchewki', desc: 'Pyszny posiłek dla króliczej pary', label: 'Kup · 3', available: game.coins >= 3 },
              { action: 'sell-apples', icon: 'apple', title: 'Sprzedaj 2 jabłka', desc: 'Soczyste owoce z Twojego sadu', label: 'Sprzedaj · +3', available: game.apples >= 2 },
              { action: 'sell-crystal', icon: 'crystal', title: 'Kryształ ze wzgórz', desc: 'Rzadki minerał o wysokiej wartości', label: 'Sprzedaj · +4', available: game.crystals > 0 },
              { action: 'sell-wood', icon: 'wood', title: 'Sprzedaj 2 drewna', desc: 'Las zawsze ma coś w zapasie', label: 'Sprzedaj · +2', available: game.wood >= 2 },
              { action: 'sell-stone', icon: 'stone', title: 'Sprzedaj 2 kamienie', desc: 'Zamień zapasy na nowe możliwości', label: 'Sprzedaj · +2', available: game.stone >= 2 },
              { action: 'sell-baby', icon: 'rabbit', title: 'Nowy dom dla maluszka', desc: `Masz ${game.babies} małych króliczków.`, label: 'Sprzedaj · +5', available: game.babies > 0 }
            ].map(item => (
              <article key={item.action}>
                <span className={`product-icon ${item.icon}`}><Icon name={item.icon} size={30} /></span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
                <button data-action={item.action} disabled={!item.available} onClick={() => perform(item.action)}>
                  {item.label}
                  <Icon name="coins" size={17} />
                </button>
              </article>
            ))}
          </div>
        </Modal>
      )}

      {modal === 'stall' && (
        <Modal title="Kramik Wędrowców" subtitle="HANDEL I GOŚCIE Z INNYCH KRAIN" onClose={closeModal}>
          <Resources state={game} all />
          <p className="modal-intro" style={{ fontSize: '13px', color: '#688071', margin: '14px 0' }}>
            Goście z lasu, wzgórz i łąki odwiedzają Twój stragan, by kupić świeże produkty z farmy!
          </p>
          <div className="shop-items">
            {game.visitors?.map(v => {
              const canFulfill = Object.entries(v.wants).every(([k, n]) => (game[k] || 0) >= n);
              return (
                <article key={v.id} style={{ background: '#f8fdf4', borderColor: '#d3e4c7' }}>
                  <span className="product-icon" style={{ background: '#e4efd7' }}><Icon name={v.icon || 'stall'} size={30} /></span>
                  <div>
                    <h3 style={{ color: '#385e42' }}>{v.name}</h3>
                    <p>{v.desc}</p>
                    <div style={{ display: 'flex', gap: '8px', fontSize: '11px', marginTop: '6px' }}>
                      <b>Chce:</b>
                      {Object.entries(v.wants).map(([k, n]) => (
                        <span key={k} style={{ color: (game[k] || 0) < n ? '#bc785d' : '#4d7557', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Icon name={resourceIcons[k] || 'leaf'} size={15} /> {n} {resourceNames[k]}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button className="primary" disabled={!canFulfill} onClick={() => perform(`fulfill:${v.id}`)} style={{ padding: '10px 14px', fontSize: '12px' }}>
                    Sprzedaj
                    <Icon name="coins" size={16} />
                  </button>
                </article>
              );
            })}
          </div>
        </Modal>
      )}

      {modal === 'helper' && (
        <Modal title="Pomocnik Franek" subtitle="PRZYJACIEL W OGRODZIE" onClose={closeModal}>
          <div style={{ textAlign: 'center', padding: '14px 0' }}>
            <div style={{ width: '64px', height: '64px', background: '#dce8d5', borderRadius: '50%', margin: '0 auto 14px', display: 'grid', placeItems: 'center' }}>
              <Icon name="helper" size={38} />
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: '19px' }}>Franek pracuje na Twoich grządkach!</h3>
            <p style={{ fontSize: '13px', color: '#688071', maxWidth: '400px', margin: '0 auto 16px', lineHeight: '1.6' }}>
              Gdy posiadasz nasionka w plecaku, Franek automatycznie sieje i podlewa marchewki oraz zwiększa wszystkie zbiory o +2!
            </p>
            <button className="primary full" onClick={closeModal}>Dziękuję, Franku!</button>
          </div>
        </Modal>
      )}

      {modal === 'owl' && (() => {
        const riddle = OWL_RIDDLES.find(r => r.id === owlRiddleId) || OWL_RIDDLES[0];
        const isSolved = game.solvedRiddles?.includes(riddle.id);
        const solvedCount = game.solvedRiddles?.length || 0;

        const handleAnswer = (optionIndex) => {
          if (isSolved && owlAnswerState?.correct) return;
          if (optionIndex === riddle.answer) {
            setOwlAnswerState({ selected: optionIndex, correct: true, fact: riddle.fact });
            if (!isSolved) {
              const updatedSolved = [...(game.solvedRiddles || []), riddle.id];
              const nextState = { ...gameRef.current, solvedRiddles: updatedSolved };
              for (const [k, n] of Object.entries(riddle.reward)) {
                nextState[k] = (nextState[k] || 0) + n;
              }
              commit(nextState);
              say(`Brawo! Nagroda od Sowy Klary: +${riddle.reward.coins} monet i nagrody!`);
            }
          } else {
            setOwlAnswerState({ selected: optionIndex, correct: false, fact: 'Niemal! Zastanów się jeszcze raz lub zapytaj przyjaciół.' });
          }
        };

        const nextRiddle = () => {
          const next = OWL_RIDDLES.find(r => r.id > riddle.id) || OWL_RIDDLES[0];
          setOwlRiddleId(next.id);
          setOwlAnswerState(null);
        };

        const prevRiddle = () => {
          const prev = OWL_RIDDLES.slice().reverse().find(r => r.id < riddle.id) || OWL_RIDDLES[OWL_RIDDLES.length - 1];
          setOwlRiddleId(prev.id);
          setOwlAnswerState(null);
        };

        return (
          <Modal title="Mądra Sowa Klara" subtitle="ZAGADKI I TAJEMNICE PRZYRODY" onClose={closeModal}>
            <div style={{ textAlign: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#f0f5ec', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', color: '#44654d', fontWeight: '600' }}>
                <Icon name="owl" size={20} />
                <span>Zagadka {riddle.id} z {OWL_RIDDLES.length} · Rozwiązane: {solvedCount}/{OWL_RIDDLES.length} ⭐</span>
              </div>
            </div>

            <div style={{ background: '#fdfcf7', border: '1.5px solid #e5dec9', borderRadius: '16px', padding: '18px', margin: '0 0 16px' }}>
              <h3 style={{ fontSize: '16px', color: '#3c4e3e', lineHeight: '1.5', margin: '0 0 14px' }}>
                „{riddle.question}”
              </h3>

              <div style={{ display: 'grid', gap: '10px' }}>
                {riddle.options.map((opt, idx) => {
                  const isSelected = owlAnswerState?.selected === idx;
                  const isCorrect = idx === riddle.answer;
                  let btnBg = '#fff';
                  let btnBorder = '#d5dfd1';
                  let btnColor = '#2d4233';

                  if (owlAnswerState) {
                    if (isCorrect && (isSelected || owlAnswerState.correct || isSolved)) {
                      btnBg = '#e3f6dc';
                      btnBorder = '#7bc668';
                      btnColor = '#1f5f14';
                    } else if (isSelected && !owlAnswerState.correct) {
                      btnBg = '#fde8e4';
                      btnBorder = '#e58f83';
                      btnColor = '#942b1f';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(idx)}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '12px',
                        border: `2px solid ${btnBorder}`,
                        background: btnBg,
                        color: btnColor,
                        fontWeight: '600',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span>{String.fromCharCode(65 + idx)}. {opt}</span>
                      {owlAnswerState && isCorrect && (isSelected || isSolved || owlAnswerState.correct) && <Icon name="check" size={18} />}
                    </button>
                  );
                })}
              </div>

              {owlAnswerState && (
                <div style={{
                  marginTop: '14px',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: owlAnswerState.correct ? '#ecfbe8' : '#fdf2f0',
                  color: owlAnswerState.correct ? '#23591a' : '#882b1f',
                  fontSize: '13px',
                  lineHeight: '1.4'
                }}>
                  <b>{owlAnswerState.correct ? '🎉 Wyśmienicie! ' : '💡 Wskazówka: '}</b>
                  {owlAnswerState.fact}
                </div>
              )}

              {isSolved && !owlAnswerState && (
                <div style={{ marginTop: '12px', fontSize: '12px', color: '#4d7557', textAlign: 'center', fontWeight: '500' }}>
                  ✓ Ta zagadka została już rozwiązana. Możesz przejść do następnej!
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between' }}>
              <button onClick={prevRiddle} style={{ background: '#f0f5ec', border: '1px solid #d3e2ce', borderRadius: '10px', padding: '10px 14px', color: '#385e42', fontWeight: '600', fontSize: '12px' }}>
                ◀ Poprzednia
              </button>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '11px', color: '#688071' }}>
                Nagroda:
                {Object.entries(riddle.reward).map(([k, n]) => (
                  <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', fontWeight: '600', color: '#355b3f' }}>
                    <Icon name={resourceIcons[k] || 'coins'} size={15} /> +{n}
                  </span>
                ))}
              </div>
              <button onClick={nextRiddle} className="primary" style={{ padding: '10px 16px', fontSize: '12px' }}>
                Następna ▶
              </button>
            </div>
          </Modal>
        );
      })()}

      {modal === 'profile' && (
        <Modal title="To Twoja przygoda" subtitle="PROFIL POSTACI" onClose={closeModal}>
          <form onSubmit={e => { e.preventDefault(); commit({ ...gameRef.current, name: name.trim().slice(0, 20), avatar }); closeModal(); say('Gotowe. Ruszamy na polanę!'); }}>
            <label className="field-label" htmlFor="player-name">Jak nazwiemy Twoją postać?</label>
            <input id="player-name" autoComplete="nickname" maxLength={20} placeholder="Wpisz imię" value={name} onChange={e => setName(e.target.value)} />
            <div className="avatar-choices">
              {['girl', 'boy'].map(a => (
                <button type="button" className={avatar === a ? 'chosen' : ''} key={a} aria-pressed={avatar === a} onClick={() => setAvatar(a)}>
                  <span className={`avatar-swatch ${a}`}><Icon name="leaf" size={28} /></span>
                  {a === 'girl' ? 'Dziewczynka' : 'Chłopiec'}
                  {avatar === a && <Icon name="check" size={17} />}
                </button>
              ))}
            </div>
            <button type="submit" className="primary full">Zapisz postać <Icon name="arrow" size={20} /></button>
          </form>
        </Modal>
      )}
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  let reloading = false;
  const alreadyControlled = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (alreadyControlled && !reloading) {
      reloading = true;
      location.reload();
    }
  });
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).then(r => r.update()).catch(() => {}));
}
