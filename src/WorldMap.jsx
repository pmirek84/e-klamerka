import React from 'react';
import { Icon } from './icons.jsx';
import { REGIONS, unlocked } from './world/regions.js';

const positions = {
  farm: [50, 50],
  woodland: [18, 50],
  quarry: [50, 18],
  meadow: [82, 50],
  lake: [50, 82],
  clouds: [80, 18]
};

export function WorldMap({ game, current, position, onTravel, onOverview }) {
  const visited = game.world?.visited || ['farm'];
  const totalRegions = Object.keys(REGIONS).length;

  return (
    <div className="world-map-content">
      <p className="map-intro">
        Dotknij dowolnej krainy na mapie lub wybierz kierunek z listy poniżej, by wyruszyć na wyprawę przez most!
      </p>

      <div className="atlas" aria-label="Mapa Krain Świata">
        <svg className="atlas-routes" viewBox="0 0 600 400" aria-hidden="true">
          {/* Base dashed grid paths */}
          <path d="M110 200 H490 M300 70 V330 M300 200 L480 70" fill="none" stroke="#9db893" strokeWidth="5" strokeDasharray="4 8" strokeLinecap="round" opacity="0.6" />
          
          {/* Active built bridges */}
          <path d="M110 200 H300" stroke="#d5b882" strokeWidth="8" strokeLinecap="round" />
          {game.world?.quarry && <path d="M300 200 V70" stroke="#d5b882" strokeWidth="8" strokeLinecap="round" />}
          {game.world?.meadow && <path d="M300 200 H490" stroke="#d5b882" strokeWidth="8" strokeLinecap="round" />}
          {game.world?.lake && <path d="M300 200 V330" stroke="#d5b882" strokeWidth="8" strokeLinecap="round" />}
          {game.world?.clouds && <path d="M300 200 L480 70" stroke="#d5b882" strokeWidth="8" strokeLinecap="round" />}
        </svg>

        {Object.entries(REGIONS).map(([id, r]) => {
          const isUnlocked = unlocked(id, game);
          const isHere = current === id;
          const pos = positions[id] || [50, 50];

          return (
            <button
              key={id}
              data-region={id}
              className={`map-node ${isHere ? 'here' : ''} ${isUnlocked ? 'open' : 'locked'}`}
              style={{ left: `${pos[0]}%`, top: `${pos[1]}%`, '--island-color': r.color }}
              onClick={() => onTravel(isUnlocked ? r.destination : r.gate)}
            >
              <span className="map-island" style={{ background: r.color }}>
                <Icon name={r.icon} size={22} />
                {isHere && <i className="player-beacon" />}
              </span>
              <strong>{id === 'farm' ? 'Twoja farma' : r.name}</strong>
              <small>
                {isHere ? 'Jesteś tutaj' : !isUnlocked ? 'Zbuduj most' : visited.includes(id) ? 'Odkryto' : 'Czeka na odkrycie'}
              </small>
            </button>
          );
        })}
      </div>

      <div className="map-meta">
        <span>
          <Icon name="compass" size={17} /> Odkryte krainy: <b>{visited.length}/{totalRegions}</b>
        </span>
        <button className="overview-btn" onClick={onOverview}>
          Obejrzyj cały świat 3D <Icon name="arrow" size={15} />
        </button>
      </div>

      <div className="region-cards">
        {Object.entries(REGIONS).filter(([id]) => id !== 'farm').map(([id, r]) => {
          const isUnlocked = unlocked(id, game);
          return (
            <article key={id} className={`region-card ${isUnlocked ? 'unlocked' : 'locked'}`}>
              <div className="region-card-top">
                <span className="region-mark" style={{ background: r.color }}>
                  <Icon name={r.icon} size={26} />
                </span>
                <div className="region-info">
                  <div className="region-status-badge">
                    {isUnlocked ? '✓ Odkryta kraina' : '🔒 Wymaga mostu'}
                  </div>
                  <h3>{r.name}</h3>
                  <p>{r.subtitle}</p>
                </div>
              </div>

              {!isUnlocked && r.cost && (
                <div className="map-price">
                  <span className="price-label">Potrzebne na budowę mostu:</span>
                  <div className="price-tags-wrap">
                    {Object.entries(r.cost).map(([k, n]) => {
                      const currentAmount = game[k] || 0;
                      const hasEnough = currentAmount >= n;
                      return (
                        <span key={k} className={`price-tag ${hasEnough ? 'ready' : 'missing'}`}>
                          <Icon name={k === 'crystals' ? 'crystal' : k} size={14} />
                          <span>{currentAmount}/{n}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              <button
                className={`region-action-btn ${isUnlocked ? 'primary' : 'secondary'}`}
                onClick={() => onTravel(isUnlocked ? r.destination : r.gate)}
              >
                <span>{isUnlocked ? 'Wyrusz do krainy' : 'Przejdź do budowy mostu'}</span>
                <Icon name="arrow" size={15} />
              </button>
            </article>
          );
        })}
      </div>

      <p className="modal-footnote">
        Wszystkie krainy są połączone mostami i traktami w Twoim świecie 3D.
      </p>
    </div>
  );
}
