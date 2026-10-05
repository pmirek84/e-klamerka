import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createWorld } from './world/scene.js';
import {
  loadGame,
  SAVE_KEY,
  SAVE_VERSION,
  transact,
  PLACES,
  actionFor,
  maxBabies,
  OWL_RIDDLES,
  getAvailableVisitors,
  hasConnectedWorld,
  TOURIST_GUESTS,
  exportGameSave,
  importGameSave,
  houseCost,
  penCost,
  landCost,
  COSTS
} from './game.js';
import { Icon } from './icons.jsx';
import './style.css';
import { WorldMap } from './WorldMap.jsx';
import { REGIONS, visiblePlace } from './world/regions.js';

const resourceNames = {
  wood: 'drewno',
  stone: 'kamień',
  carrots: 'marchewki',
  seeds: 'nasiona',
  wheat: 'pszenica',
  apples: 'jabłka',
  flour: 'mąka',
  crystals: 'kryształy',
  coins: 'monety'
};

const resourceIcons = {
  wood: 'wood',
  stone: 'stone',
  carrots: 'carrot',
  seeds: 'seeds',
  wheat: 'wheat',
  apples: 'apple',
  flour: 'flour',
  crystals: 'crystal',
  coins: 'coins',
  helper: 'helper',
  stall: 'stall',
  windmill: 'windmill',
  pump: 'pump',
  backpack: 'backpack',
  pickaxe: 'pickaxe'
};

function Resources({ state, all = false, onOpenBackpack }) {
  // HUD: max 3 contextual resources + coins (Section 17)
  const keys = all
    ? ['wood', 'stone', 'carrots', 'seeds', 'wheat', 'apples', 'flour', 'crystals', 'coins']
    : ['wood', 'stone', state.plantedCrop === 'wheat' || state.wheat > 0 ? 'wheat' : 'carrots', 'coins'];

  return (
    <div className="resources" aria-label="Zasoby">
      {keys.map(k => (
        <span className={`resource ${k}`} key={k} title={resourceNames[k]}>
          <Icon name={resourceIcons[k]} size={22} />
          <b data-resource={k}>{state[k] || 0}</b>
          <span className="sr-only"> {resourceNames[k]}</span>
        </span>
      ))}
      {!all && onOpenBackpack && (
        <button
          className="resource backpack-btn"
          onClick={onOpenBackpack}
          title="Otwórz pełny plecak"
          style={{ background: 'rgba(255,255,255,0.85)', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <Icon name="backpack" size={20} />
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#684224' }}>Plecak</span>
        </button>
      )}
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
  const [houseTab, setHouseTab] = useState('workshop'); // 'workshop' | 'kitchen' | 'guests'
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
  const fileInputRef = useRef(null);

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
        if (result.message) say(result.message);
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
  const [owlAnswerState, setOwlAnswerState] = useState(null);

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
    if (task.action === 'house-modal') {
      setHouseTab(game.houseLevel >= 3 ? 'guests' : game.houseLevel >= 2 ? 'kitchen' : 'workshop');
      setModal('house');
      return;
    }
    if (active === 'pen' && game.pen) {
      setModal('pen');
      return;
    }
    if (active === 'garden' && !game.planted) {
      setModal('garden');
      return;
    }
    if (task.action === 'owl-modal') {
      setOwlAnswerState(null);
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

  const handleImportSave = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = importGameSave(ev.target?.result);
        commit(imported);
        closeModal();
        say('Postęp gry został pomyślnie wczytany!');
      } catch (err) {
        say(err.message, false);
      }
    };
    reader.readAsText(file);
  };

  // Main quest progression sequence according to v0.4 section 3 & 8
  const quest = !game.houseLevel
    ? { title: 'Zbuduj swój dom', text: 'Zbierz drewno i kamień. Zbuduj Chatkę (8 drewna, 6 kamieni).', target: 'house', progress: Math.min(game.wood / 8, 1) * 0.5 + Math.min(game.stone / 6, 1) * 0.5 }
    : !game.pen
    ? { title: 'Przygotuj zagrodę', text: 'Zbuduj zagrodę i przyjmij Bezucha oraz Karmelkę (6 drewna, 4 kamienie).', target: 'pen', progress: 0.3 }
    : !game.planted
    ? { title: 'Pierwszy zasiew', text: 'Posiej i zbierz marchewki w ogrodzie, by nakarmić króliczki.', target: 'garden', progress: 0.4 }
    : !game.babies && !game.nextBirthAt
    ? { title: 'Królicza rodzinka', text: 'Nakarm parę królików 2 marchewkami, by powitać pierwszego maluszka!', target: 'pen', progress: 0.5 }
    : !game.world?.quarry
    ? { title: 'Droga ku Wzgórzom', text: 'Odbuduj most do Kryształowych Wzgórz (10 drewna, 6 kamieni).', target: 'quarryGate', progress: 0.6 }
    : game.houseLevel < 2
    ? { title: 'Dom gospodarza', text: 'Rozbuduj dom o piętro, by odblokować kuchnię, pokój Franka i kram.', target: 'house', progress: 0.7 }
    : !game.world?.meadow
    ? { title: 'Słoneczna Łąka', text: 'Odbuduj most na Łąkę i napraw stary wiatrak zbożowy.', target: 'meadowGate', progress: 0.8 }
    : game.houseLevel < 3
    ? { title: 'Dom odkrywcy', text: 'Stwórz Dom odkrywcy z pokojami gościnnymi i stołem wypraw!', target: 'house', progress: 0.9 }
    : { title: 'Wielki rozkwit farmy', text: 'Przyjmuj gości z krain, dbaj o króliczki i kompletuj pamiątki!', target: 'house', progress: 1 };

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
            <small>e-klamerka · v0.4</small>
            <strong>{game.name ? `Farma · ${game.name}` : 'Twoja mała farma'}<span className="edit-dot">✎</span></strong>
          </span>
        </button>
        <Resources state={game} onOpenBackpack={() => setModal('backpack')} />
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
        <span className="eyebrow"><span className="sun-dot" /> ZADANIE GŁÓWNE</span>
        <h1>{worldQuest.title}</h1>
        <p>{worldQuest.text}</p>
        <button className="quest-link" onClick={() => worldRef.current?.select(worldQuest.target)}>
          Prowadź mnie <Icon name="arrow" size={15} />
        </button>
        <div className="quest-progress"><i style={{ width: `${worldQuest.progress * 100}%` }} /></div>
      </aside>

      {!modal && (
        <div className="travel-tools">
          {frame.clock && (
            <div className={`clock-pill ${frame.clock.night ? 'night' : ''}`} aria-label={`Godzina w grze: ${frame.clock.label}`}>
              <span className="clock-orb" aria-hidden="true">{frame.clock.night ? '☾' : '☀'}</span>
              <span><small>{frame.clock.phase.toLocaleUpperCase('pl')}</small><b>{frame.clock.label}</b></span>
            </div>
          )}
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
              {id === 'stall' && game.stall && <b>Kram</b>}
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
            <strong>Twoja farma 3D</strong>
            <span>Dotknij dowolnego miejsca lub etykiety, aby podejść.</span>
          </div>
        )}

        <nav className="camera-controls" aria-label="Sterowanie kamerą">
          <button title="Widok z góry / za postacią" aria-label="Przełącz widok z góry" onClick={() => worldRef.current?.home()}><Icon name="compass" /></button>
          <button title={frame.muted ? 'Włącz dźwięki' : 'Wycisz dźwięki'} aria-label={frame.muted ? 'Włącz dźwięki' : 'Wycisz dźwięki'} onClick={() => worldRef.current?.toggleSound()} className="sound-toggle">
            <span aria-hidden="true">{frame.muted ? '🔇' : '🔊'}</span>
          </button>
          <button className="desktop-only" title="Obróć kamerę" aria-label="Obróć kamerę" onClick={() => worldRef.current?.turn(Math.PI / 4)}><Icon name="rotate" /></button>
          <button className="desktop-only" title="Przybliż" aria-label="Przybliż" onClick={() => worldRef.current?.zoom(-0.12)}><Icon name="plus" /></button>
          <button className="desktop-only" title="Oddal" aria-label="Oddal" onClick={() => worldRef.current?.zoom(0.12)}><Icon name="minus" /></button>
        </nav>
      </div>

      <div className="world-caption">
        <Icon name="leaf" size={15} />
        <span>{REGIONS[currentRegion].name.toLocaleUpperCase('pl')}</span>
        <span className="saved-dot" />
        {storageWarning ? 'Zapis niedostępny' : 'Zapis na urządzeniu (v0.4)'}
      </div>

      {!ready && (
        <div className="loading">
          <Icon name="peg" size={44} />
          <h2>{error ? 'Nie można otworzyć polany' : 'Otwieramy Twoją polanę…'}</h2>
          <p>{error || 'Za chwilę zacznie się mała wielka przygoda.'}</p>
        </div>
      )}

      {/* BACKPACK / INVENTORY MODAL (Section 17) */}
      {modal === 'backpack' && (
        <Modal title="Twój Plecak Odkrywcy" subtitle="WSZYSTKIE ZASOBY I NARZĘDZIA" onClose={closeModal}>
          <div style={{ marginBottom: '14px' }}>
            <h4 style={{ margin: '0 0 8px', fontSize: '13px', color: '#4a6f54', textTransform: 'uppercase' }}>Surowce (9):</h4>
            <Resources state={game} all />
          </div>

          <div style={{ marginTop: '16px', background: '#f8faf6', border: '1.5px solid #dce8d6', borderRadius: '14px', padding: '12px' }}>
            <h4 style={{ margin: '0 0 8px', fontSize: '13px', color: '#3f6349', textTransform: 'uppercase' }}>Narzędzia i wyposażenie:</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
              <div style={{ background: '#fff', padding: '8px 10px', borderRadius: '10px', border: '1px solid #d5e2cf', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon name="leaf" size={20} />
                <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Siekierka ✓</span>
              </div>
              <div style={{ background: '#fff', padding: '8px 10px', borderRadius: '10px', border: '1px solid #d5e2cf', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon name="leaf" size={20} />
                <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Konewka ✓</span>
              </div>
              <div style={{ background: game.tools?.pickaxe ? '#eaf5e6' : '#f5f5f5', padding: '8px 10px', borderRadius: '10px', border: '1px solid #d5e2cf', display: 'flex', alignItems: 'center', gap: '8px', opacity: game.tools?.pickaxe ? 1 : 0.6 }}>
                <Icon name="pickaxe" size={20} />
                <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Kilof {game.tools?.pickaxe ? '✓' : '(brak)'}</span>
              </div>
              <div style={{ background: game.tools?.basket ? '#eaf5e6' : '#f5f5f5', padding: '8px 10px', borderRadius: '10px', border: '1px solid #d5e2cf', display: 'flex', alignItems: 'center', gap: '8px', opacity: game.tools?.basket ? 1 : 0.6 }}>
                <Icon name="backpack" size={20} />
                <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Kosz {game.tools?.basket ? '✓' : '(brak)'}</span>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* MAP MODAL */}
      {modal === 'map' && (
        <Modal title="Świat za klamerką" subtitle="MAPA KRAIN" onClose={closeModal}>
          <WorldMap game={game} current={currentRegion} position={frame.position} onTravel={id => { closeModal(); worldRef.current?.select(id); }} onOverview={() => { closeModal(); worldRef.current?.worldView(); }} />
        </Modal>
      )}

      {/* GARDEN PLANTING SELECTOR MODAL */}
      {modal === 'garden' && (
        <Modal title="Marchewkowy i Zbożowy Ogród" subtitle="WYBIERZ ZASIEW" onClose={closeModal}>
          <Resources state={game} />
          <p style={{ fontSize: '13px', color: '#52755c', margin: '12px 0' }}>
            Wybierz roślinę do posiania na Twoich {1 + (game.landLevel || 0)} grządkach (1 nasiono = obsianie ogrodu):
          </p>
          <div className="shop-items">
            <article style={{ background: '#fcf8f0', borderColor: '#e8dcba' }}>
              <span className="product-icon" style={{ background: '#f5ebd2' }}><Icon name="carrot" size={32} /></span>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '15px', color: '#7a4e1d' }}>Soczyste Marchewki</h3>
                <p style={{ fontSize: '12px' }}>Zbiór: 6 sztuk / grządkę po 60 sekundach · pokarm dla królików</p>
              </div>
              <button
                className="primary"
                disabled={game.seeds < 1}
                onClick={() => { perform('plant:carrots'); closeModal(); worldRef.current?.animateAction('garden'); }}
              >
                Posiej Marchewki
              </button>
            </article>

            <article style={{ background: '#faf9f2', borderColor: '#e2ddbe' }}>
              <span className="product-icon" style={{ background: '#f2edd0' }}><Icon name="wheat" size={32} /></span>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '15px', color: '#6d5a1b' }}>Złota Pszenica</h3>
                <p style={{ fontSize: '12px' }}>Zbiór: 4 sztuki / grządkę po 90 sekundach · surowiec do młyna na mąkę</p>
              </div>
              <button
                className="primary"
                disabled={game.seeds < 1}
                onClick={() => { perform('plant:wheat'); closeModal(); worldRef.current?.animateAction('garden'); }}
              >
                Posiej Pszenicę
              </button>
            </article>
          </div>
        </Modal>
      )}

      {/* RABBIT PEN MODAL (Section 11) */}
      {modal === 'pen' && (() => {
        const capacity = maxBabies(game);
        const isFull = game.babies >= capacity;
        const upgradeCost = penCost(game.penLevel);

        return (
          <Modal title="Bezuch i Karmelka" subtitle="KRÓLICZA RODZINKA I ZAGRODA" onClose={closeModal}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: '#f8fdf4', border: '1.5px solid #d4e7c7', borderRadius: '16px', padding: '12px 16px', marginBottom: '14px' }}>
              <div style={{ width: '56px', height: '56px', background: '#e5f3dc', borderRadius: '50%', display: 'grid', placeItems: 'center', border: '2px solid #b7dba2' }}>
                <Icon name="rabbit" size={36} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 4px', fontSize: '16px', color: '#2d5936' }}>Para Rodziców: Bezuch i Karmelka</h3>
                <p style={{ margin: 0, fontSize: '12px', color: '#577c60', lineHeight: '1.4' }}>
                  Stała para mieszkańców farmy. Karm ich marchewkami, by powitać na świecie puszyste maluszki!
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fcfbf7', border: '1.5px solid #e8e2d0', borderRadius: '12px', padding: '10px 14px', marginBottom: '14px' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#7a7566', textTransform: 'uppercase', fontWeight: 'bold' }}>Pojemność zagrody:</span>
                <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#334c38' }}>
                  {game.babies} / {capacity} maluszków (Poziom {game.penLevel})
                </div>
              </div>
              {game.penLevel < 3 && (
                <button
                  className="secondary"
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                  onClick={() => perform('pen')}
                >
                  Powiększ zagrodę
                  <Cost cost={upgradeCost} state={game} />
                </button>
              )}
            </div>

            <div className="shop-items" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <article style={{ background: '#fcf9f2', borderColor: '#e6dec5' }}>
                <span className="product-icon" style={{ background: '#f3ebd4' }}><Icon name="carrot" size={28} /></span>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '14px', color: '#684a16' }}>Nakarm parę rodziców (2 marchewki)</h3>
                  <p style={{ fontSize: '12px' }}>
                    {game.nextBirthAt ? `Maluszek już w drodze (${remaining}s)!` : isFull ? 'Zagroda pełna – powiększ zagrodę lub oddaj maluszka do adopcji.' : `Czas: ${game.totalBred === 0 ? '45s' : '90s'}`}
                  </p>
                </div>
                <button
                  className="primary"
                  disabled={Boolean(game.nextBirthAt) || isFull || game.carrots < 2}
                  onClick={() => perform('feed')}
                  style={{ fontSize: '12px', padding: '8px 14px' }}
                >
                  {game.nextBirthAt ? `${remaining}s` : 'Nakarm'}
                </button>
              </article>

              <article style={{ background: '#f5faf4', borderColor: '#d3e8cf' }}>
                <span className="product-icon" style={{ background: '#e1f2dc' }}><Icon name="rabbit" size={28} /></span>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '14px', color: '#2d5e38' }}>Nowy dom dla maluszka</h3>
                  <p style={{ fontSize: '12px' }}>Przekaż wybranego maluszka nowej kochającej rodzinie · +5 monet</p>
                </div>
                <button
                  className="secondary"
                  disabled={game.babies < 1}
                  onClick={() => perform('sell-baby')}
                  style={{ fontSize: '12px', padding: '8px 14px' }}
                >
                  Adopcja (+5)
                </button>
              </article>
            </div>
          </Modal>
        );
      })()}

      {/* HOUSE MODAL (Section 5: Warsztat, Kuchnia, Goście) */}
      {modal === 'house' && (() => {
        const connected = hasConnectedWorld(game);
        const currentGuest = TOURIST_GUESTS[(game.guestIndex || 0) % TOURIST_GUESTS.length];
        const isResting = Date.now() - (game.lastTouristIncome || 0) < 30000;
        const waitSec = Math.max(1, Math.ceil((30000 - (Date.now() - (game.lastTouristIncome || 0))) / 1000));

        return (
          <Modal title="Twój Dom · Baza Gospodarza" subtitle={`POZIOM ${game.houseLevel}: ${game.houseLevel === 1 ? 'CHATKA' : game.houseLevel === 2 ? 'DOM GOSPODARZA' : 'DOM ODKRYWCY'}`} onClose={closeModal}>
            <Resources state={game} all />

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', margin: '14px 0 10px', borderBottom: '2px solid #e1ebdc', paddingBottom: '8px' }}>
              <button
                className={houseTab === 'workshop' ? 'primary' : 'secondary'}
                style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '10px' }}
                onClick={() => setHouseTab('workshop')}
              >
                Warsztat
              </button>
              {game.houseLevel >= 2 && (
                <button
                  className={houseTab === 'kitchen' ? 'primary' : 'secondary'}
                  style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '10px' }}
                  onClick={() => setHouseTab('kitchen')}
                >
                  Kuchnia
                </button>
              )}
              {game.houseLevel >= 3 && (
                <button
                  className={houseTab === 'guests' ? 'primary' : 'secondary'}
                  style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '10px' }}
                  onClick={() => setHouseTab('guests')}
                >
                  Pokoje Gościnne
                </button>
              )}
            </div>

            {/* TAB: WORKSHOP */}
            {houseTab === 'workshop' && (
              <div>
                <h4 style={{ margin: '0 0 8px', fontSize: '13px', color: '#4a6f54' }}>Wytwarzanie narzędzi i wyposażenia:</h4>
                <div className="shop-items">
                  <article style={{ background: '#fdfbf7', borderColor: '#e6ded0' }}>
                    <span className="product-icon" style={{ background: '#efe7d6' }}><Icon name="pickaxe" size={28} /></span>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '14px' }}>Kilof górniczy</h3>
                      <p style={{ fontSize: '12px' }}>Wymagany do wydobycia błękitnych kryształów na Wzgórzach</p>
                    </div>
                    <button disabled={Boolean(game.tools?.pickaxe)} className="primary" onClick={() => perform('unlock:quarry')} style={{ fontSize: '12px' }}>
                      {game.tools?.pickaxe ? 'Posiadany ✓' : 'Zrób kilof'}
                    </button>
                  </article>

                  <article style={{ background: '#fdfbf7', borderColor: '#e6ded0' }}>
                    <span className="product-icon" style={{ background: '#efe7d6' }}><Icon name="backpack" size={28} /></span>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '14px' }}>Kosz wyprawowy</h3>
                      <p style={{ fontSize: '12px' }}>Wykonany z 3 drewna do dalszych wypraw</p>
                    </div>
                    <button disabled={Boolean(game.tools?.basket)} className="primary" onClick={() => perform('unlock:lake')} style={{ fontSize: '12px' }}>
                      {game.tools?.basket ? 'Posiadany ✓' : 'Wypleć (3 drewna)'}
                    </button>
                  </article>
                </div>
              </div>
            )}

            {/* TAB: KITCHEN */}
            {houseTab === 'kitchen' && (
              <div>
                <h4 style={{ margin: '0 0 8px', fontSize: '13px', color: '#4a6f54' }}>Kuchnia i pieczenie pieczywa:</h4>
                <div className="shop-items">
                  <article style={{ background: '#fefdf7', borderColor: '#eae0c8' }}>
                    <span className="product-icon" style={{ background: '#f8eed4' }}><Icon name="flour" size={28} /></span>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '14px' }}>Świeże pieczywo dla gości</h3>
                      <p style={{ fontSize: '12px' }}>Wypiek bochenka z 1 mąki do poczęstunku turystów</p>
                    </div>
                    <button disabled={game.flour < 1} className="primary" onClick={() => say('Masz gotową mąkę do przygotowania poczęstunku dla gościa!')} style={{ fontSize: '12px' }}>
                      {game.flour >= 1 ? 'Mąka gotowa' : 'Brak mąki'}
                    </button>
                  </article>
                </div>
              </div>
            )}

            {/* TAB: GUESTS (Section 14: 1 guest, 1 room, exact v0.4 rewards) */}
            {houseTab === 'guests' && (
              <div>
                {!connected ? (
                  <p style={{ fontSize: '13px', color: '#7a5a3a' }}>
                    Odbuduj most do Wzgórz lub Łąki na mapie, by goście mogli tu dotrzeć!
                  </p>
                ) : isResting ? (
                  <div style={{ textAlign: 'center', padding: '14px 0' }}>
                    <p style={{ fontSize: '13px', color: '#5b7a65', margin: '0 0 8px' }}>
                      Pokój gościnny jest wietrzony po wizycie. Kolejny gość zbliża się drogą!
                    </p>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#396345', background: '#e4f0de', padding: '4px 12px', borderRadius: '12px' }}>
                      Nowy gość za: {waitSec}s
                    </span>
                  </div>
                ) : (
                  <div>
                    <div style={{ background: '#f5f9f2', border: '1.5px solid #d5e5cf', borderRadius: '14px', padding: '12px', marginBottom: '12px' }}>
                      <h3 style={{ margin: '0 0 4px', fontSize: '15px', color: '#2b5137' }}>{currentGuest.name} ({currentGuest.origin})</h3>
                      <p style={{ margin: 0, fontSize: '12px', color: '#496b52', fontStyle: 'italic' }}>{currentGuest.greeting}</p>
                    </div>

                    <div className="shop-items" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <article style={{ background: '#fcfdfa' }}>
                        <span className="product-icon"><Icon name="house" size={26} /></span>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: 0, fontSize: '13px' }}>Sam nocleg i herbatka</h4>
                          <span style={{ fontSize: '11px', color: '#396b44' }}>Zapłata: +8 monet</span>
                        </div>
                        <button className="secondary" onClick={() => perform('host-guest:tea')} style={{ fontSize: '12px', padding: '6px 12px' }}>
                          Ugość (8 monet)
                        </button>
                      </article>

                      <article style={{ background: '#fcfdfa' }}>
                        <span className="product-icon"><Icon name="carrot" size={26} /></span>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: 0, fontSize: '13px' }}>Poczęstunek marchewkowy (3 marchewki)</h4>
                          <span style={{ fontSize: '11px', color: '#396b44' }}>Zapłata: +16 monet</span>
                        </div>
                        <button className="primary" disabled={game.carrots < 3} onClick={() => perform('host-guest:carrots')} style={{ fontSize: '12px', padding: '6px 12px' }}>
                          Poczęstuj (16 monet)
                        </button>
                      </article>

                      <article style={{ background: '#fcfdfa' }}>
                        <span className="product-icon"><Icon name="apple" size={26} /></span>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: 0, fontSize: '13px' }}>Deser jabłkowy (2 jabłka)</h4>
                          <span style={{ fontSize: '11px', color: '#396b44' }}>Zapłata: +18 monet</span>
                        </div>
                        <button className="primary" disabled={game.apples < 2} onClick={() => perform('host-guest:apples')} style={{ fontSize: '12px', padding: '6px 12px' }}>
                          Poczęstuj (18 monet)
                        </button>
                      </article>

                      <article style={{ background: '#fcfdfa' }}>
                        <span className="product-icon"><Icon name="flour" size={26} /></span>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: 0, fontSize: '13px' }}>Ciepłe pieczywo (1 mąka)</h4>
                          <span style={{ fontSize: '11px', color: '#396b44' }}>Zapłata: +18 monet</span>
                        </div>
                        <button className="primary" disabled={game.flour < 1} onClick={() => perform('host-guest:bread')} style={{ fontSize: '12px', padding: '6px 12px' }}>
                          Upiecz i ugość (18 monet)
                        </button>
                      </article>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Modal>
        );
      })()}

      {/* SHOP MODAL (Section 12: Exact v0.4 buy/sell tables) */}
      {modal === 'shop' && (
        <Modal title="Sklepik pod klamerką" subtitle="DOBRZE CIĘ WIDZIEĆ" onClose={closeModal}>
          <Resources state={game} all />
          <div className="shop-feedback" role="status">{shopMessage || 'Wybierz nasiona lub towary do wymiany.'}</div>
          <div className="shop-items">
            {[
              { action: 'buy-seeds', icon: 'seeds', title: 'Paczka nasion', desc: 'Uniwersalne nasiona do siewu w ogrodzie', label: 'Kup · 2', available: game.coins >= 2 },
              { action: 'buy-carrots', icon: 'carrot', title: '2 marchewki', desc: 'Pyszny posiłek dla króliczej pary', label: 'Kup · 3', available: game.coins >= 3 },
              { action: 'buy-wood', icon: 'wood', title: '2 drewna', desc: 'Materiały do budowy i rozbudowy', label: 'Kup · 3', available: game.coins >= 3 },
              { action: 'buy-stone', icon: 'stone', title: '2 kamienie', desc: 'Materiały na mosty i fundamenty', label: 'Kup · 3', available: game.coins >= 3 },
              ...(game.world?.quarry ? [
                { action: 'buy-crystal', icon: 'crystal', title: 'Błękitny kryształ', desc: 'Cenny minerał z kopalni wzgórz', label: 'Kup · 10', available: game.coins >= 10 }
              ] : []),
              { action: 'sell-wood', icon: 'wood', title: 'Sprzedaj 2 drewna', desc: 'Nadwyżki zebrane z farmy lub lasu', label: 'Sprzedaj · +2', available: game.wood >= 2 },
              { action: 'sell-stone', icon: 'stone', title: 'Sprzedaj 2 kamienie', desc: 'Zapas kamieni z polany', label: 'Sprzedaj · +2', available: game.stone >= 2 },
              { action: 'sell-carrot', icon: 'carrot', title: 'Sprzedaj 1 marchewkę', desc: 'Świeży plon z ogrodu', label: 'Sprzedaj · +1', available: game.carrots >= 1 },
              { action: 'sell-wheat', icon: 'wheat', title: 'Sprzedaj 1 pszenicę', desc: 'Złote kłosy zebrane z ogrodu', label: 'Sprzedaj · +1', available: game.wheat >= 1 },
              { action: 'sell-apples', icon: 'apple', title: 'Sprzedaj 2 jabłka', desc: 'Soczyste owoce z sadu jabłoni', label: 'Sprzedaj · +4', available: game.apples >= 2 },
              { action: 'sell-flour', icon: 'flour', title: 'Sprzedaj 1 mąkę', desc: 'Świeża mąka ze skrzydlatego młyna', label: 'Sprzedaj · +3', available: game.flour >= 1 },
              { action: 'sell-crystal', icon: 'crystal', title: 'Sprzedaj 1 kryształ', desc: 'Rzadki kryształ ze wzgórz', label: 'Sprzedaj · +4', available: game.crystals >= 1 },
              { action: 'sell-baby', icon: 'rabbit', title: 'Nowy dom dla maluszka', desc: `Masz ${game.babies} małych króliczków.`, label: 'Adopcja · +5', available: game.babies > 0 }
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

      {/* STALL / KRAM WĘDROWCÓW MODAL */}
      {modal === 'stall' && (() => {
        const connected = hasConnectedWorld(game);
        const visitorsList = getAvailableVisitors(game);

        return (
          <Modal title="Kramik Wędrowców" subtitle="ZAMÓWIENIA GOŚCI Z KRAIN" onClose={closeModal}>
            <Resources state={game} all />
            <p className="modal-intro" style={{ fontSize: '13px', color: '#688071', margin: '14px 0' }}>
              {connected
                ? 'Wędrowcy z połączonych krain składają zamówienia na plony z Twojej farmy.'
                : 'Odbuduj most do Wzgórz lub Łąki, by przybyli pierwsi wędrowcy.'}
            </p>

            <div className="shop-items">
              {visitorsList.map(v => {
                const canFulfill = Object.entries(v.wants).every(([k, n]) => (game[k] || 0) >= n);
                return (
                  <article key={v.id} style={{ background: '#f8fdf4', borderColor: '#d3e4c7' }}>
                    <span className="product-icon" style={{ background: '#e4efd7' }}><Icon name={v.icon || 'stall'} size={30} /></span>
                    <div>
                      <h3 style={{ color: '#385e42' }}>{v.name}</h3>
                      <p>{v.desc}</p>
                      <div style={{ display: 'flex', gap: '8px', fontSize: '11px', marginTop: '6px', flexWrap: 'wrap' }}>
                        <b>Potrzebuje:</b>
                        {Object.entries(v.wants).map(([k, n]) => (
                          <span key={k} style={{ color: (game[k] || 0) < n ? '#bc785d' : '#4d7557', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <Icon name={resourceIcons[k] || 'leaf'} size={15} /> {n} {resourceNames[k]}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button className="primary" disabled={!canFulfill} onClick={() => perform(`fulfill:${v.id}`)} style={{ padding: '10px 14px', fontSize: '12px' }}>
                      Dostarcz (+{v.gives.coins} monet)
                    </button>
                  </article>
                );
              })}
            </div>
          </Modal>
        );
      })()}

      {/* HELPER MODAL */}
      {modal === 'helper' && (
        <Modal title="Pomocnik Franek" subtitle="PRZYJACIEL W OGRODZIE" onClose={closeModal}>
          <div style={{ textAlign: 'center', padding: '14px 0' }}>
            <div style={{ width: '64px', height: '64px', background: '#dce8d5', borderRadius: '50%', margin: '0 auto 14px', display: 'grid', placeItems: 'center' }}>
              <Icon name="helper" size={38} />
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: '19px' }}>Franek pomaga w Twoim ogrodzie!</h3>
            <p style={{ fontSize: '13px', color: '#688071', maxWidth: '400px', margin: '0 auto 16px', lineHeight: '1.6' }}>
              Franek zbiera dojrzałe uprawy i ponownie obsiewa grządki, dbając o nienaruszalną rezerwę nasion (min. 2 nasiona w plecaku).
            </p>
            <button className="primary full" onClick={closeModal}>Dziękuję, Franku!</button>
          </div>
        </Modal>
      )}

      {/* OWL RIDDLES MODAL (Section 15: 2 coins reward, hint, trivia) */}
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
              say(`Brawo! Nagroda od Sowy Klary: +${riddle.reward.coins} monety!`);
            }
          } else {
            setOwlAnswerState({ selected: optionIndex, correct: false, fact: riddle.hint || 'Zastanów się jeszcze raz!' });
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: '#f5f8f1', border: '1.5px solid #dbe6d2', borderRadius: '16px', padding: '14px 18px', marginBottom: '14px' }}>
              <div style={{ width: '56px', height: '56px', minWidth: '56px', background: '#e1ecd6', borderRadius: '50%', display: 'grid', placeItems: 'center', border: '2px solid #b9d7a6' }}>
                <Icon name="owl" size={36} />
              </div>
              <div>
                <h4 style={{ margin: '0 0 4px', fontSize: '15px', color: '#2d5138' }}>Sowa Klara · Przewodniczka</h4>
                <p style={{ margin: 0, fontSize: '12px', color: '#5b7863', lineHeight: '1.4' }}>
                  „Huhu! Znam sekrety lasu, łąki i gwiazd. Rozwiąż zagadkę przyrodniczą!”
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', padding: '0 4px' }}>
              <span style={{ fontSize: '12px', color: '#4a6f54', fontWeight: '700' }}>
                Zagadka {riddle.id} z {OWL_RIDDLES.length}
              </span>
              <span style={{ fontSize: '12px', background: '#ebf4e6', color: '#385e42', padding: '3px 10px', borderRadius: '12px', fontWeight: '600' }}>
                Rozwiązane: {solvedCount}/{OWL_RIDDLES.length} ⭐
              </span>
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
                        textAlign: 'left'
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
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', alignItems: 'center' }}>
              <button onClick={prevRiddle} style={{ background: '#f0f5ec', border: '1px solid #d3e2ce', borderRadius: '10px', padding: '10px 14px', color: '#385e42', fontWeight: '600', fontSize: '12px' }}>
                ◀ Poprzednia
              </button>
              <div style={{ fontSize: '12px', color: '#355b3f', fontWeight: 'bold' }}>
                Nagroda: +{riddle.reward.coins} monety
              </div>
              <button onClick={nextRiddle} className="primary" style={{ padding: '10px 16px', fontSize: '12px' }}>
                Następna ▶
              </button>
            </div>
          </Modal>
        );
      })()}

      {/* PROFILE & SAVE EXPORT / IMPORT MODAL (Section 18) */}
      {modal === 'profile' && (
        <Modal title="Profil i Zapis Gry" subtitle={`WERSJA SCHEMATU: ${SAVE_VERSION}`} onClose={closeModal}>
          <form onSubmit={e => { e.preventDefault(); commit({ ...gameRef.current, name: name.trim().slice(0, 20), avatar }); closeModal(); say('Postać zapisana!'); }}>
            <label className="field-label" htmlFor="player-name">Nazwa Twojej farmy:</label>
            <input id="player-name" autoComplete="nickname" maxLength={20} placeholder="Wpisz nazwę farmy lub imię" value={name} onChange={e => setName(e.target.value)} />
            <div className="avatar-choices">
              {['girl', 'boy'].map(a => (
                <button type="button" className={avatar === a ? 'chosen' : ''} key={a} aria-pressed={avatar === a} onClick={() => setAvatar(a)}>
                  <span className={`avatar-swatch ${a}`}><Icon name="leaf" size={28} /></span>
                  {a === 'girl' ? 'Dziewczynka' : 'Chłopiec'}
                  {avatar === a && <Icon name="check" size={17} />}
                </button>
              ))}
            </div>
            <button type="submit" className="primary full" style={{ marginBottom: '14px' }}>Zapisz postać <Icon name="arrow" size={20} /></button>
          </form>

          {/* Export / Import Safe Progression Tools */}
          <div style={{ background: '#f8faf6', border: '1.5px solid #dce8d6', borderRadius: '14px', padding: '12px 14px' }}>
            <h4 style={{ margin: '0 0 6px', fontSize: '13px', color: '#3f6349' }}>Kopia zapasowa postępów (Eksport / Import):</h4>
            <p style={{ margin: '0 0 10px', fontSize: '12px', color: '#6a8470', lineHeight: '1.4' }}>
              Możesz pobrać swój stan gry jako plik .json i wczytać go na innym telefonie lub komputerze.
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="secondary"
                style={{ fontSize: '12px', padding: '8px 12px' }}
                onClick={() => exportGameSave(game)}
              >
                Pobierz zapis (.json)
              </button>
              <button
                type="button"
                className="secondary"
                style={{ fontSize: '12px', padding: '8px 12px' }}
                onClick={() => fileInputRef.current?.click()}
              >
                Wczytaj plik zapisu
              </button>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept=".json,application/json"
                onChange={handleImportSave}
              />
            </div>
          </div>
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
      window.location.reload();
    }
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js', { updateViaCache: 'none' })
      .then((reg) => {
        reg.update().catch(() => {});

        window.addEventListener('focus', () => reg.update().catch(() => {}));
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            reg.update().catch(() => {});
          }
        });

        setInterval(() => reg.update().catch(() => {}), 5 * 60 * 1000);

        if (reg.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                newWorker.postMessage({ type: 'SKIP_WAITING' });
              }
            });
          }
        });
      })
      .catch(() => {});
  });
}

