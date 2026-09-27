import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createWorld } from './world/scene.js';
import { loadGame, SAVE_KEY, transact, PLACES, actionFor } from './game.js';
import { Icon } from './icons.jsx';
import './style.css';
import { WorldMap } from './WorldMap.jsx';
import { REGIONS } from './world/regions.js';
const resourceNames={wood:'drewno',stone:'kamień',carrots:'marchewki',coins:'monety',seeds:'nasionka',crystals:'kryształy'};
const resourceIcons={wood:'wood',stone:'stone',carrots:'carrot',coins:'coins',seeds:'seeds',crystals:'crystal'};
function Resources({state,all=false}){return <div className="resources" aria-label="Zasoby">{(all?['wood','stone','carrots','coins','seeds','crystals']:['wood','stone','carrots','coins',...(state.world?.quarry||state.crystals?['crystals']:[])]).map(k=><span className={`resource ${k}`} key={k} title={resourceNames[k]}><Icon name={resourceIcons[k]} size={23}/><b data-resource={k}>{state[k]}</b><span className="sr-only"> {resourceNames[k]}</span></span>)}</div>;}
function Cost({cost,state}){return cost&&<span className="cost">{Object.entries(cost).map(([k,n])=><span className={state[k]<n?'missing':''} key={k}><Icon name={resourceIcons[k]} size={18}/>{n}</span>)}</span>;}
function Modal({title,subtitle,children,onClose}){
  const ref=useRef(null);
  useEffect(()=>{const prior=document.activeElement;ref.current?.querySelector('button,input')?.focus();const handler=e=>{if(e.key==='Escape')onClose();if(e.key==='Tab'){const items=[...ref.current.querySelectorAll('button:not(:disabled),input')];const first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}};document.addEventListener('keydown',handler);return()=>{document.removeEventListener('keydown',handler);prior?.focus();};},[onClose]);
  return <div className="veil" onPointerDown={e=>{if(e.target===e.currentTarget)onClose();}}><section ref={ref} className="modal" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><header><div><span className="eyebrow">{subtitle}</span><h2 id="dialog-title">{title}</h2></div><button className="round" onClick={onClose} aria-label="Zamknij"><Icon name="close"/></button></header>{children}</section></div>;
}
function App(){
  const [game,setGame]=useState(loadGame),gameRef=useRef(game),worldRef=useRef(null),hostRef=useRef(null),actionRef=useRef(()=>{});
  const [frame,setFrame]=useState({near:null,moving:false,busy:false,labels:{}}),[selected,setSelected]=useState(null),[modal,setModal]=useState(null),[notice,setNotice]=useState(null),[shopMessage,setShopMessage]=useState(''),[ready,setReady]=useState(false),[error,setError]=useState(''),[now,setNow]=useState(Date.now()),[name,setName]=useState(game.name),[avatar,setAvatar]=useState(game.avatar),[storageWarning,setStorageWarning]=useState(false);
  const toastTimer=useRef(),tickRef=useRef(),visitRef=useRef(()=>{});
  const say=useCallback((message,ok=true)=>{if(!message)return;setNotice({message,ok});clearTimeout(toastTimer.current);toastTimer.current=setTimeout(()=>setNotice(null),3800);},[]);
  function commit(next){gameRef.current=next;setGame(next);try{localStorage.setItem(SAVE_KEY,JSON.stringify(next));}catch{setStorageWarning(true);}worldRef.current?.setGame(next);}
  const perform=useCallback((action)=>{const result=transact(gameRef.current,action);if(result.ok)commit(result.state);if(action.startsWith('buy')||action.startsWith('sell'))setShopMessage(result.message);say(result.message,result.ok);return result;},[say]);
  useEffect(()=>{
    let world;
    try {world=createWorld(hostRef.current,{onSelect:setSelected,onFrame:setFrame,onRegion:id=>visitRef.current(id),onAction:()=>actionRef.current()});worldRef.current=world;world.setGame(gameRef.current);setReady(true);if(import.meta.env.DEV)window.__farm={inspect:()=>world.inspect(),state:()=>gameRef.current};}
    catch(e){console.error(e);setError('Nie udało się uruchomić grafiki 3D. Otwórz grę w aktualnej przeglądarce Chrome, Safari lub Firefox.');}
    return()=>{world?.destroy();delete window.__farm;clearTimeout(toastTimer.current);};
  },[]);
  useEffect(()=>{tickRef.current=setInterval(()=>{const t=Date.now();setNow(t);const result=transact(gameRef.current,'tick',t);if(result.ok){commit(result.state);say(result.message);}},1000);return()=>clearInterval(tickRef.current);},[say]);
  useEffect(()=>{worldRef.current?.pause(!!modal);},[modal]);
  const active=frame.near || selected,place=PLACES[active],task=actionFor(active,game),canAct=frame.near===active;
  function interact(){
    if(!canAct||frame.busy||modal||task?.disabled)return;
    if(task.action.startsWith('travel:')){worldRef.current?.select(task.action.split(':')[1]);return;}
    if(task.action==='shop'){setShopMessage('');setModal('shop');return;}
    const result=perform(task.action);if(result.ok)worldRef.current?.animateAction(task.action);
  }
  actionRef.current=interact;
  visitRef.current=id=>{if(id!=='farm')perform(`visit:${id}`);};
  const closeModal=useCallback(()=>setModal(null),[]);
  const quest=!game.houseLevel?{title:'Każda przygoda zaczyna się od domu',text:'Zbierz drewno i kamień. Zbuduj swoje miejsce.',target:'house',progress:Math.min(game.wood/6,1)*.5+Math.min(game.stone/5,1)*.5}:!game.pen?{title:'Miejsce dla małych przyjaciół',text:'Zbuduj zagrodę dla Bezucha i Karmelki.',target:'pen',progress:.5}:!game.babies?{title:'Niech rośnie królicza rodzinka',text:game.nextBirthAt?'Nakarmione króliczki czekają na maluszka.':'Wyhoduj marchewki i nakarm króliczki.',target:'pen',progress:.7}:{title:'Mała farma, wielkie plany',text:'Rozbuduj dom lub odkryj nową polanę.',target:'land',progress:Math.min(1,(game.houseLevel+game.landLevel)/6)};
  const currentRegion=frame.region||'farm';
  const worldQuest=currentRegion!=='farm'?{title:REGIONS[currentRegion].name,text:REGIONS[currentRegion].subtitle,target:REGIONS[currentRegion].destination,progress:(game.world?.visited?.length||1)/4}:game.houseLevel&&game.pen?{title:'Za mostem czeka przygoda',text:'Odkryj las, kryształowe wzgórza i słoneczną łąkę.',target:!game.world?.visited?.includes('woodland')?'grove':!game.world?.quarry?'quarryGate':!game.world?.meadow?'meadowGate':'windmill',progress:(game.world?.visited?.length||1)/4}:quest;
  const remaining=game.nextBirthAt?Math.max(0,Math.ceil((game.nextBirthAt-now)/1000)):0;
  return <main className="game-shell">
    <div className="world" ref={hostRef}/>
    <div className="vignette"/>
    <header className="hud">
      <button className="identity" onClick={()=>{setName(game.name);setAvatar(game.avatar);setModal('profile');}} aria-label="Zmień imię i postać"><span className="brand-mark"><Icon name="peg" size={29}/></span><span><small>e-klamerka</small><strong>{game.name?`Farma · ${game.name}`:'Twoja mała farma'}<span className="edit-dot">✎</span></strong></span></button>
      <Resources state={game}/>
      <div className="header-actions"><button className="map-shortcut" aria-label="Otwórz mapę świata" onClick={()=>setModal('map')}><Icon name="map"/><span>Mapa świata</span></button><button className="shop-shortcut" onClick={()=>worldRef.current?.select('shop')}><Icon name="shop"/><span>Do sklepiku</span><Icon name="arrow" size={16}/></button></div>
    </header>
    <aside className="quest-card"><span className="eyebrow"><span className="sun-dot"/> SŁONECZNY PORANEK</span><h1>{worldQuest.title}</h1><p>{worldQuest.text}</p><button className="quest-link" onClick={()=>worldRef.current?.select(worldQuest.target)}>Prowadź mnie <Icon name="arrow" size={16}/></button><div className="quest-progress"><i style={{width:`${worldQuest.progress*100}%`}}/></div></aside>
    {!modal&&<div className="travel-tools"><button onClick={()=>worldRef.current?.returnHome()}><Icon name="house" size={16}/> Do domu</button>{frame.moving&&<button onClick={()=>worldRef.current?.stop()}>Zatrzymaj</button>}</div>}
    {ready&&!modal&&<div className="world-labels">{Object.entries(frame.labels).map(([id,p])=>p.visible&&<button key={id} className={`place-label ${selected===id||frame.near===id?'selected':''}`} style={{left:p.x,top:p.y}} onClick={()=>worldRef.current?.select(id)} data-place={id}><span className="label-dot"/>{PLACES[id].short}{id==='pen'&&game.babies>0&&<b>{game.babies}</b>}</button>)}</div>}
    {game.nextBirthAt&&<div className="nursery"><Icon name="rabbit" size={20}/><span>Maluszek za <b>{remaining}s</b></span></div>}
    {notice&&!modal&&<div className={`toast ${!notice.ok?'warning':''}`} role="status"><Icon name={notice.ok?'check':'leaf'} size={20}/>{notice.message}</div>}
    <div className="bottom-hud">
      <div className="movement"><span className="keyboard-hint"><kbd>W</kbd><span><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></span><small>lub kliknij ścieżkę</small></span><span className="gesture-hint"><Icon name="touch" size={23}/><strong>Dotknij lub prowadź palcem</strong><small>Dwa palce: obrót i przybliżenie</small></span></div>
      {place&&task?<section className="action-card"><div className="action-symbol"><Icon name={task.icon} size={27}/></div><div className="action-copy"><span className="eyebrow">{canAct?'JESTEŚ NA MIEJSCU':frame.moving?'W DRODZE':'TWÓJ CEL'}</span><h2>{place.title}</h2><p>{task.hint}</p><Cost cost={task.cost} state={game}/></div><button className="primary action" onClick={canAct?interact:()=>worldRef.current?.select(active)} disabled={canAct&&(frame.busy||task.disabled)}>{canAct?frame.busy?'Chwileczkę…':task.label:'Podejdź'}<Icon name={canAct?'check':'arrow'} size={19}/></button></section>:<div className="welcome-hint"><span className="hint-spark">✧</span><strong>Twój mały świat. Twoje wielkie plany.</strong><span>Dotknij ścieżki lub poprowadź postać palcem.</span></div>}
      <nav className="camera-controls" aria-label="Sterowanie kamerą"><button title="Pokaż całą farmę" aria-label="Pokaż całą farmę" onClick={()=>worldRef.current?.home()}><Icon name="compass"/></button><button title="Obróć kamerę" aria-label="Obróć kamerę" onClick={()=>worldRef.current?.turn(Math.PI/4)}><Icon name="rotate"/></button><button title="Przybliż" aria-label="Przybliż" onClick={()=>worldRef.current?.zoom(-.12)}><Icon name="plus"/></button><button title="Oddal" aria-label="Oddal" onClick={()=>worldRef.current?.zoom(.12)}><Icon name="minus"/></button></nav>
    </div>
    <div className="world-caption"><Icon name="leaf" size={15}/><span>{REGIONS[currentRegion].name.toLocaleUpperCase('pl')}</span><span className="saved-dot"/>{storageWarning?'Zapis niedostępny':'Zapis na tym urządzeniu'}</div>
    {!ready&&<div className="loading"><Icon name="peg" size={44}/><h2>{error?'Nie można otworzyć polany':'Otwieramy Twoją polanę…'}</h2><p>{error||'Za chwilę zacznie się mała wielka przygoda.'}</p></div>}
    {modal==='map'&&<Modal title="Świat za klamerką" subtitle="MAŁA FARMA, WIELKIE WYPRAWY" onClose={closeModal}><WorldMap game={game} current={currentRegion} position={frame.position} onTravel={id=>{closeModal();worldRef.current?.select(id);}} onOverview={()=>{closeModal();worldRef.current?.worldView();}}/></Modal>}
    {modal==='shop'&&<Modal title="Sklepik pod klamerką" subtitle="DOBRZE CIĘ WIDZIEĆ" onClose={closeModal}><Resources state={game} all/><div className="shop-feedback" role="status">{shopMessage||'Wybierz coś dla swojej farmy.'}</div><div className="shop-items">
      {[{action:'sell-crystal',icon:'crystal',title:'Kryształ ze wzgórz',desc:'Zachowaj część kryształów na most i wiatrak',label:'Sprzedaj · +4',available:game.crystals>0},{action:'buy-seeds',icon:'seeds',title:'Paczuszka nasion',desc:'Jedno sadzenie · co najmniej 3 marchewki',label:'Kup · 2',available:game.coins>=2},{action:'buy-carrots',icon:'carrot',title:'Dwie marchewki',desc:'Pyszny posiłek dla króliczej pary',label:'Kup · 3',available:game.coins>=3},{action:'sell-wood',icon:'wood',title:'Sprzedaj 2 drewna',desc:'Las zawsze ma coś w zapasie',label:'Sprzedaj · +2',available:game.wood>=2},{action:'sell-stone',icon:'stone',title:'Sprzedaj 2 kamienie',desc:'Zamień zapasy na nowe możliwości',label:'Sprzedaj · +2',available:game.stone>=2},{action:'sell-baby',icon:'rabbit',title:'Nowy dom dla maluszka',desc:`Masz ${game.babies} małych króliczków. Bezuch i Karmelka zostają z Tobą.`,label:'Sprzedaj · +5',available:game.babies>0}].map(item=><article key={item.action}><span className={`product-icon ${item.icon}`}><Icon name={item.icon} size={32}/></span><div><h3>{item.title}</h3><p>{item.desc}</p></div><button data-action={item.action} disabled={!item.available} onClick={()=>perform(item.action)}>{item.label}<Icon name="coins" size={17}/></button></article>)}
    </div><p className="modal-footnote">Każda wymiana od razu zmienia Twój plecak i zapis gry.</p></Modal>}
    {modal==='profile'&&<Modal title="To Twoja przygoda" subtitle="POZNAJMY SIĘ" onClose={closeModal}><form onSubmit={e=>{e.preventDefault();commit({...gameRef.current,name:name.trim().slice(0,20),avatar});closeModal();say('Gotowe. Ruszamy na polanę!');}}><label className="field-label" htmlFor="player-name">Jak nazwiemy Twoją postać?</label><input id="player-name" autoComplete="nickname" maxLength={20} placeholder="Wpisz imię" value={name} onChange={e=>setName(e.target.value)}/><div className="avatar-choices">{['girl','boy'].map(a=><button type="button" className={avatar===a?'chosen':''} key={a} aria-pressed={avatar===a} onClick={()=>setAvatar(a)}><span className={`avatar-swatch ${a}`}><Icon name="leaf" size={30}/></span>{a==='girl'?'Dziewczyna':'Chłopiec'}{avatar===a&&<Icon name="check" size={17}/>}</button>)}</div><button type="submit" className="primary full">Ruszajmy!<Icon name="arrow" size={20}/></button></form><p className="modal-footnote">Postęp zostaje w tej przeglądarce. Konta i wspólne wioski to kolejny etap.</p></Modal>}
  </main>;
}
createRoot(document.getElementById('root')).render(<App/>);

if(import.meta.env.PROD && 'serviceWorker' in navigator){
  let reloading=false;
  const alreadyControlled=!!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(alreadyControlled&&!reloading){reloading=true;location.reload();}});
  window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).then(r=>r.update()).catch(()=>{}));
}
