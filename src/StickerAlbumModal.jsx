import React from 'react';
import { STICKERS } from './game.js';
import { Icon } from './icons.jsx';

export function StickerAlbumModal({ game, onClaim, onClose }) {
  const claimed = game.stickersClaimed || [];
  const claimedCount = claimed.length;
  const totalCount = STICKERS.length;
  const progressPct = Math.round((claimedCount / totalCount) * 100);

  return (
    <div className="sticker-album-content">
      <div className="album-hero">
        <div className="album-badge-icon">
          <span>📖</span>
        </div>
        <div className="album-hero-text">
          <p className="album-subtitle">
            Odkrywaj sekrety krain, zbieraj plony, opiekuj się zwierzętami i zdobywaj naklejki do swojej pamiątkowej księgi!
          </p>
          <div className="album-progress-wrap">
            <div className="album-progress-bar">
              <div className="album-progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
            <span className="album-progress-label">
              Zdobyte odznaki: <strong>{claimedCount} / {totalCount}</strong> ({progressPct}%)
            </span>
          </div>
        </div>
      </div>

      <div className="stickers-grid" role="list" aria-label="Lista naklejek osiągnięć">
        {STICKERS.map((st, idx) => {
          const isClaimed = claimed.includes(st.id);
          const isEligible = !isClaimed && st.check(game);

          return (
            <div
              key={st.id}
              className={`sticker-card ${isClaimed ? 'is-claimed' : isEligible ? 'is-ready' : 'is-locked'}`}
              style={{ animationDelay: `${idx * 0.05}s` }}
              role="listitem"
            >
              {/* Stamp scalloped border aesthetic */}
              <div className="sticker-stamp-inner">
                <div className="sticker-stamp-top">
                  <div className="sticker-icon-frame">
                    <span className="sticker-emoji" role="img" aria-label={st.title}>
                      {isClaimed || isEligible ? st.icon : '🔒'}
                    </span>
                  </div>
                  {isClaimed && (
                    <span className="sticker-claimed-badge" title="Wklejona do księgi">
                      <Icon name="check" size={14} /> Wklejona
                    </span>
                  )}
                </div>

                <div className="sticker-info">
                  <h4 className="sticker-title">{st.title}</h4>
                  <p className="sticker-desc">{st.desc}</p>
                </div>

                <div className="sticker-footer">
                  {isClaimed ? (
                    <div className="sticker-status-tag claimed">
                      <span>⭐ Nagroda odebrana (+{st.reward?.coins || 0} 🪙)</span>
                    </div>
                  ) : isEligible ? (
                    <button
                      type="button"
                      className="sticker-claim-btn"
                      onClick={() => onClaim(st.id)}
                    >
                      <span>Wklej naklejkę! ✨</span>
                      <strong className="reward-tag">+{st.reward?.coins} 🪙</strong>
                    </button>
                  ) : (
                    <div className="sticker-status-tag locked">
                      <span>Nagroda: {st.reward?.coins} monet 🪙</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
