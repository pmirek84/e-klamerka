import React from 'react';
const paths={
 wood:<><path d="m6 7 11-3 3 13-11 3Z" fill="#c88f58"/><ellipse cx="7" cy="13.5" rx="3.5" ry="6.5" fill="#edc58c" transform="rotate(-12 7 13.5)"/><path d="m12 7 1 6m3-6 1 8M6 11l1 5"/></>,
 stone:<><path d="m3 15 4-9 9-2 5 9-3 7H7Z" fill="#abb9b9"/><path d="m7 6 5 8 9-1M3 15l9-1 6 6"/></>,
 carrot:<><path d="M14 7c-7-3-10 7-11 14 6-2 16-7 11-14Z" fill="#eda45d"/><path d="m13 8 2-6m-1 6 6-5m-6 6 7-1M7 14l2 2m0-6 2 2"/></>,
 coins:<><circle cx="12" cy="12" r="9" fill="#f2cd70"/><circle cx="12" cy="12" r="6"/><path d="M12 8v8m-2-7h3m-3 6h3"/></>,
 seeds:<><path d="M6 5h12l2 15H4Z" fill="#dfc291"/><path d="M6 5V2h12v3M12 17v-5m0 2c-4 0-5-4-5-4 4 0 5 2 5 4Zm0-2c0-3 4-4 4-4s0 4-4 4Z"/></>,
 rabbit:<><path d="M8 11C-1-6 10-3 10 9m4 0c0-12 11-13 3 2" fill="#ede4d7"/><path d="M4 15c0-5 16-5 16 0s-4 7-8 7-8-2-8-7Z" fill="#f9f0dc"/><path d="M8 15h.01M16 15h.01m-5 3h2"/></>,
 house:<><path d="M5 10h14v11H5Z" fill="#f6e7c1"/><path d="m2 11 10-9 10 9Z" fill="#5a9096"/><path d="M10 21v-7h4v7m-7-8h.1M17 13h.1"/></>,
 shop:<><path d="M4 10v11h16V10M3 4h18l1 6H2Z" fill="#e6b38b"/><path d="M3 10c0 4 6 4 6 0 0 4 6 4 6 0 0 4 6 4 6 0M9 21v-6h6v6M8 4l-1 6m9-6 1 6"/></>,
 land:<><path d="m2 9 10-5 10 5-10 5Z" fill="#b9ce91"/><path d="m2 14 10 5 10-5m-10 5v-5M18 2v5m-2-2h4"/></>,
 close:<path d="m6 6 12 12M6 18 18 6"/>,
 arrow:<path d="M4 12h16m-6-6 6 6-6 6"/>,
 compass:<><circle cx="12" cy="12" r="9"/><path d="m16 7-3 7-6 3 3-7Z" fill="#8baf87"/></>,
 plus:<path d="M5 12h14M12 5v14"/>,minus:<path d="M5 12h14"/>,
 rotate:<><path d="M4 8a8 8 0 1 1-1 7m1-12v5h5"/></>,
 check:<path d="m5 12 4 4L19 6"/>,
 leaf:<><path d="M19 3C2 2 1 20 9 19S21 13 19 3Z" fill="#c3d498"/><path d="m5 22 10-13"/></>,
 peg:<><path d="m6 3 5-1 1 8 1-8 5 1-3 18h-3l-1-7-1 7H7Z" fill="#e5b977"/><path d="M6 10h11m-10 3h9"/></>,
 sound:<><path d="m3 9 5 0 6-5v16l-6-5H3Zm14-2c4 2 4 8 0 10"/></>,
};
export function Icon({name,size=24,...props}){return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]||paths.leaf}</svg>;}
