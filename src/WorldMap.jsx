import React from 'react';
import { Icon } from './icons.jsx';
import { REGIONS, unlocked } from './world/regions.js';

const positions = {
  farm: [50, 50],
  woodland: [18, 50],
  quarry: [50, 18],
  meadow: [82, 50],
  lake: [50, 82],
  clouds: [80, 18],
  // New planned quadrants in compass rose:
  springs: [18, 18],
  lavender: [18, 82],
  mushrooms: [82, 82],
  peaks: [50, 5]
};

export function WorldMap({ game, current, position, onTravel, onOverview }) {
  const visited = game.world?.visited || ['farm'];
  const activeRegions = Object.entries(REGIONS).filter(([id, r]) => id !== 'farm' && !r.upcoming);
  const upcomingRegions = Object.entries(REGIONS).filter(([, r]) => r.upcoming);
  const activeCount = Object.keys(REGIONS).filter(id => !REGIONS[id].upcoming).length;

  return (
    <div className="world-map-content">
      <p className="map-intro">
        Dotknij dowolnej krainy na mapie lub wybierz kierunek z listy poniżej, by wyruszyć na wyprawę przez most!
      </p>

      <div className="atlas" aria-label="Mapa Krain Świata">
        <svg className="atlas-routes" viewBox="0 0 600 400" aria-hidden="true">
          {/* Base dashed grid paths */}
          <path d="M110 200 H490 M300 70 V330 M300 200 L480 70" fill="none" stroke="#9db893" strokeWidth="5" strokeDasharray="4 8" strokeLinecap="round" opacity="0.6" />
          
          {/* Future exploration dashed paths */}
          <path d="M110 200 L110 70 M110 200 L110 330 M490 200 L490 330 M300 70 V20" fill="none" stroke="#baa6dc" strokeWidth="3" strokeDasharray="3 6" strokeLinecap="round" opacity="0.75" />

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
              className={`map-node ${isHere ? 'here' : ''} ${r.upcoming ? 'upcoming-node' : isUnlocked ? 'open' : 'locked'}`}
              style={{ left: `${pos[0]}%`, top: `${pos[1]}%`, '--island-color': r.color }}
              onClick={() => {
                if (r.upcoming) return;
                onTravel(isUnlocked ? r.destination : r.gate);
              }}
              title={r.upcoming ? `Wkrótce: ${r.name}` : r.name}
            >
              <span className="map-island" style={{ background: r.color }}>
                <Icon name={r.icon} size={22} />
                {isHere && <i className="player-beacon" />}
                {r.upcoming && <span className="upcoming-spark">✧</span>}
              </span>
              <strong>{id === 'farm' ? 'Twoja farma' : r.name}</strong>
              <small>
                {r.upcoming ? 'Wkrótce 🧭' : isHere ? 'Jesteś tutaj' : !isUnlocked ? 'Zbuduj most' : visited.includes(id) ? 'Odkryto' : 'Czeka na odkrycie'}
              </small>
            </button>
          );
        })}
      </div>

      <div className="map-meta">
        <span>
          <Icon name="compass" size={17} /> Odkryte krainy: <b>{visited.length}/{activeCount}</b>
          <span style={{ fontSize: '11px', color: '#7a5a9c', marginLeft: '8px', fontWeight: 700 }}>
            (+{upcomingRegions.length} nowe horyzonty)
          </span>
        </span>
        <button className="overview-btn" onClick={onOverview}>
          Obejrzyj cały świat 3D <Icon name="arrow" size={15} />
        </button>
      </div>

      {/* SECTION: CURRENT ACCESSIBLE REGIONS */}
      <div className="inventory-section-title" style={{ marginTop: '12px', color: '#4a7558' }}>
        <Icon name="leaf" size={16} /> Dostępne krainy i szlaki ({activeRegions.length}):
      </div>
      <div className="region-cards">
        {activeRegions.map(([id, r]) => {
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

      {/* SECTION: UPCOMING PLANNED REGIONS */}
      <div className="inventory-section-title" style={{ marginTop: '24px', color: '#7a5a9c' }}>
        <Icon name="star" size={16} /> Nowe horyzonty · Planowane krainy ({upcomingRegions.length}):
      </div>
      <div className="region-cards">
        {upcomingRegions.map(([id, r]) => (
          <article key={id} className="region-card upcoming-card">
            <div className="region-card-top">
              <span className="region-mark" style={{ background: r.color }}>
                <Icon name={r.icon} size={26} />
              </span>
              <div className="region-info">
                <div className="region-status-badge upcoming">
                  ✨ NOWY HORYZONT · W PRZYGOTOWANIU
                </div>
                <h3>{r.name}</h3>
                <p>{r.subtitle}</p>
                {r.preview && (
                  <div className="upcoming-preview-box">
                    „{r.preview}”
                  </div>
                )}
              </div>
            </div>

            {r.cost && (
              <div className="map-price upcoming-price">
                <span className="price-label">Przewidywane zapasy na przyszły most:</span>
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
              className="secondary region-action-btn upcoming-btn"
              disabled
            >
              <Icon name="compass" size={15} />
              <span>Szlak w trakcie badania przez zwiadowców</span>
            </button>
          </article>
        ))}
      </div>

      <p className="modal-footnote">
        Wszystkie krainy są połączone mostami i traktami w Twoim świecie 3D.
      </p>
    </div>
  );
}
