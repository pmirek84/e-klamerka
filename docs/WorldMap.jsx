import React from 'react';
import {Icon} from './icons.jsx';
import {REGIONS,unlocked} from './world/regions.js';
const positions={farm:[50,65],woodland:[17,65],quarry:[50,21],meadow:[83,65]};
export function WorldMap({game,current,position,onTravel,onOverview}){
  const visited=game.world?.visited||['farm'];
  return <div className="world-map-content"><p className="map-intro">Wybierz kierunek. Postać dotrze na miejsce ścieżką i mostem. Pierwszy las jest już dostępny!</p>
    <div className="atlas" aria-label="Mapa czterech wysp">
      <svg className="atlas-routes" viewBox="0 0 640 360" aria-hidden="true"><path d="M109 234H320V76M320 234H531" fill="none" stroke="#8d9f85" strokeWidth="8" strokeDasharray="3 10" strokeLinecap="round"/><path d="M109 234H320" stroke="#ddc59a" strokeWidth="10"/>{game.world?.quarry&&<path d="M320 234V76" stroke="#ddc59a" strokeWidth="10"/>}{game.world?.meadow&&<path d="M320 234H531" stroke="#ddc59a" strokeWidth="10"/>}</svg>
      {Object.entries(REGIONS).map(([id,r])=><button key={id} data-region={id} className={`map-node ${current===id?'here':''} ${unlocked(id,game)?'open':'locked'}`} style={{left:`${positions[id][0]}%`,top:`${positions[id][1]}%`,'--island-color':r.color}} onClick={()=>onTravel(unlocked(id,game)?r.destination:r.gate)}><span className="map-island"><Icon name={r.icon} size={28}/>{current===id&&<i/>}</span><strong>{id==='farm'?'Twoja farma':r.name}</strong><small>{current===id?'Jesteś tutaj':!unlocked(id,game)?'Napraw most':visited.includes(id)?'Odkryto':'Czeka na odkrycie'}</small></button>)}
    </div>
    <div className="map-meta"><span><Icon name="compass" size={17}/> Odkryte wyspy: {visited.length}/4</span><button onClick={onOverview}>Obejrzyj cały świat <Icon name="arrow" size={16}/></button></div>
    <div className="region-cards">{Object.entries(REGIONS).filter(([id])=>id!=='farm').map(([id,r])=><article key={id}><span className="region-mark" style={{background:r.color}}><Icon name={r.icon}/></span><div><h3>{r.name}</h3><p>{r.subtitle}</p>{!unlocked(id,game)&&<div className="map-price">{Object.entries(r.cost).map(([k,n])=><span key={k}><Icon name={k==='crystals'?'crystal':k} size={14}/>{n}</span>)}</div>}</div><button onClick={()=>onTravel(unlocked(id,game)?r.destination:r.gate)}>{unlocked(id,game)?'Wyrusz':'Do mostu'}<Icon name="arrow" size={15}/></button></article>)}</div>
    <p className="modal-footnote">To Twój świat zapisany na tym urządzeniu. Inne farmy i wspólne wioski powstaną w kolejnym etapie.</p>
  </div>;
}
