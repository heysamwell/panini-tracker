import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import QRCode from "qrcode";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://nvllmcwwektkvgbargzh.supabase.co";
const SUPABASE_KEY = "sb_publishable_XPfvLzBKz-L_JEKfmw1pIw_aShQ3Ewf";
let supabase = null;
try { supabase = createClient(SUPABASE_URL, SUPABASE_KEY); } catch(e) { console.warn("Supabase init failed", e); }

// Inline SVG icons — no external dependency needed
const IconBook    = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>;
const IconBar     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
const IconCopy    = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
const IconCircle  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 2"><circle cx="12" cy="12" r="10"/></svg>;
const IconArrows  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>;
const IconGear = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;

// Load Inter + Bebas Neue from Google Fonts
if (typeof document !== "undefined" && !document.getElementById("app-fonts")) {
  const link = document.createElement("link");
  link.id = "app-fonts";
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700;800;900&display=swap";
  document.head.appendChild(link);
}

const DISPLAY = "'Bebas Neue', Impact, sans-serif";
const BODY    = "'Inter', system-ui, sans-serif";

// ── Album data ────────────────────────────────────────────────────────────────
const GROUPS = [
  { id:"A", teams:[{code:"MEX",name:"Mexico",flag:"🇲🇽"},{code:"RSA",name:"South Africa",flag:"🇿🇦"},{code:"KOR",name:"Korea Republic",flag:"🇰🇷"},{code:"CZE",name:"Czechia",flag:"🇨🇿"}] },
  { id:"B", teams:[{code:"CAN",name:"Canada",flag:"🇨🇦"},{code:"BIH",name:"Bosnia-Herzegovina",flag:"🇧🇦"},{code:"QAT",name:"Qatar",flag:"🇶🇦"},{code:"SUI",name:"Switzerland",flag:"🇨🇭"}] },
  { id:"C", teams:[{code:"BRA",name:"Brazil",flag:"🇧🇷"},{code:"MAR",name:"Morocco",flag:"🇲🇦"},{code:"HAI",name:"Haiti",flag:"🇭🇹"},{code:"SCO",name:"Scotland",flag:"🏴󠁧󠁢󠁳󠁣󠁴󠁿"}] },
  { id:"D", teams:[{code:"USA",name:"USA",flag:"🇺🇸"},{code:"PAR",name:"Paraguay",flag:"🇵🇾"},{code:"AUS",name:"Australia",flag:"🇦🇺"},{code:"TUR",name:"Türkiye",flag:"🇹🇷"}] },
  { id:"E", teams:[{code:"GER",name:"Germany",flag:"🇩🇪"},{code:"CUW",name:"Curaçao",flag:"🇨🇼"},{code:"CIV",name:"Côte d'Ivoire",flag:"🇨🇮"},{code:"ECU",name:"Ecuador",flag:"🇪🇨"}] },
  { id:"F", teams:[{code:"NED",name:"Netherlands",flag:"🇳🇱"},{code:"JPN",name:"Japan",flag:"🇯🇵"},{code:"SWE",name:"Sweden",flag:"🇸🇪"},{code:"TUN",name:"Tunisia",flag:"🇹🇳"}] },
  { id:"G", teams:[{code:"BEL",name:"Belgium",flag:"🇧🇪"},{code:"EGV",name:"Egypt",flag:"🇪🇬"},{code:"IRN",name:"IR Iran",flag:"🇮🇷"},{code:"NZL",name:"New Zealand",flag:"🇳🇿"}] },
  { id:"H", teams:[{code:"ESP",name:"Spain",flag:"🇪🇸"},{code:"CPV",name:"Cabo Verde",flag:"🇨🇻"},{code:"KSA",name:"Saudi Arabia",flag:"🇸🇦"},{code:"URU",name:"Uruguay",flag:"🇺🇾"}] },
  { id:"I", teams:[{code:"FRA",name:"France",flag:"🇫🇷"},{code:"SEN",name:"Senegal",flag:"🇸🇳"},{code:"IRQ",name:"Iraq",flag:"🇮🇶"},{code:"NOR",name:"Norway",flag:"🇳🇴"}] },
  { id:"J", teams:[{code:"ARG",name:"Argentina",flag:"🇦🇷"},{code:"ALG",name:"Algeria",flag:"🇩🇿"},{code:"AUT",name:"Austria",flag:"🇦🇹"},{code:"JOR",name:"Jordan",flag:"🇯🇴"}] },
  { id:"K", teams:[{code:"POR",name:"Portugal",flag:"🇵🇹"},{code:"COD",name:"Congo DR",flag:"🇨🇩"},{code:"UZB",name:"Uzbekistan",flag:"🇺🇿"},{code:"COL",name:"Colombia",flag:"🇨🇴"}] },
  { id:"L", teams:[{code:"ENG",name:"England",flag:"🏴󠁧󠁢󠁥󠁮󠁧󠁿"},{code:"CRO",name:"Croatia",flag:"🇭🇷"},{code:"GHA",name:"Ghana",flag:"🇬🇭"},{code:"PAN",name:"Panama",flag:"🇵🇦"}] },
];
const GROUP_COLORS = { A:"#22c55e",B:"#3b82f6",C:"#f59e0b",D:"#a855f7",E:"#ef4444",F:"#06b6d4",G:"#eab308",H:"#ec4899",I:"#10b981",J:"#f97316",K:"#6366f1",L:"#84cc16" };

const buildAlbum = () => {
  const secs = [];
  secs.push({ key:"FWCI", name:"FWC · Intro", flag:"🌍", group:null, color:"#e8c84a", special:"fwc",
    stickers: Array.from({length:9},(_,i)=>({id:`FWC${i}`,num:i})) });
  secs.push({ key:"FWCH", name:"FWC · Historia", flag:"🏆", group:null, color:"#e8c84a", special:"fwc",
    stickers: Array.from({length:11},(_,i)=>({id:`FWC${i+9}`,num:i+9})) });
  GROUPS.forEach(g => g.teams.forEach(t =>
    secs.push({ key:t.code, name:t.name, flag:t.flag, group:g.id, color:GROUP_COLORS[g.id],
      stickers: Array.from({length:20},(_,i)=>({id:`${t.code}${i+1}`,num:i+1})) })
  ));
  // Coca-Cola special section (CC1-CC14), inserted after TUN (last team of group F)
  secs.push({
    key:"CC", name:"Coca-Cola", flag:"🥤", group:null, color:"#e8302a", special:"cocacola",
    stickers: Array.from({length:14},(_,i)=>({id:`CC${i+1}`,num:i+1}))
  });
  return secs;
};
const ALBUM = buildAlbum();
const ALL_IDS = ALBUM.flatMap(s=>s.stickers.map(st=>st.id));
const TOTAL = ALL_IDS.length;
const CODE_TO_SECTION = {};
ALBUM.forEach(s=>s.stickers.forEach(st=>{ CODE_TO_SECTION[st.id]=s; }));

// ── Storage ───────────────────────────────────────────────────────────────────
const SK = "panini_wc2026_v3";
const SK_STREAK = "panini_streak_v1";

const loadData = () => { try { const r=localStorage.getItem(SK); return r?JSON.parse(r):{owned:[],repeated:{}}; } catch { return {owned:[],repeated:{}}; }};
const saveData = (o,r) => { try { localStorage.setItem(SK,JSON.stringify({owned:[...o],repeated:r})); } catch {} };

const loadStreak = () => {
  try {
    const r = localStorage.getItem(SK_STREAK);
    return r ? JSON.parse(r) : { firstDay: null, lastDay: null, streak: 0, maxStreak: 0 };
  } catch { return { firstDay: null, lastDay: null, streak: 0, maxStreak: 0 }; }
};

const saveStreak = (data) => { try { localStorage.setItem(SK_STREAK, JSON.stringify(data)); } catch {} };

const updateStreak = () => {
  const today = new Date().toISOString().slice(0,10);
  const s = loadStreak();
  if (!s.firstDay) s.firstDay = today;
  if (s.lastDay === today) return s; // already updated today
  const yesterday = new Date(Date.now()-86400000).toISOString().slice(0,10);
  s.streak = s.lastDay === yesterday ? s.streak + 1 : 1;
  s.maxStreak = Math.max(s.maxStreak, s.streak);
  s.lastDay = today;
  saveStreak(s);
  return s;
};

// ── PDF Generator (pure JS, no library needed) ───────────────────────────────
// Uses jsPDF from CDN
const generatePDF = async (owned, repeated, missing, repeatList, missingByTeam) => {
  // Dynamically load jsPDF
  if (!window.jspdf) {
    await new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation:"portrait", unit:"mm", format:"a4" });
  const W = 210, margin = 14;
  let y = margin;

  const today = new Date().toLocaleDateString("es-MX",{day:"2-digit",month:"long",year:"numeric"});

  // ── Helper fns ──────────────────────────────────────────────────────────────
  const line = (col=220) => { doc.setDrawColor(col,col,col); doc.line(margin, y, W-margin, y); y+=4; };
  const heading = (txt, size=14, r=220, g=160, b=40) => {
    doc.setFontSize(size); doc.setTextColor(r,g,b); doc.setFont("helvetica","bold");
    doc.text(txt, margin, y); y += size*0.5;
  };
  const body = (txt, size=9, r=40,g=40,b=60) => {
    doc.setFontSize(size); doc.setTextColor(r,g,b); doc.setFont("helvetica","normal");
    const lines = doc.splitTextToSize(txt, W-margin*2);
    doc.text(lines, margin, y); y += lines.length * size * 0.45;
  };
  const newPage = () => { doc.addPage(); y = margin; };
  const checkPage = (needed=20) => { if (y + needed > 280) newPage(); };

  // ── Cover ───────────────────────────────────────────────────────────────────
  doc.setFillColor(8,8,20); doc.rect(0,0,W,297,"F");
  doc.setFillColor(20,32,80); doc.rect(0,0,W,50,"F");
  doc.setDrawColor(232,200,74); doc.setLineWidth(0.5);
  doc.line(0,50,W,50);

  doc.setFontSize(22); doc.setTextColor(232,200,74); doc.setFont("helvetica","bold");
  doc.text("Album WC2026", W/2, 22, {align:"center"});
  doc.setFontSize(12); doc.setTextColor(160,170,220);
  doc.text("Reporte de mi álbum", W/2, 32, {align:"center"});
  doc.setFontSize(9); doc.setTextColor(100,110,140);
  doc.text(today, W/2, 40, {align:"center"});

  y = 60;
  // Progress summary
  const pct = Math.round((owned.size/TOTAL)*100);
  doc.setFillColor(20,20,35); doc.roundedRect(margin, y, W-margin*2, 28, 3,3,"F");
  doc.setDrawColor(50,50,80); doc.roundedRect(margin, y, W-margin*2, 28, 3,3,"S");

  doc.setFontSize(28); doc.setTextColor(232,200,74); doc.setFont("helvetica","bold");
  doc.text(`${pct}%`, margin+8, y+18);
  doc.setFontSize(9); doc.setTextColor(140,150,190);
  doc.text(`Completado`, margin+8, y+24);

  doc.setFontSize(10); doc.setTextColor(100,200,120); doc.setFont("helvetica","bold");
  doc.text(`✓  ${owned.size} tengo`, margin+50, y+13);
  doc.setTextColor(200,80,80);
  doc.text(`○  ${missing.length} faltan`, margin+50, y+21);
  doc.setTextColor(160,130,230);
  doc.text(`◈  ${repeatList.length} repetidas (${repeatList.reduce((a,r)=>a+r.count,0)} copias)`, margin+100, y+13);
  doc.setTextColor(100,110,140);
  doc.text(`Total álbum: ${TOTAL} figuritas`, margin+100, y+21);
  y += 36;

  // Progress bar
  doc.setFillColor(25,25,40); doc.rect(margin, y, W-margin*2, 5,"F");
  doc.setFillColor(232,200,74); doc.rect(margin, y, (W-margin*2)*(owned.size/TOTAL), 5,"F");
  y += 12;

  // ── Section 1: REPETIDAS ────────────────────────────────────────────────────
  checkPage(20);
  doc.setFillColor(30,15,60); doc.rect(margin-2, y-4, W-margin*2+4, 10,"F");
  heading("◈  MIS REPETIDAS — Para ofrecer en cambios", 13, 160,130,230);
  y += 2;
  body(`Total: ${repeatList.length} stickers distintos · ${repeatList.reduce((a,r)=>a+r.count,0)} copias para intercambiar`, 9, 120,100,180);
  y += 3; line();

  if (repeatList.length===0) {
    body("No tienes repetidas registradas aún.", 10, 120,120,160);
    y+=4;
  } else {
    // Group by team section
    const repByTeam = {};
    repeatList.forEach(({id,count}) => {
      const sec = CODE_TO_SECTION[id];
      if (!sec) return;
      if (!repByTeam[sec.key]) repByTeam[sec.key] = { sec, items:[] };
      repByTeam[sec.key].items.push({id,count});
    });

    Object.values(repByTeam).forEach(({sec, items}) => {
      checkPage(14);
      doc.setFontSize(9); doc.setFont("helvetica","bold");
      doc.setTextColor(180,180,200);
      doc.text(`${sec.name} (${sec.key})`, margin, y); y+=4;

      // Chips in a row
      let x = margin;
      items.forEach(({id, count}) => {
        const chipW = 22, chipH = 7;
        if (x + chipW > W-margin) { x=margin; y+=chipH+2; checkPage(12); }
        doc.setFillColor(25,15,55); doc.roundedRect(x, y-5, chipW, chipH, 1,1,"F");
        doc.setDrawColor(100,80,180); doc.roundedRect(x, y-5, chipW, chipH, 1,1,"S");
        doc.setFontSize(7); doc.setFont("helvetica","bold"); doc.setTextColor(160,130,230);
        doc.text(id, x+2, y-0.5);
        doc.setFillColor(40,25,90); doc.rect(x+chipW-8, y-5, 8, chipH,"F");
        doc.setFontSize(7); doc.setTextColor(200,170,255);
        doc.text(`×${count}`, x+chipW-7, y-0.5);
        x += chipW+3;
      });
      y += 10;
    });
  }

  // ── Section 2: FALTANTES ───────────────────────────────────────────────────
  newPage();
  doc.setFillColor(40,10,10); doc.rect(margin-2, y-4, W-margin*2+4, 10,"F");
  heading("○  ME FALTAN — Para buscar o pedir en cambios", 13, 210,80,80);
  y += 2;
  body(`Total: ${missing.length} figuritas faltantes de ${TOTAL}`, 9, 170,80,80);
  y += 3; line(180);

  if (missing.length===0) {
    doc.setFontSize(14); doc.setTextColor(100,200,100); doc.setFont("helvetica","bold");
    doc.text("🏆 ¡Álbum completado!", W/2, y+10, {align:"center"}); y+=20;
  } else {
    ALBUM.forEach(sec => {
      const mis = missingByTeam[sec.key];
      if (!mis || mis.length===0) return;
      checkPage(16);

      // Team header row
      doc.setFillColor(15,15,25); doc.rect(margin-2, y-4, W-margin*2+4, 8,"F");
      doc.setFontSize(8); doc.setFont("helvetica","bold"); doc.setTextColor(200,200,220);
      doc.text(`${sec.name}  (${sec.key})`, margin, y);
      doc.setTextColor(200,80,80);
      doc.text(`Faltan ${mis.length}`, W-margin, y, {align:"right"});
      y += 5;

      // Sticker chips
      let x = margin;
      mis.forEach(id => {
        const chipW = 18, chipH = 6;
        if (x + chipW > W-margin) { x=margin; y+=chipH+2; checkPage(12); }
        doc.setFillColor(20,10,10); doc.roundedRect(x, y-4, chipW, chipH, 1,1,"F");
        doc.setDrawColor(120,40,40); doc.roundedRect(x, y-4, chipW, chipH, 1,1,"S");
        doc.setFontSize(6.5); doc.setFont("helvetica","normal"); doc.setTextColor(190,100,100);
        doc.text(id, x+2, y);
        x += chipW+2;
      });
      y += 10;
    });
  }

  // ── Section 3: Progreso por grupo ──────────────────────────────────────────
  newPage();
  doc.setFillColor(10,20,40); doc.rect(margin-2, y-4, W-margin*2+4, 10,"F");
  heading("◉  PROGRESO POR GRUPO", 13, 232,200,74);
  y += 5; line();

  GROUPS.forEach(g => {
    checkPage(20);
    doc.setFontSize(10); doc.setFont("helvetica","bold"); doc.setTextColor(200,200,220);
    doc.text(`Grupo ${g.id}`, margin, y); y+=5;

    g.teams.forEach(t => {
      checkPage(10);
      const sec = ALBUM.find(s=>s.key===t.code);
      if (!sec) return;
      const have = sec.stickers.filter(s=>owned.has(s.id)).length;
      const pct2 = Math.round((have/20)*100);
      const barW = 80;

      doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.setTextColor(160,160,190);
      doc.text(`${t.flag} ${t.name} (${t.code})`, margin+4, y);
      doc.setFontSize(8); doc.setTextColor(180,180,200);
      doc.text(`${have}/20`, margin+90, y);

      // Bar
      doc.setFillColor(20,20,35); doc.rect(margin+100, y-3, barW, 4,"F");
      const col = GROUP_COLORS[g.id] || "#888888";
      const rr=parseInt(col.slice(1,3),16), gg2=parseInt(col.slice(3,5),16), bb=parseInt(col.slice(5,7),16);
      doc.setFillColor(rr,gg2,bb); doc.rect(margin+100, y-3, barW*(have/20), 4,"F");

      doc.setFontSize(7); doc.setTextColor(140,140,170);
      doc.text(`${pct2}%`, margin+185, y);
      y += 7;
    });
    y += 2;
  });

  // ── Footer on each page ────────────────────────────────────────────────────
  const pages = doc.getNumberOfPages();
  for (let i=1; i<=pages; i++) {
    doc.setPage(i);
    doc.setDrawColor(40,40,60); doc.line(margin,287,W-margin,287);
    doc.setFontSize(7); doc.setTextColor(60,60,80);
    doc.text("Album WC2026 Tracker", margin, 292);
    doc.text(`Pág. ${i} / ${pages}`, W-margin, 292, {align:"right"});
  }

  doc.save(`wc26-${new Date().toISOString().slice(0,10)}.pdf`);
};

// ── Repeat modal ──────────────────────────────────────────────────────────────
function RepeatModal({ id, count, color, onSet, onClose }) {
  const [val, setVal] = useState(count);
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center"}}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:"#0e0e1a",border:`2px solid ${color}`,borderRadius:16,padding:24,width:260,textAlign:"center"}}>
        <div style={{fontSize:15,letterSpacing:3,color,textTransform:"uppercase",marginBottom:4}}>Figurita repetida</div>
        <div style={{fontSize:20,fontWeight:"bold",marginBottom:4}}>{id}</div>
        <div style={{fontSize:14,color:"#606070",marginBottom:20}}>¿Cuántas copias de más tienes?</div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:16,marginBottom:20}}>
          <button onClick={()=>setVal(v=>Math.max(0,v-1))}
            style={{width:40,height:40,borderRadius:20,border:`1px solid ${color}44`,background:"#1a1a2a",color,fontSize:20,cursor:"pointer",fontFamily:"inherit"}}>−</button>
          <div style={{fontSize:36,fontWeight:"900",color,minWidth:48,textAlign:"center"}}>{val}</div>
          <button onClick={()=>setVal(v=>Math.min(20,v+1))}
            style={{width:40,height:40,borderRadius:20,border:`1px solid ${color}44`,background:"#1a1a2a",color,fontSize:20,cursor:"pointer",fontFamily:"inherit"}}>+</button>
        </div>
        <div style={{fontSize:16,color:"#404050",marginBottom:16}}>
          {val===0?"No tienes repetidas de esta":val===1?"Tienes 1 copia de más":`Tienes ${val} copias de más`}
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={onClose} style={{flex:1,padding:"10px 0",background:"#111118",border:"1px solid #303040",borderRadius:10,color:"#505060",cursor:"pointer",fontSize:15,fontFamily:"inherit"}}>Cancelar</button>
          <button onClick={()=>{onSet(id,val);onClose();}}
            style={{flex:1,padding:"10px 0",background:`${color}22`,border:`1px solid ${color}`,borderRadius:10,color,cursor:"pointer",fontSize:15,fontFamily:"inherit"}}>
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Sticker box ───────────────────────────────────────────────────────────────
function StickerBox({ id, num, color, size, owned, repeated, onToggle, onOpenRepeat, highlight }) {
  size = size || "md";
  const has = owned.has(id);
  const rep = repeated[id] || 0;
  const [pressing, setPressing] = useState(false);
  const [justMarked, setJustMarked] = useState(false);
  const minH = size==="lg" ? 90 : size==="md" ? 72 : 56;
  const numFs = size==="lg" ? 18 : size==="md" ? 15 : 12;
  const bg   = highlight ? "#2a2a0a" : has ? (rep>0 ? "#2a1a6e" : color+"22") : "#0d0d1a";
  const bCol = highlight ? "#e8c84a"  : has ? (rep>0 ? "#8060e0" : color)     : "#252535";
  const textC= highlight ? "#e8c84a"  : has ? (rep>0 ? "#c0a0ff" : color)     : "#35354a";

  const handleToggle = () => {
    if (!has) { setJustMarked(true); setTimeout(()=>setJustMarked(false), 400); }
    onToggle(id);
  };

  return (
    <div id={"sticker-"+id} style={{width:"100%",minHeight:minH,background:bg,border:"1.5px solid "+bCol,borderRadius:8,
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
      position:"relative",fontFamily:BODY,overflow:"hidden",userSelect:"none",WebkitUserSelect:"none",
      transform: pressing ? "scale(0.94)" : justMarked ? "scale(1.06)" : "scale(1)",
      boxShadow: highlight ? `0 0 16px #e8c84a88` : justMarked ? `0 0 12px ${color}66` : "none",
      transition:"transform 0.12s ease, box-shadow 0.2s ease, background 0.2s, border-color 0.2s"}}>

      {/* Main tap area */}
      <div onClick={handleToggle}
        onPointerDown={()=>setPressing(true)}
        onPointerUp={()=>setPressing(false)}
        onPointerLeave={()=>setPressing(false)}
        style={{flex:1,width:"100%",display:"flex",flexDirection:"column",alignItems:"center",
          justifyContent:"center",gap:2,cursor:"pointer",
          padding: has ? "6px 2px 20px" : "6px 2px"}}>
        <div style={{fontSize:numFs,fontWeight:"900",color:textC,lineHeight:1,
          transition:"color 0.2s"}}>{num}</div>
        <div style={{fontSize:14,color:has ? color+"bb" : "#252535",letterSpacing:0.5,fontWeight:"bold",
          transition:"color 0.2s"}}>{id}</div>
        {rep>0 && (
          <div style={{background:"#1a0a40",border:"1px solid #6040b0",borderRadius:4,
            padding:"1px 5px",fontSize:16,color:"#c0a0ff",fontWeight:"bold",marginTop:1}}>
            {"\xd7"}{rep+1}
          </div>
        )}
      </div>

      {/* Rep strip */}
      {has && (
        <div onClick={e=>{e.stopPropagation();onOpenRepeat(id);}}
          style={{position:"absolute",bottom:0,left:0,right:0,
            background: rep>0 ? "#2a1060" : color+"18",
            borderTop:"1px solid "+(rep>0 ? "#6040b0" : color+"33"),
            padding:"2px 0",textAlign:"center",cursor:"pointer",
            fontSize:10,color:rep>0 ? "#c0a0ff" : color+"88",
            fontWeight:"400",letterSpacing:0.2,transition:"background 0.2s"}}>
          {rep>0 ? ("\u25c8 "+rep+" extra") : "+ repetida"}
        </div>
      )}
    </div>
  );
}

// ── FWC Spread ────────────────────────────────────────────────────────────────
function FWCSpread({ section, owned, repeated, expandAll, onToggle, onOpenRepeat, onClearRepeats, stickerHighlight }) {
  const [open, setOpen] = useState(false);
  useEffect(()=>setOpen(expandAll),[expandAll]);
  useEffect(()=>{ if(stickerHighlight && section.stickers.some(s=>s.id===stickerHighlight)) setOpen(true); },[stickerHighlight]);

  const have = section.stickers.filter(s=>owned.has(s.id)).length;
  const total = section.stickers.length;
  const pct = Math.round((have/total)*100);
  const isFWCI = section.key==="FWCI";

  return (
    <div style={{background:"#0e0e1a",border:"2px solid #e8c84a33",borderRadius:14,overflow:"hidden",marginBottom:8}}>
      <div onClick={()=>setOpen(o=>!o)}
        style={{padding:"10px 14px",display:"flex",alignItems:"center",gap:10,
          background:"linear-gradient(135deg,#e8c84a30 0%,#e8c84a12 50%,#e8c84a05 100%)",
          borderBottom:"1px solid #e8c84a30",cursor:"pointer",userSelect:"none"}}>
        <div style={{fontSize:22}}>{isFWCI ? "🌍" : "🏆"}</div>
        <div style={{flex:1}}>
          <div style={{fontSize:20,fontWeight:"400",letterSpacing:2,fontFamily:DISPLAY,lineHeight:1}}>
            {isFWCI ? "FWC · INTRO" : "FWC · HISTORIA"}
          </div>
          <div style={{fontSize:12,color:"#e8c84a88",fontFamily:BODY}}>
            {isFWCI ? "FWC0 – FWC8" : "FWC9 – FWC19"}
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:17,fontWeight:"bold",color:"#e8c84a"}}>{pct}%</div>
            <div style={{fontSize:12,color:"#505068"}}>{have}/{total}</div>
          </div>
          <div style={{fontSize:16,color:"#e8c84a88",transition:"transform 0.2s",transform:open?"rotate(180deg)":"rotate(0deg)"}}>▾</div>
        </div>
      </div>
      <div style={{height:3,background:"#111120"}}><div style={{height:"100%",width:`${pct}%`,background:"#e8c84a",transition:"width 0.3s"}}/></div>
      {open && (
        <div className="accordion-content">
          <div style={{padding:"10px 10px 6px",display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:5}}>
            {section.stickers.map(st=>(
              <StickerBox key={st.id} id={st.id} num={st.num} color="#e8c84a" size="md"
                owned={owned} repeated={repeated} onToggle={onToggle} onOpenRepeat={onOpenRepeat}
                highlight={stickerHighlight===st.id}/>
            ))}
          </div>
          {/* Limpiar / Todos */}
          <div style={{borderTop:"1px solid #e8c84a18",padding:"6px 10px",display:"flex",gap:6,justifyContent:"flex-end"}}>
            <button onClick={()=>section.stickers.forEach(st=>{ if(!owned.has(st.id)) onToggle(st.id); })}
              style={{padding:"4px 10px",background:"#0e0e1a",border:"1px solid #e8c84a44",borderRadius:6,color:"#e8c84acc",cursor:"pointer",fontSize:12,fontFamily:BODY}}>✓ Todos</button>
            <button onClick={()=>{
              section.stickers.filter(st=>owned.has(st.id)).forEach(st=>onToggle(st.id));
              onClearRepeats(section.stickers.map(st=>st.id));
            }}
              style={{padding:"4px 10px",background:"#0e0e1a",border:"1px solid #30304a",borderRadius:6,color:"#505068",cursor:"pointer",fontSize:12,fontFamily:BODY}}>✗ Limpiar</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Coca-Cola Spread ──────────────────────────────────────────────────────────
// Page 1: 6 stickers (CC1-CC6) in 2 rows of 3
// Page 2: row of 3 (CC7-CC9) + row of 3 (CC10-CC12) + row of 2 (CC13-CC14) + Coca-Cola logo tile
function CCSpread({ section, owned, repeated, expandAll, onToggle, onOpenRepeat, onClearRepeats }) {
  const { color, stickers } = section;
  const [open, setOpen] = useState(false);
  useEffect(()=>setOpen(expandAll),[expandAll]);
  const have = stickers.filter(s=>owned.has(s.id)).length;
  const pct  = Math.round((have/14)*100);
  const s = n => stickers[n-1];
  const box = (n, size="md") => (
    <StickerBox key={n} id={s(n).id} num={n} color={color} size={size}
      owned={owned} repeated={repeated} onToggle={onToggle} onOpenRepeat={onOpenRepeat}/>
  );

  return (
    <div style={{background:"#0e0e1a",border:"2px solid #e8302a44",borderRadius:14,overflow:"hidden",marginBottom:8}}>
      {/* Header */}
      <div onClick={()=>setOpen(o=>!o)} style={{background:"linear-gradient(135deg,#e8302a35 0%,#e8302a15 50%,#e8302a05 100%)",padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",userSelect:"none",borderBottom:"1px solid #e8302a30"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{fontSize:22}}>🥤</div>
          <div>
            <div style={{fontSize:20,fontWeight:"400",letterSpacing:2,fontFamily:DISPLAY,lineHeight:1}}>Coca-Cola</div>
            <div style={{fontSize:12,color:"#e8302a99",letterSpacing:1,textTransform:"uppercase",fontFamily:BODY}}>Sección especial · CC</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:17,fontWeight:"bold",color:"#e8302a"}}>{pct}%</div>
            <div style={{fontSize:12,color:"#505068"}}>{have}/14</div>
          </div>
          <div style={{fontSize:16,color:"#e8302a88",transition:"transform 0.2s",transform:open?"rotate(180deg)":"rotate(0deg)"}}>▾</div>
        </div>
      </div>
      <div style={{height:3,background:"#111120"}}><div style={{height:"100%",width:`${pct}%`,background:"#e8302a",transition:"width 0.3s"}}/></div>

      {open && <div className="accordion-content">
      {/* Page 1: CC1-CC6, 2 rows of 3 */}
      <div style={{padding:"10px 10px 6px",borderBottom:"1px solid #e8302a18"}}>
        <div style={{fontSize:11,color:"#303048",letterSpacing:2,marginBottom:8,textTransform:"uppercase",fontWeight:"600"}}>Página 1 · CC1–CC6</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:5,marginBottom:5}}>
          {[1,2,3].map(n=>box(n,"lg"))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:5}}>
          {[4,5,6].map(n=>box(n,"lg"))}
        </div>
      </div>

      {/* Page 2: CC7-CC14 + logo */}
      <div style={{padding:"6px 10px 10px"}}>
        <div style={{fontSize:11,color:"#303048",letterSpacing:2,marginBottom:8,textTransform:"uppercase",fontWeight:"600"}}>Página 2 · CC7–CC14</div>
        {/* Row 1: CC7-CC9 */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:5,marginBottom:5}}>
          {[7,8,9].map(n=>box(n,"md"))}
        </div>
        {/* Row 2: CC10-CC12 */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:5,marginBottom:5}}>
          {[10,11,12].map(n=>box(n,"md"))}
        </div>
        {/* Row 3: CC13-CC14 + Coca-Cola logo tile */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:5}}>
          {[13,14].map(n=>box(n,"md"))}
          {/* Logo tile */}
          <div style={{background:"linear-gradient(135deg,#e8302a22,#e8302a0a)",
            border:"1.5px solid #e8302a44",borderRadius:8,minHeight:72,
            display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4}}>
            <div style={{fontSize:20}}>🥤</div>
            <div style={{fontSize:10,fontWeight:"900",color:"#e8302a",letterSpacing:-0.5,lineHeight:1,textAlign:"center"}}>
              Coca<br/>Cola
            </div>
          </div>
        </div>
      </div>

      {/* Quick fill */}
      <div style={{borderTop:"1px solid #e8302a18",padding:"6px 10px",display:"flex",gap:6,justifyContent:"flex-end"}}>
        <button onClick={()=>stickers.forEach(st=>{ if(!owned.has(st.id)) onToggle(st.id); })}
          style={{padding:"4px 10px",background:"#0e0e1a",border:"1px solid #e8302a44",borderRadius:6,color:"#e8302acc",cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>✓ Todos</button>
        <button onClick={()=>{
          stickers.filter(st=>owned.has(st.id)).forEach(st=>onToggle(st.id));
          onClearRepeats(stickers.map(st=>st.id));
        }}
          style={{padding:"4px 10px",background:"#0e0e1a",border:"1px solid #30304a",borderRadius:6,color:"#505068",cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>✗ Limpiar</button>
      </div>
      </div>}
    </div>
  );
}

// ── Team Spread ───────────────────────────────────────────────────────────────
function TeamSpread({ section, owned, repeated, expandAll, onToggle, onOpenRepeat, onClearRepeats, stickerHighlight, onComplete }) {
  const { key:code, name, flag, group, color, stickers } = section;
  const [open, setOpen] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  useEffect(()=>setOpen(expandAll),[expandAll]);
  useEffect(()=>{ if(stickerHighlight && stickers.some(s=>s.id===stickerHighlight)) setOpen(true); },[stickerHighlight]);

  const have = stickers.filter(s=>owned.has(s.id)).length;
  const pct  = Math.round((have/20)*100);

  // Detect completion
  useEffect(()=>{
    if (have===20) { setJustCompleted(true); setTimeout(()=>setJustCompleted(false), 2000); }
  },[have]);
  const s = n => stickers[n-1];
  const box = (n, size="md") => (
    <StickerBox key={n} id={s(n).id} num={n} color={color} size={size}
      owned={owned} repeated={repeated} onToggle={onToggle} onOpenRepeat={onOpenRepeat}
      highlight={stickerHighlight===s(n).id}/>
  );

  return (
    <div style={{background:"#0e0e1a",border:`2px solid ${color}44`,borderRadius:14,overflow:"hidden",marginBottom:8}}>
      {/* Header — tap to toggle */}
      <div onClick={()=>setOpen(o=>!o)}
        style={{background:`linear-gradient(135deg,${color}35 0%,${color}15 50%,${color}08 100%)`,
          padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",userSelect:"none",
          borderBottom:`1px solid ${color}30`}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{fontSize:22}}>{flag}</div>
          <div>
            <div style={{fontSize:20,fontWeight:"400",letterSpacing:1.5,fontFamily:DISPLAY,lineHeight:1}}>{name}</div>
            <div style={{fontSize:12,color:`${color}bb`,letterSpacing:1,textTransform:"uppercase",fontFamily:BODY}}>Grupo {group} · {code}</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:17,fontWeight:"bold",color}}>{pct}%</div>
            <div style={{fontSize:12,color:"#505068"}}>{have}/20</div>
          </div>
          <div style={{fontSize:16,color:`${color}88`,transition:"transform 0.2s",transform:open?"rotate(180deg)":"rotate(0deg)"}}>▾</div>
        </div>
      </div>
      <div style={{height:3,background:"#111120"}}><div style={{height:"100%",width:`${pct}%`,background:color,transition:"width 0.3s"}}/></div>

      {open && <div className="accordion-content">
      {/* ── PAGE 1 ── */}
      <div style={{padding:"10px 10px 6px",borderBottom:`1px solid ${color}18`}}>
        <div style={{fontSize:16,color:"#303048",letterSpacing:2,marginBottom:5}}>PÁG 1 · {code}</div>
        {/* Row 1: info placeholder (50%) | carta 1 (25%) | carta 2 (25%) */}
        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gap:5,marginBottom:5}}>
          {/* Info tile — not selectable */}
          <div style={{background:`linear-gradient(135deg,${color}28 0%,${color}10 60%,${color}05 100%)`,
            border:"1.5px solid "+color+"40",borderRadius:8,
            display:"flex",flexDirection:"column",alignItems:"flex-start",justifyContent:"space-between",
            padding:"10px 12px",minHeight:90,boxSizing:"border-box",overflow:"hidden",position:"relative"}}>
            {/* Big code watermark */}
            <div style={{position:"absolute",right:-4,top:-6,fontSize:52,fontWeight:"400",
              color:color+"18",letterSpacing:2,lineHeight:1,userSelect:"none",
              fontFamily:DISPLAY}}>
              {code}
            </div>
            {/* Top: group badge */}
            <div style={{background:color+"22",border:"1px solid "+color+"44",borderRadius:4,
              padding:"2px 7px",fontSize:11,color:color,fontWeight:"bold",letterSpacing:2,
              textTransform:"uppercase",zIndex:1,fontFamily:BODY}}>
              GRP {group}
            </div>
            {/* Main code */}
            <div style={{fontSize:32,fontWeight:"400",color,lineHeight:1,letterSpacing:3,
              fontFamily:DISPLAY,zIndex:1}}>
              {code}
            </div>
            {/* Bottom: full name */}
            <div style={{fontSize:10,color:color+"99",letterSpacing:0.5,
              textTransform:"uppercase",zIndex:1,lineHeight:1.2,fontFamily:BODY}}>
              {name}
            </div>
          </div>
          {box(1,"lg")}
          {box(2,"lg")}
        </div>
        {/* Row 2: 3-4-5-6 */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:5,marginBottom:5}}>
          {[3,4,5,6].map(n=>box(n))}
        </div>
        {/* Row 3: 7-8-9-10 */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:5}}>
          {[7,8,9,10].map(n=>box(n))}
        </div>
      </div>

      {/* ── PAGE 2 ── */}
      <div style={{padding:"6px 10px 10px"}}>
        <div style={{fontSize:16,color:"#252535",letterSpacing:2,marginBottom:5}}>PÁG 2</div>
        {/* Row 1: 11, 12 normal + 13 flag/badge wider */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 2fr",gap:5,marginBottom:5}}>
          {box(11)}{box(12)}
          {(()=>{
            const id13=s(13).id; const has13=owned.has(id13); const rep13=repeated[id13]||0;
            return (
              <div style={{background:has13?(rep13>0?"#2a1a6e":color+"22"):"#0d0d1a",
                border:"1.5px solid "+(has13?(rep13>0?"#8060e0":color):"#252535"),
                borderRadius:8,display:"flex",flexDirection:"column",alignItems:"center",
                justifyContent:"center",minHeight:72,transition:"all 0.15s",
                position:"relative",overflow:"hidden",userSelect:"none",WebkitUserSelect:"none"}}>
                <div onClick={()=>onToggle(id13)}
                  style={{flex:1,width:"100%",display:"flex",flexDirection:"column",
                    alignItems:"center",justifyContent:"center",gap:2,cursor:"pointer",
                    padding:has13?"4px 4px 20px":"4px"}}>
                  <div style={{fontSize:18}}>{flag}</div>
                  <div style={{fontSize:16,fontWeight:"900",color:has13?(rep13>0?"#c0a0ff":color):"#252535"}}>13</div>
                  <div style={{fontSize:14,color:has13?color+"bb":"#252535"}}>{id13}</div>
                  {rep13>0&&<div style={{background:"#1a0a40",border:"1px solid #6040b0",borderRadius:4,padding:"1px 4px",fontSize:16,color:"#c0a0ff",fontWeight:"bold"}}>{"\xd7"}{rep13+1}</div>}
                </div>
                {has13&&(
                  <div onClick={e=>{e.stopPropagation();onOpenRepeat(id13);}}
                    style={{position:"absolute",bottom:0,left:0,right:0,
                      background:rep13>0?"#2a1060":color+"18",
                      borderTop:"1px solid "+(rep13>0?"#6040b0":color+"33"),
                      padding:"3px 0",textAlign:"center",cursor:"pointer",
                      fontSize:14,color:rep13>0?"#c0a0ff":color+"99",fontWeight:"bold"}}>
                    {rep13>0?("\u25c8 "+rep13+" extra"):"+\xa0rep"}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
        {/* Row 2: 14-15-16-17 */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:5,marginBottom:5}}>
          {[14,15,16,17].map(n=>box(n,"md"))}
        </div>
        {/* Row 3: group tile + 18-19-20 */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:5}}>
          <div style={{background:color+"08",border:"1px dashed "+color+"22",borderRadius:8,
            display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:56}}>
            <div style={{fontSize:14,color:color+"66",fontWeight:"bold",letterSpacing:1}}>GRP</div>
            <div style={{fontSize:16,fontWeight:"900",color:color+"66"}}>{group}</div>
          </div>
          {[18,19,20].map(n=>box(n,"sm"))}
        </div>
      </div>

      <div style={{borderTop:`1px solid ${color}18`,padding:"6px 10px",display:"flex",gap:6,justifyContent:"flex-end"}}>
        <button onClick={()=>stickers.forEach(st=>{ if(!owned.has(st.id)) onToggle(st.id); })}
          style={{padding:"4px 10px",background:"#0e0e1a",border:`1px solid ${color}44`,borderRadius:6,color:`${color}cc`,cursor:"pointer",fontSize:15,fontFamily:"inherit"}}>✓ Todos</button>
        <button onClick={()=>{
          stickers.filter(st=>owned.has(st.id)).forEach(st=>onToggle(st.id));
          onClearRepeats(stickers.map(st=>st.id));
        }}
          style={{padding:"4px 10px",background:"#0e0e1a",border:"1px solid #30304a",borderRadius:6,color:"#505068",cursor:"pointer",fontSize:15,fontFamily:"inherit"}}>✗ Limpiar</button>
      </div>
      </div>}
    </div>
  );
}

// ── Scan Modal ────────────────────────────────────────────────────────────────
// ── Trade code helpers ────────────────────────────────────────────────────────
// Format: "v1|REPEATS|MISSING"
// REPEATS: "MEX1:2,BRA3:1,..." (id:count)
// MISSING: "MEX2,BRA4,..." (comma separated)
const encodeTrade = (repeatList, missing) => {
  const r = repeatList.map(({id,count})=>id+":"+count).join(",");
  const m = missing.join(",");
  return "v1|" + btoa(r + "|" + m);
};

const decodeTrade = (code) => {
  try {
    if (!code.startsWith("v1|")) return null;
    const raw = atob(code.slice(3));
    const sep = raw.indexOf("|");
    const rPart = raw.slice(0, sep);
    const mPart = raw.slice(sep+1);
    const repeats = rPart ? rPart.split(",").map(s=>{ const [id,c]=s.split(":"); return {id,count:parseInt(c)||1}; }) : [];
    const missing = mPart ? mPart.split(",").filter(Boolean) : [];
    return { repeats, missing };
  } catch { return null; }
};

// Compare: what can A give B, and B give A
const computeTrade = (myRepeats, myMissing, theirRepeats, theirMissing) => {
  const myRepeatIds = new Set(myRepeats.map(r=>r.id));
  const theirRepeatIds = new Set(theirRepeats.map(r=>r.id));
  const myMissingSet = new Set(myMissing);
  const theirMissingSet = new Set(theirMissing);

  // What I can give them: my repeats that they need
  const iGiveThem = myRepeats.filter(r => theirMissingSet.has(r.id));
  // What they can give me: their repeats that I need
  const theyGiveMe = theirRepeats.filter(r => myMissingSet.has(r.id));

  return { iGiveThem, theyGiveMe };
};

// ── Trade Modal ───────────────────────────────────────────────────────────────
function TradeModal({ myCode, onClose, onConfirm }) {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);

  const compare = () => {
    setErr(""); setResult(null);
    const decoded = decodeTrade(input.trim());
    if (!decoded) { setErr("Código inválido. Pide a tu amigo que copie su código de nuevo."); return; }
    const myDecoded = decodeTrade(myCode);
    if (!myDecoded) { setErr("Error con tu propio código."); return; }
    const trade = computeTrade(myDecoded.repeats, myDecoded.missing, decoded.repeats, decoded.missing);
    setResult(trade);
  };

  const copyMyCode = () => {
    navigator.clipboard?.writeText(myCode);
    setCopied(true); setTimeout(()=>setCopied(false), 2000);
  };

  const accentColor = "#50d0a0";

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",zIndex:200,
      display:"flex",alignItems:"flex-start",justifyContent:"center",overflowY:"auto"}}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:"#09090f",border:"1px solid #1a3a2a",borderRadius:16,
        width:"100%",maxWidth:480,margin:"16px 10px 40px",overflow:"hidden"}}>

        {/* Header */}
        <div style={{background:"linear-gradient(135deg,#0a1e18,#061210)",
          padding:"16px 18px",borderBottom:"1px solid #1a3a2a"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:15,letterSpacing:3,color:accentColor,textTransform:"uppercase",marginBottom:3}}>Comparador</div>
              <div style={{fontSize:17,fontWeight:"bold"}}>Buscar intercambios</div>
            </div>
            <button onClick={onClose} style={{background:"none",border:"none",color:"#505060",fontSize:20,cursor:"pointer"}}>✕</button>
          </div>
        </div>

        <div style={{padding:"16px 18px"}}>
          {/* Step 1: share my code */}
          <div style={{background:"#0d1a14",border:"1px solid #1a3a2a",borderRadius:12,padding:14,marginBottom:14}}>
            <div style={{fontSize:16,color:accentColor,letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>
              Paso 1 — Comparte tu código
            </div>
            <div style={{fontSize:14,color:"#607060",marginBottom:10,lineHeight:1.5}}>
              Mándale este código a tu amigo por WhatsApp para que él lo pegue en su app.
            </div>
            <div style={{background:"#060c08",border:"1px solid #1a2a1a",borderRadius:8,padding:"10px 12px",
              fontSize:16,color:"#70a080",wordBreak:"break-all",fontFamily:"monospace",marginBottom:10,
              maxHeight:60,overflow:"hidden",textOverflow:"ellipsis"}}>
              {myCode.slice(0,80)}{myCode.length>80?"…":""}
            </div>
            <button onClick={copyMyCode}
              style={{width:"100%",padding:"10px 0",background:copied?"#0a2a18":"#0d1e16",
                border:"1px solid "+(copied?"#50d0a0":"#2a5a40"),borderRadius:8,
                color:copied?"#50d0a0":"#3a9060",cursor:"pointer",fontSize:15,fontFamily:"inherit",
                fontWeight:"bold",transition:"all 0.2s"}}>
              {copied ? "✓ Código copiado!" : "⎘ Copiar mi código"}
            </button>
          </div>

          {/* Step 2: paste friend's code */}
          <div style={{background:"#0d1a14",border:"1px solid #1a3a2a",borderRadius:12,padding:14,marginBottom:14}}>
            <div style={{fontSize:16,color:accentColor,letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>
              Paso 2 — Pega el código de tu amigo
            </div>
            <textarea value={input} onChange={e=>setInput(e.target.value)}
              placeholder="Pega aquí el código de tu amigo…"
              style={{width:"100%",background:"#060c08",border:"1px solid #1a2a1a",borderRadius:8,
                color:"#a0c0a8",fontSize:14,padding:"10px 12px",minHeight:70,resize:"none",
                fontFamily:"monospace",boxSizing:"border-box",outline:"none",marginBottom:8}}/>
            {err && <div style={{fontSize:14,color:"#c05050",marginBottom:8}}>{err}</div>}
            <button onClick={compare}
              style={{width:"100%",padding:"11px 0",background:"linear-gradient(135deg,#0a2a1a,#061810)",
                border:"1px solid #2a6040",borderRadius:8,color:accentColor,
                cursor:"pointer",fontSize:16,fontFamily:"inherit",fontWeight:"bold"}}>
              🔄 Comparar
            </button>
          </div>

          {/* Results with checkbox confirmation */}
          {result && (
            <TradeConfirm
              result={result}
              accentColor={accentColor}
              onConfirm={(giving, receiving) => { onConfirm(giving, receiving); onClose(); }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Trade Confirm (checkbox step) ─────────────────────────────────────────────
function TradeConfirm({ result, accentColor, onConfirm }) {
  // Pre-select all items
  const [receiving, setReceiving] = useState(() => new Set(result.theyGiveMe.map(r=>r.id)));
  const [giving,    setGiving]    = useState(() => new Set(result.iGiveThem.map(r=>r.id)));
  const [done, setDone] = useState(false);

  const toggleR = id => setReceiving(p => { const n=new Set(p); n.has(id)?n.delete(id):n.add(id); return n; });
  const toggleG = id => setGiving(p    => { const n=new Set(p); n.has(id)?n.delete(id):n.add(id); return n; });

  const total = receiving.size + giving.size;

  if (done) return (
    <div style={{textAlign:"center",padding:28,background:"#0a1a10",border:"1px solid #2a5a38",borderRadius:12}}>
      <div style={{fontSize:36,marginBottom:8}}>🎉</div>
      <div style={{fontSize:17,fontWeight:"bold",color:accentColor,marginBottom:6}}>¡Intercambio confirmado!</div>
      <div style={{fontSize:13,color:"#507060"}}>Tu álbum se actualizó automáticamente.</div>
    </div>
  );

  return (
    <div>
      {/* Summary */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
        <div style={{background:"#0a1a10",border:"1px solid #1a4028",borderRadius:10,padding:12,textAlign:"center"}}>
          <div style={{fontSize:26,fontWeight:"900",color:accentColor}}>{receiving.size}</div>
          <div style={{fontSize:12,color:"#406050",textTransform:"uppercase",letterSpacing:1,marginTop:2}}>Recibes</div>
        </div>
        <div style={{background:"#0d0a1a",border:"1px solid #2a1a40",borderRadius:10,padding:12,textAlign:"center"}}>
          <div style={{fontSize:26,fontWeight:"900",color:"#a080e0"}}>{giving.size}</div>
          <div style={{fontSize:12,color:"#504060",textTransform:"uppercase",letterSpacing:1,marginTop:2}}>Das</div>
        </div>
      </div>

      {/* Receiving list */}
      {result.theyGiveMe.length > 0 && (
        <div style={{background:"#090f0d",border:"1px solid #1a3a28",borderRadius:10,overflow:"hidden",marginBottom:10}}>
          <div style={{padding:"10px 14px",borderBottom:"1px solid #1a3a28",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:14,color:accentColor,fontWeight:"bold"}}>✓ Recibes de tu amigo</span>
            <span style={{fontSize:12,color:"#406050"}}>{receiving.size}/{result.theyGiveMe.length}</span>
          </div>
          <div style={{padding:"8px 10px",display:"flex",flexDirection:"column",gap:4}}>
            {result.theyGiveMe.map(({id,count})=>{
              const checked = receiving.has(id);
              return (
                <div key={id} onClick={()=>toggleR(id)}
                  style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",borderRadius:8,cursor:"pointer",
                    background:checked?"#0a2018":"#0c0c14",border:"1px solid "+(checked?"#2a5a38":"#1a1a28"),
                    transition:"all 0.15s"}}>
                  {/* Checkbox */}
                  <div style={{width:20,height:20,borderRadius:5,border:"2px solid "+(checked?accentColor:"#2a3a30"),
                    background:checked?accentColor:"transparent",display:"flex",alignItems:"center",justifyContent:"center",
                    flexShrink:0,transition:"all 0.15s"}}>
                    {checked && <div style={{fontSize:12,color:"#060c08",fontWeight:"900"}}>✓</div>}
                  </div>
                  <div style={{flex:1,fontSize:14,fontWeight:"bold",color:checked?accentColor:"#406050"}}>{id}</div>
                  {count>1 && <div style={{fontSize:12,color:"#305040"}}>×{count} disponibles</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Giving list */}
      {result.iGiveThem.length > 0 && (
        <div style={{background:"#090d12",border:"1px solid #1a2a3a",borderRadius:10,overflow:"hidden",marginBottom:14}}>
          <div style={{padding:"10px 14px",borderBottom:"1px solid #1a2a3a",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:14,color:"#a080e0",fontWeight:"bold"}}>◈ Das a tu amigo</span>
            <span style={{fontSize:12,color:"#504070"}}>{giving.size}/{result.iGiveThem.length}</span>
          </div>
          <div style={{padding:"8px 10px",display:"flex",flexDirection:"column",gap:4}}>
            {result.iGiveThem.map(({id,count})=>{
              const checked = giving.has(id);
              return (
                <div key={id} onClick={()=>toggleG(id)}
                  style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",borderRadius:8,cursor:"pointer",
                    background:checked?"#0d0a1a":"#0c0c14",border:"1px solid "+(checked?"#3a2a5a":"#1a1a28"),
                    transition:"all 0.15s"}}>
                  <div style={{width:20,height:20,borderRadius:5,border:"2px solid "+(checked?"#a080e0":"#2a2a40"),
                    background:checked?"#a080e0":"transparent",display:"flex",alignItems:"center",justifyContent:"center",
                    flexShrink:0,transition:"all 0.15s"}}>
                    {checked && <div style={{fontSize:12,color:"#08060c",fontWeight:"900"}}>✓</div>}
                  </div>
                  <div style={{flex:1,fontSize:14,fontWeight:"bold",color:checked?"#a080e0":"#504060"}}>{id}</div>
                  {count>1 && <div style={{fontSize:12,color:"#403050"}}>×{count} tienes</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {result.theyGiveMe.length===0 && result.iGiveThem.length===0 && (
        <div style={{textAlign:"center",padding:24,color:"#404050",fontSize:13}}>
          😕 No hay intercambios posibles con este amigo por ahora.
        </div>
      )}

      {/* Confirm button */}
      {total > 0 && (
        <button
          onClick={()=>{ onConfirm([...giving], [...receiving]); setDone(true); }}
          style={{width:"100%",padding:"14px 0",
            background:"linear-gradient(135deg,#0a2a1a,#0a1428)",
            border:"1px solid #3a6050",borderRadius:12,
            color:"#50d0a0",cursor:"pointer",fontSize:16,
            fontFamily:"inherit",fontWeight:"bold",letterSpacing:0.3}}>
          ✓ Confirmar intercambio ({total} figuritas)
        </button>
      )}
    </div>
  );
}
// ── Quick Entry Modal ─────────────────────────────────────────────────────────
function QuickEntryModal({ onClose, onMark, allIds }) {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);

  const parse = () => {
    const tokens = input.toUpperCase().split(/[\s,;]+/).filter(Boolean);
    const valid = tokens.filter(t=>allIds.includes(t));
    const invalid = tokens.filter(t=>!allIds.includes(t));
    setResult({valid, invalid});
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",zIndex:200,
      display:"flex",alignItems:"flex-start",justifyContent:"center",overflowY:"auto"}}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:"#0a0a14",border:"1px solid #2a2a50",borderRadius:16,
        width:"100%",maxWidth:460,margin:"20px 12px",padding:20,fontFamily:BODY}}>

        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div>
            <div style={{fontSize:13,letterSpacing:3,color:"#e8c84a",textTransform:"uppercase"}}>Entrada rápida</div>
            <div style={{fontSize:16,fontWeight:"700"}}>Marcar varias a la vez</div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",color:"#505060",fontSize:20,cursor:"pointer"}}>✕</button>
        </div>

        <div style={{fontSize:12,color:"#404058",marginBottom:12,padding:"8px 10px",background:"#080810",borderRadius:8,lineHeight:1.7}}>
          Escribe los códigos separados por espacio o coma.<br/>
          <span style={{color:"#e8c84a80"}}>Ej: MEX7 BRA14 FWC3 ESP15, CC1</span>
        </div>

        <textarea value={input} onChange={e=>setInput(e.target.value)}
          placeholder="MEX7 BRA14 FWC3..."
          rows={4}
          style={{width:"100%",background:"#080810",border:"1px solid #2a2a40",borderRadius:10,
            color:"#e0d8f0",fontSize:14,padding:"10px 12px",boxSizing:"border-box",
            fontFamily:"monospace",outline:"none",resize:"none",marginBottom:10}}/>

        {result && (
          <div style={{marginBottom:12}}>
            {result.valid.length>0 && (
              <div style={{marginBottom:8}}>
                <div style={{fontSize:12,color:"#50d0a0",marginBottom:6,fontWeight:"600"}}>
                  ✓ {result.valid.length} figuritas válidas
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                  {result.valid.map(id=>{
                    const sec = allIds.includes(id) ? id : null;
                    return (
                      <div key={id} style={{padding:"3px 8px",borderRadius:12,background:"#0a1a10",
                        border:"1px solid #2a5a38",color:"#50d0a0",fontSize:11,fontWeight:"700"}}>
                        {id}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {result.invalid.length>0 && (
              <div style={{fontSize:12,color:"#c05050"}}>
                ✗ No reconocidos: {result.invalid.join(", ")}
              </div>
            )}
          </div>
        )}

        <div style={{display:"flex",gap:8}}>
          <button onClick={parse}
            style={{flex:1,padding:"11px 0",background:"#0e0e28",border:"1px solid #4050a0",
              borderRadius:10,color:"#8090d0",cursor:"pointer",fontSize:13,fontFamily:BODY,fontWeight:"600"}}>
            🔍 Verificar
          </button>
          {result?.valid?.length>0 && (
            <button onClick={()=>{onMark(result.valid);onClose();}}
              style={{flex:1,padding:"11px 0",background:"#0a180a",border:"1px solid #40a040",
                borderRadius:10,color:"#60b060",cursor:"pointer",fontSize:13,fontFamily:BODY,fontWeight:"700"}}>
              ✓ Marcar {result.valid.length}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Accordion Team (reusable for Repet. and Faltan tabs) ─────────────────────
function AccordionTeam({ sec, countLabel, badgeColor, badgeBg, badgeBorder, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{marginBottom:8,background:"#0c0c18",border:`1px solid ${sec.color}28`,borderRadius:12,overflow:"hidden"}}>
      <div onClick={()=>setOpen(o=>!o)}
        style={{padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",
          cursor:"pointer",userSelect:"none",borderBottom: open?`1px solid ${sec.color}18`:"none"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:18}}>{sec.flag}</span>
          <span style={{fontSize:13,fontWeight:"700",color:"#e0d8f0"}}>{sec.name}</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:11,color:badgeColor,background:badgeBg,border:`1px solid ${badgeBorder}`,borderRadius:20,padding:"2px 8px"}}>
            {countLabel}
          </span>
          <span style={{fontSize:14,color:sec.color+"88",transition:"transform 0.2s",display:"inline-block",transform:open?"rotate(180deg)":"rotate(0deg)"}}>▾</span>
        </div>
      </div>
      {open && <div className="accordion-content">{children}</div>}
    </div>
  );
}

// ── Market helpers ────────────────────────────────────────────────────────────
const decodeMarketLink = (code) => {
  try {
    const raw = atob(code);
    const [rPart, mPart] = raw.split("||");
    // Decode repeats: "MEX1:2,BRA3:1"
    const repeats = rPart ? rPart.split(",").filter(Boolean).map(s=>{
      const [id,c]=s.split(":"); return {id, count:parseInt(c)||1};
    }).filter(r=>r.id) : [];
    // Decode missing: "MEX:1,3,5|BRA:2,4"
    const missing = [];
    if (mPart) {
      mPart.split("|").forEach(chunk=>{
        const [code,...nums] = chunk.split(":");
        const numList = nums.join(":").split(",").map(Number).filter(n=>!isNaN(n)&&n>0);
        numList.forEach(n=>missing.push(code+n));
      });
    }
    return { repeats, missing };
  } catch { return null; }
};

// ── Friend Link Input ─────────────────────────────────────────────────────────
function FriendLinkInput({ myRepeats, myMissing, preloaded }) {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);

  // Auto-compare if friend data came from URL
  useEffect(()=>{
    if (preloaded) runCompare(preloaded);
  }, [preloaded]);

  const runCompare = (friend) => {
    const myMissingSet = new Set(myMissing);
    const friendMissingSet = new Set(friend.missing);
    const iGiveThem = myRepeats.filter(r=>friendMissingSet.has(r.id));
    const theyGiveMe = friend.repeats.filter(r=>myMissingSet.has(r.id));
    setResult({ iGiveThem, theyGiveMe });
  };

  const compare = () => {
    setErr(""); setResult(null);
    let code = input.trim();
    try { const url = new URL(code); code = url.searchParams.get("mercado") || code; } catch {}
    const friend = decodeMarketLink(code);
    if (!friend) { setErr("Link inválido. Pide a tu amigo que copie su link de nuevo."); return; }
    runCompare(friend);
  };

  return (
    <div>
      <input value={input} onChange={e=>setInput(e.target.value)}
        placeholder="Pega aquí el link de tu amigo…"
        style={{width:"100%",background:"#060c08",border:"1px solid #1a2a1a",borderRadius:8,
          color:"#a0c0a8",fontSize:12,padding:"10px 12px",boxSizing:"border-box",
          fontFamily:"monospace",outline:"none",marginBottom:8}}/>
      {err&&<div style={{fontSize:12,color:"#c05050",marginBottom:8}}>{err}</div>}
      <button onClick={compare}
        style={{width:"100%",padding:"11px 0",background:"linear-gradient(135deg,#0a2a1a,#061810)",
          border:"1px solid #2a6040",borderRadius:10,color:"#50d0a0",cursor:"pointer",
          fontSize:13,fontFamily:BODY,fontWeight:"600",marginBottom:result?12:0}}>
        🔍 Comparar
      </button>

      {result&&(
        <div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
            <div style={{background:"#0a1a10",border:"1px solid #1a4028",borderRadius:10,padding:12,textAlign:"center"}}>
              <div style={{fontSize:26,fontWeight:"400",color:"#50d0a0",fontFamily:DISPLAY,letterSpacing:2}}>{result.theyGiveMe.length}</div>
              <div style={{fontSize:11,color:"#406050",textTransform:"uppercase",letterSpacing:1,marginTop:2}}>Te pueden dar</div>
            </div>
            <div style={{background:"#0d0a1a",border:"1px solid #2a1a40",borderRadius:10,padding:12,textAlign:"center"}}>
              <div style={{fontSize:26,fontWeight:"400",color:"#a080e0",fontFamily:DISPLAY,letterSpacing:2}}>{result.iGiveThem.length}</div>
              <div style={{fontSize:11,color:"#504060",textTransform:"uppercase",letterSpacing:1,marginTop:2}}>Puedes dar</div>
            </div>
          </div>

          {result.theyGiveMe.length>0&&(
            <div style={{background:"#090f0d",border:"1px solid #1a3a28",borderRadius:10,overflow:"hidden",marginBottom:8}}>
              <div style={{padding:"9px 12px",borderBottom:"1px solid #1a3a28"}}>
                <span style={{fontSize:13,color:"#50d0a0",fontWeight:"600"}}>✓ Tu amigo te puede dar ({result.theyGiveMe.length})</span>
              </div>
              <div style={{padding:"8px 12px",display:"flex",flexWrap:"wrap",gap:5}}>
                {result.theyGiveMe.map(({id,count})=>(
                  <div key={id} style={{display:"flex",alignItems:"center",background:"#0a1a12",border:"1px solid #2a5a38",borderRadius:6,overflow:"hidden"}}>
                    <div style={{padding:"4px 8px",fontSize:12,color:"#50d0a0",fontWeight:"600"}}>{id}</div>
                    {count>1&&<div style={{padding:"4px 7px",background:"#0d2018",fontSize:10,color:"#3a7050"}}>×{count}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.iGiveThem.length>0&&(
            <div style={{background:"#090d12",border:"1px solid #1a2a3a",borderRadius:10,overflow:"hidden",marginBottom:8}}>
              <div style={{padding:"9px 12px",borderBottom:"1px solid #1a2a3a"}}>
                <span style={{fontSize:13,color:"#a080e0",fontWeight:"600"}}>◈ Tú le puedes dar ({result.iGiveThem.length})</span>
              </div>
              <div style={{padding:"8px 12px",display:"flex",flexWrap:"wrap",gap:5}}>
                {result.iGiveThem.map(({id,count})=>(
                  <div key={id} style={{display:"flex",alignItems:"center",background:"#0a0d1a",border:"1px solid #2a2a5a",borderRadius:6,overflow:"hidden"}}>
                    <div style={{padding:"4px 8px",fontSize:12,color:"#a080e0",fontWeight:"600"}}>{id}</div>
                    {count>1&&<div style={{padding:"4px 7px",background:"#0d0d20",fontSize:10,color:"#505090"}}>×{count}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.theyGiveMe.length===0&&result.iGiveThem.length===0&&(
            <div style={{textAlign:"center",padding:20,color:"#404050",fontSize:13}}>
              😕 No hay intercambios posibles con este amigo por ahora.
            </div>
          )}

          {(result.theyGiveMe.length>0||result.iGiveThem.length>0)&&(
            <button onClick={()=>{
              const txt=["🔄 Propuesta de intercambio Album WC2026",
                result.theyGiveMe.length>0?"Me das: "+result.theyGiveMe.map(r=>r.id).join(", "):"",
                result.iGiveThem.length>0?"Te doy: "+result.iGiveThem.map(r=>r.id).join(", "):"",
              ].filter(Boolean).join("\n");
              navigator.clipboard?.writeText(txt);
              setCopied(true); setTimeout(()=>setCopied(false),2000);
            }} style={{width:"100%",padding:"10px 0",background:"#0c0c1a",border:"1px solid #303060",
              borderRadius:10,color:copied?"#50d0a0":"#6070c0",cursor:"pointer",fontSize:13,fontFamily:BODY}}>
              {copied?"✓ ¡Copiado!":"⎘ Copiar propuesta para WhatsApp"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── QR Code generator (pure JS, no library) ───────────────────────────────────
// ── QR Market Component ───────────────────────────────────────────────────────
function QRMarket({ repeatList, missing }) {
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState("");

  const buildLink = () => {
    // Only encode repeats — keeps QR small and scannable
    // Missing is inferred by the friend when they compare
    const rCompressed = repeatList.map(({id,count})=>id+":"+count).join(",");
    const marketCode = btoa(rCompressed+"||");
    return window.location.origin + window.location.pathname + "?mercado=" + marketCode;
  };

  const generateQR = async () => {
    setLoading(true); setErr(""); setQrDataUrl(null);
    try {
      const longUrl = buildLink();
      // Shorten with TinyURL public API
      let shortUrl = longUrl;
      try {
        const res = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`);
        if (res.ok) shortUrl = await res.text();
      } catch { /* fallback to long url */ }
      setLink(shortUrl);
      const canvas = document.createElement("canvas");
      await QRCode.toCanvas(canvas, shortUrl, {
        width: 240,
        margin: 2,
        color: { dark: "#e8c84a", light: "#080810" },
      });
      setQrDataUrl(canvas.toDataURL());
    } catch(e) {
      console.error(e);
      setErr("No se pudo generar el QR. Usa el link de abajo.");
    }
    setLoading(false);
  };

  const copyLink = () => {
    navigator.clipboard?.writeText(link || buildLink());
    setCopied(true); setTimeout(()=>setCopied(false), 2000);
  };

  return (
    <div style={{background:"linear-gradient(135deg,#0a1e18,#061410)",border:"1px solid #1a3a28",borderRadius:14,padding:18,marginBottom:12}}>
      <div style={{fontSize:16,fontWeight:"700",marginBottom:4}}>📲 Mi QR de cambios</div>
      <div style={{fontSize:13,color:"#507060",lineHeight:1.6,marginBottom:14}}>
        Genera un QR con tus repetidas. Tu amigo lo escanea, ve cuáles de tus repetidas le faltan a él, y qué puede darte a ti.
      </div>

      {!qrDataUrl && !loading && (
        <button onClick={generateQR}
          style={{width:"100%",padding:"13px 0",background:"linear-gradient(135deg,#0a2a1a,#061810)",
            border:"1px solid #2a6040",borderRadius:10,color:"#50d0a0",cursor:"pointer",
            fontSize:14,fontFamily:BODY,fontWeight:"600"}}>
          Generar mi QR
        </button>
      )}

      {loading && (
        <div style={{textAlign:"center",padding:20}}>
          <div style={{width:28,height:28,border:"3px solid #50d0a022",borderTop:"3px solid #50d0a0",borderRadius:"50%",animation:"spin 0.8s linear infinite",margin:"0 auto 8px"}}/>
          <div style={{fontSize:12,color:"#406050"}}>Acortando link y generando QR…</div>
        </div>
      )}

      {err && (
        <div>
          <div style={{fontSize:12,color:"#c05050",marginBottom:10}}>{err}</div>
          <button onClick={copyLink}
            style={{width:"100%",padding:"11px 0",background:"#0a1a28",border:"1px solid #2a4060",
              borderRadius:10,color:copied?"#50d0a0":"#7090d0",cursor:"pointer",fontSize:13,fontFamily:BODY,fontWeight:"600"}}>
            {copied?"✓ Copiado":"⎘ Copiar link directo"}
          </button>
        </div>
      )}

      {qrDataUrl && (
        <div style={{textAlign:"center"}}>
          <img src={qrDataUrl} style={{width:220,height:220,borderRadius:10,border:"2px solid #e8c84a33",display:"block",margin:"0 auto 10px"}}/>
          <div style={{fontSize:12,color:"#406050",marginBottom:10}}>📷 Tu amigo escanea este QR con la cámara</div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={copyLink}
              style={{flex:1,padding:"10px 0",background:"#0a1a28",border:"1px solid #2a4060",
                borderRadius:10,color:copied?"#50d0a0":"#7090d0",cursor:"pointer",fontSize:13,fontFamily:BODY,fontWeight:"600"}}>
              {copied?"✓ Copiado":"⎘ Copiar link"}
            </button>
            <button onClick={generateQR}
              style={{flex:1,padding:"10px 0",background:"#0a0a14",border:"1px solid #1a1a28",
                borderRadius:10,color:"#405060",cursor:"pointer",fontSize:13,fontFamily:BODY}}>
              ↺ Regenerar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Login Form ────────────────────────────────────────────────────────────────
function LoginForm({ signIn, authLoading }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState("email"); // "email" | "code"
  const [err, setErr] = useState("");
  const [verifying, setVerifying] = useState(false);

  const handleSend = async () => {
    if (!email.includes("@")) { setErr("Email inválido"); return; }
    setErr("");
    const error = await signIn(email);
    if (error) setErr(error.message);
    else setStep("code");
  };

  const handleVerify = async () => {
    if (code.length < 6) { setErr("Código inválido"); return; }
    setErr(""); setVerifying(true);
    const { error } = await supabase.auth.verifyOtp({
      email, token: code, type: "email"
    });
    setVerifying(false);
    if (error) setErr("Código inválido o expirado. Intenta de nuevo.");
  };

  if (step === "code") return (
    <div>
      <div style={{textAlign:"center",marginBottom:14}}>
        <div style={{fontSize:32,marginBottom:8}}>📬</div>
        <div style={{fontSize:14,fontWeight:"600",color:"#50d0a0",marginBottom:4}}>Revisa tu email</div>
        <div style={{fontSize:12,color:"#506060",lineHeight:1.6}}>
          Enviamos un código de 6 dígitos a <strong style={{color:"#a0c0b0"}}>{email}</strong>
        </div>
      </div>
      <input value={code} onChange={e=>setCode(e.target.value.replace(/[^a-zA-Z0-9]/g,"").slice(0,8))}
        placeholder="12345678"
        type="text"
        inputMode="numeric"
        style={{width:"100%",background:"#080810",border:"1px solid #2a2a40",borderRadius:8,
          color:"#e8c84a",fontSize:24,padding:"12px",boxSizing:"border-box",textAlign:"center",
          fontFamily:DISPLAY,letterSpacing:6,outline:"none",marginBottom:8}}/>
      {err && <div style={{fontSize:12,color:"#c05050",marginBottom:8}}>{err}</div>}
      <button onClick={handleVerify} disabled={verifying}
        style={{width:"100%",padding:"12px 0",background:"linear-gradient(135deg,#1a1428,#0e0818)",
          border:"1px solid #6040a0",borderRadius:10,color:"#c080f0",cursor:verifying?"not-allowed":"pointer",
          fontSize:14,fontFamily:BODY,fontWeight:"600",display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:8}}>
        {verifying
          ? <><div style={{width:16,height:16,border:"2px solid #c080f022",borderTop:"2px solid #c080f0",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>Verificando…</>
          : "✓ Confirmar código"}
      </button>
      <button onClick={()=>{setStep("email");setCode("");setErr("");}}
        style={{width:"100%",padding:"8px 0",background:"none",border:"none",
          color:"#404050",cursor:"pointer",fontSize:12,fontFamily:BODY}}>
        ← Usar otro email
      </button>
    </div>
  );

  return (
    <div>
      <div style={{fontSize:13,color:"#506070",lineHeight:1.6,marginBottom:14}}>
        Inicia sesión para guardar tu progreso en la nube y accederlo desde cualquier dispositivo.
      </div>
      <input value={email} onChange={e=>setEmail(e.target.value)}
        placeholder="tu@email.com" type="email"
        style={{width:"100%",background:"#080810",border:"1px solid #2a2a40",borderRadius:8,
          color:"#e0d8f0",fontSize:14,padding:"10px 12px",boxSizing:"border-box",
          fontFamily:BODY,outline:"none",marginBottom:8}}/>
      {err && <div style={{fontSize:12,color:"#c05050",marginBottom:8}}>{err}</div>}
      <button onClick={handleSend} disabled={authLoading}
        style={{width:"100%",padding:"12px 0",background:"linear-gradient(135deg,#1a1428,#0e0818)",
          border:"1px solid #6040a0",borderRadius:10,color:"#c080f0",
          cursor:authLoading?"not-allowed":"pointer",fontSize:14,fontFamily:BODY,fontWeight:"600",
          display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
        {authLoading
          ? <><div style={{width:16,height:16,border:"2px solid #c080f022",borderTop:"2px solid #c080f0",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>Enviando…</>
          : "✉️ Enviar código"}
      </button>
      <div style={{fontSize:11,color:"#303040",textAlign:"center",marginTop:8}}>
        Sin contraseña — recibirás un código de 6 dígitos
      </div>
    </div>
  );
}

// ── Share Card (Instagram Story) ──────────────────────────────────────────────
function ShareCard({ owned, missing, repeatList, pct, totalOwned }) {
  const canvasRef = useRef();
  const [imgUrl, setImgUrl] = useState(null);
  const [generating, setGenerating] = useState(false);

  const groupStats = GROUPS.map(g=>{
    const secs = ALBUM.filter(s=>s.group===g.id);
    const have = secs.reduce((a,s)=>a+s.stickers.filter(st=>owned.has(st.id)).length,0);
    const total = secs.reduce((a,s)=>a+s.stickers.length,0);
    return { id:g.id, pct:Math.round((have/total)*100), col:GROUP_COLORS[g.id] };
  });

  const generate = async () => {
    setGenerating(true);
    // Load Bebas Neue for canvas
    try {
      const font = new FontFace("BebasNeue", "url(https://fonts.gstatic.com/s/bebasneue/v14/JTUSjIg69CK48gW7PXoo9WdhyyTh89ZNpQ.woff2)");
      await font.load();
      document.fonts.add(font);
    } catch(e) { console.warn("Font load failed", e); }

    const W=1080, H=1920;
    const canvas = document.createElement("canvas");
    canvas.width=W; canvas.height=H;
    const c = canvas.getContext("2d");

    // Background
    const bg = c.createLinearGradient(0,0,W,H);
    bg.addColorStop(0,"#08081a"); bg.addColorStop(0.5,"#0a1030"); bg.addColorStop(1,"#080810");
    c.fillStyle=bg; c.fillRect(0,0,W,H);

    // Gold accent line top
    c.fillStyle="#e8c84a"; c.fillRect(0,0,W,6);

    // WC label
    c.fillStyle="#e8c84a88"; c.font="500 42px Inter, sans-serif";
    c.textAlign="center"; c.fillText("MUNDIAL 2026",W/2,100);

    // App name
    c.fillStyle="#e8c84a"; c.font="900 130px BebasNeue, Impact, sans-serif";
    c.fillText("ALBUM",W/2,240);
    c.fillStyle="#ffffff"; c.font="900 130px BebasNeue, Impact, sans-serif";
    c.fillText("TRACKER",W/2,370);

    // Divider
    c.strokeStyle="#e8c84a44"; c.lineWidth=2;
    c.beginPath(); c.moveTo(120,420); c.lineTo(W-120,420); c.stroke();

    // Big % 
    c.fillStyle="#e8c84a"; c.font="900 280px BebasNeue, Impact, sans-serif";
    c.textAlign="center"; c.fillText(pct+"%",W/2,720);
    c.fillStyle="#ffffff99"; c.font="500 52px Inter, sans-serif";
    c.fillText("completado",W/2,790);

    // Stats row
    const stats = [[totalOwned,"Tengo","#22c55e"],[missing.length,"Faltan","#ef4444"],[repeatList.length,"Repetidas","#a855f7"]];
    stats.forEach(([val,label,col],i)=>{
      const x = 180 + i*360;
      c.fillStyle=col; c.font="900 90px BebasNeue, Impact, sans-serif";
      c.textAlign="center"; c.fillText(val,x,930);
      c.fillStyle="#ffffff66"; c.font="500 38px Inter, sans-serif";
      c.fillText(label.toUpperCase(),x,978);
    });

    // Progress bar total
    const bx=100, by=1030, bw=W-200, bh=18;
    c.fillStyle="#1a1a2a"; c.beginPath(); c.roundRect(bx,by,bw,bh,9); c.fill();
    const pg = c.createLinearGradient(bx,0,bx+bw,0);
    pg.addColorStop(0,"#e8c84a"); pg.addColorStop(1,"#f09820");
    c.fillStyle=pg; c.beginPath(); c.roundRect(bx,by,bw*(pct/100),bh,9); c.fill();

    // Group bars
    c.fillStyle="#ffffff"; c.font="600 36px Inter, sans-serif";
    c.textAlign="left"; c.fillText("PROGRESO POR GRUPO",100,1110);
    groupStats.forEach((g,i)=>{
      const row = Math.floor(i/2), col2 = i%2;
      const gx=100+col2*490, gy=1150+row*80;
      const gw=420, gh=14;
      // Label
      c.fillStyle="#ffffff99"; c.font="500 30px Inter, sans-serif";
      c.textAlign="left"; c.fillText(`Grupo ${g.id}`,gx,gy+10);
      c.fillStyle=g.col; c.font="700 30px Inter, sans-serif";
      c.textAlign="right"; c.fillText(g.pct+"%",gx+gw,gy+10);
      // Bar bg
      c.fillStyle="#1a1a2a"; c.beginPath(); c.roundRect(gx,gy+16,gw,gh,7); c.fill();
      // Bar fill
      c.fillStyle=g.col; c.beginPath(); c.roundRect(gx,gy+16,gw*(g.pct/100),gh,7); c.fill();
    });

    // ── Luck level ──
    const RARE_IDS = ["FWC0","ARG17","POR15","FRA20","ESP15","CC1","NOR15","BRA14","ENG15","MEX17"];
    const totalCopies = Object.values(repeatList.reduce((a,{count})=>({...a,total:(a.total||0)+count}),{})).reduce((a,v)=>a+v,0)||0;
    const totalSt = owned.size + repeatList.reduce((a,{count})=>a+count,0);
    const ratio = totalSt > 0 ? owned.size / totalSt : 1;
    const rareCount = RARE_IDS.filter(id=>owned.has(id)).length;
    const luckScore = Math.min(100, Math.round(ratio*100) + rareCount*3);
    const luckLevels = [
      {min:90,emoji:"🍀",label:"LEGENDARIO",    color:"#e8c84a"},
      {min:75,emoji:"⭐",label:"MUY SUERTUDO",  color:"#22c55e"},
      {min:60,emoji:"😊",label:"NORMAL",         color:"#3b82f6"},
      {min:45,emoji:"😅",label:"MALA SUERTE",   color:"#f97316"},
      {min:0, emoji:"💀",label:"EL UNIVERSO TE ODA", color:"#ef4444"},
    ];
    const lv = luckLevels.find(l=>luckScore>=l.min)||luckLevels[luckLevels.length-1];

    // Luck box background
    c.fillStyle="#0e0e1a"; c.beginPath(); c.roundRect(100,1650,W-200,120,16); c.fill();
    c.strokeStyle=lv.color+"66"; c.lineWidth=2; c.beginPath(); c.roundRect(100,1650,W-200,120,16); c.stroke();

    // Luck label
    c.fillStyle=lv.color; c.font=`400 64px BebasNeue, Impact, sans-serif`;
    c.textAlign="left"; c.fillText(`${lv.emoji}  ${lv.label}`,130,1720);

    // Luck score bar
    const lbx=130, lby=1730, lbw=W-260, lbh=12;
    c.fillStyle="#1a1a2a"; c.beginPath(); c.roundRect(lbx,lby,lbw,lbh,6); c.fill();
    c.fillStyle=lv.color; c.beginPath(); c.roundRect(lbx,lby,lbw*(luckScore/100),lbh,6); c.fill();

    // Rare count
    c.fillStyle="#ffffff66"; c.font="500 28px Inter, sans-serif";
    c.textAlign="right"; c.fillText(`Score ${luckScore}/100 · ${rareCount} cromos raros`,W-130,1720);

    // Bottom divider
    c.strokeStyle="#e8c84a44"; c.lineWidth=2;
    c.beginPath(); c.moveTo(120,1800); c.lineTo(W-120,1800); c.stroke();

    // Footer
    c.fillStyle="#e8c84a99"; c.font="500 38px Inter, sans-serif";
    c.textAlign="center"; c.fillText("Hey Samwell · panini-tracker-flame.vercel.app",W/2,1860);

    // Gold line bottom
    c.fillStyle="#e8c84a"; c.fillRect(0,H-6,W,6);

    setImgUrl(canvas.toDataURL("image/png"));
    setGenerating(false);
  };

  return (
    <div style={{background:"linear-gradient(135deg,#0e0e1a,#141428)",border:"1px solid #2a2a50",borderRadius:14,padding:16,marginBottom:14}}>
      <div style={{fontSize:14,fontWeight:"700",marginBottom:4}}>📸 Share Card para Instagram</div>
      <div style={{fontSize:12,color:"#505068",marginBottom:12,lineHeight:1.6}}>
        Genera una imagen de tu progreso lista para Stories o WhatsApp.
      </div>

      {!imgUrl && (
        <button onClick={generate} disabled={generating}
          style={{width:"100%",padding:"12px 0",background:"linear-gradient(135deg,#1a1428,#0e0818)",
            border:"1px solid #8040a0",borderRadius:10,color:"#c080f0",cursor:generating?"not-allowed":"pointer",
            fontSize:14,fontFamily:BODY,fontWeight:"600",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          {generating?<><div style={{width:16,height:16,border:"2px solid #c080f022",borderTop:"2px solid #c080f0",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>Generando…</>:"✨ Generar imagen"}
        </button>
      )}

      {imgUrl && (
        <div>
          {/* Preview */}
          <div style={{borderRadius:10,overflow:"hidden",marginBottom:10,border:"1px solid #2a2a40"}}>
            <img src={imgUrl} style={{width:"100%",display:"block"}} alt="Share card preview"/>
          </div>
          <div style={{display:"flex",gap:8}}>
            <a href={imgUrl} download="mi-progreso-wc26.png"
              style={{flex:1,padding:"11px 0",background:"linear-gradient(135deg,#1a1428,#0e0818)",
                border:"1px solid #8040a0",borderRadius:10,color:"#c080f0",cursor:"pointer",
                fontSize:13,fontFamily:BODY,fontWeight:"600",textAlign:"center",textDecoration:"none",display:"block"}}>
              ⬇ Guardar imagen
            </a>
            <button onClick={()=>setImgUrl(null)}
              style={{flex:1,padding:"11px 0",background:"#0a0a14",border:"1px solid #1a1a28",
                borderRadius:10,color:"#405060",cursor:"pointer",fontSize:13,fontFamily:BODY}}>
              ↺ Regenerar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Onboarding ────────────────────────────────────────────────────────────────
const ONBOARDING_SLIDES = [
  {
    emoji:"⚽",
    title:"Bienvenido al\nAlbum Tracker WC26",
    desc:"Lleva el control de tu álbum Mundial 2026 de forma fácil y rápida.",
    color:"#e8c84a",
  },
  {
    emoji:"👆",
    title:"Marca tus\nfiguritas",
    desc:"Tap en cualquier cajita para marcarla como tuya. Se pone verde. Tap de nuevo para desmarcar.",
    color:"#22c55e",
  },
  {
    emoji:"🔁",
    title:"Registra\nrepetidas",
    desc:"Cuando ya tienes una figurita, toca la barrita \"+ repetida\" para registrar cuántas copias de más tienes.",
    color:"#a855f7",
  },
  {
    emoji:"🔄",
    title:"Intercambia\ncon amigos",
    desc:"En el tab Cambios genera tu QR. Tu amigo lo escanea y ven al instante qué figuritas pueden intercambiar.",
    color:"#50d0a0",
  },
];

function Onboarding({ onDone }) {
  const [slide, setSlide] = useState(0);
  const cur = ONBOARDING_SLIDES[slide];
  const isLast = slide === ONBOARDING_SLIDES.length - 1;

  return (
    <div style={{position:"fixed",inset:0,background:"#080810",zIndex:500,
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
      padding:24,fontFamily:BODY}}>

      {/* Progress dots */}
      <div style={{display:"flex",gap:8,marginBottom:40}}>
        {ONBOARDING_SLIDES.map((_,i)=>(
          <div key={i} style={{width: i===slide ? 24 : 8, height:8, borderRadius:4,
            background: i===slide ? cur.color : "#252535",
            transition:"all 0.3s ease"}}/>
        ))}
      </div>

      {/* Content */}
      <div key={slide} style={{textAlign:"center",maxWidth:320,animation:"fadeIn 0.35s ease"}}>
        <div style={{fontSize:72,marginBottom:24,lineHeight:1}}>{cur.emoji}</div>
        <div style={{fontSize:32,fontWeight:"400",fontFamily:DISPLAY,letterSpacing:1,
          color:cur.color,lineHeight:1.1,marginBottom:16,whiteSpace:"pre-line"}}>
          {cur.title}
        </div>
        <div style={{fontSize:15,color:"#707088",lineHeight:1.7}}>{cur.desc}</div>
      </div>

      {/* Buttons */}
      <div style={{position:"absolute",bottom:48,left:24,right:24,display:"flex",gap:10}}>
        {slide > 0 && (
          <button onClick={()=>setSlide(s=>s-1)}
            style={{flex:1,padding:"14px 0",background:"#0e0e1a",border:"1px solid #2a2a3a",
              borderRadius:12,color:"#606070",cursor:"pointer",fontSize:15,fontFamily:BODY}}>
            Atrás
          </button>
        )}
        <button onClick={()=>isLast ? onDone() : setSlide(s=>s+1)}
          style={{flex:2,padding:"14px 0",
            background:`linear-gradient(135deg,${cur.color}33,${cur.color}18)`,
            border:`1.5px solid ${cur.color}`,borderRadius:12,
            color:cur.color,cursor:"pointer",fontSize:15,fontFamily:BODY,fontWeight:"700"}}>
          {isLast ? "¡Empezar! 🚀" : "Siguiente →"}
        </button>
      </div>

      {/* Skip */}
      {!isLast && (
        <button onClick={onDone}
          style={{position:"absolute",top:52,right:24,background:"none",border:"none",
            color:"#404050",cursor:"pointer",fontSize:13,fontFamily:BODY}}>
          Saltar
        </button>
      )}
    </div>
  );
}

export default function PaniniTracker() {
  const [ready, setReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(()=>{
    const timer = setTimeout(()=>{
      const seen = localStorage.getItem("panini_onboarding_done");
      const hasMercado = new URLSearchParams(window.location.search).has("mercado");
      setShowOnboarding(!seen && !hasMercado);
      setReady(true);
    }, 800);
    return ()=>clearTimeout(timer);
  }, []);

  const finishOnboarding = () => {
    localStorage.setItem("panini_onboarding_done","1");
    setShowOnboarding(false);
  };

  if (!ready) return (
    <div style={{minHeight:"100vh",background:"#080810",display:"flex",flexDirection:"column",
      alignItems:"center",justifyContent:"center",fontFamily:BODY}}>
      <div style={{fontSize:56,marginBottom:16}}>⚽</div>
      <div style={{fontSize:28,fontWeight:"400",color:"#e8c84a",fontFamily:DISPLAY,letterSpacing:3,marginBottom:6}}>
        ALBUM TRACKER WC26
      </div>
      <div style={{fontSize:13,color:"#404058",marginBottom:32}}>Mundial 2026</div>
      <div style={{width:48,height:4,background:"#1a1a2a",borderRadius:2,overflow:"hidden"}}>
        <div style={{height:"100%",width:"40%",background:"#e8c84a",borderRadius:2,
          animation:"loadSlide 1s infinite alternate"}}/>
      </div>
      <style>{`@keyframes loadSlide{from{transform:translateX(0)}to{transform:translateX(150%)}}`}</style>
    </div>
  );

  if (showOnboarding) return <Onboarding onDone={finishOnboarding}/>;

  return <PaniniApp/>;
}

function PaniniApp() {
  const [owned,    setOwned]    = useState(()=>new Set(loadData().owned));
  const [repeated, setRepeated] = useState(()=>loadData().repeated);
  const [tab, setTab] = useState("album");
  const [showTrade, setShowTrade] = useState(false);
  const [friendData, setFriendData] = useState(null);

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const syncTimeout = useRef(null);
  const [showQuickEntry, setShowQuickEntry] = useState(false);
  const [repeatModal, setRepeatModal] = useState(null);
  const [streakData, setStreakData] = useState(()=>loadStreak());
  const [savedPulse, setSavedPulse] = useState(false);
  const [shareMsg, setShareMsg] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [activeGroup, setActiveGroup] = useState("ALL");
  const [searchQ, setSearchQ] = useState("");
  const [toast, setToast] = useState(null);
  const [expandAll, setExpandAll] = useState(false);
  const [stickerHighlight, setStickerHighlight] = useState(null);

  // Listen to auth changes
  useEffect(()=>{
    if (!supabase) return;
    supabase.auth.getSession().then(({data:{session}})=> setUser(session?.user ?? null));
    const {data:{subscription}} = supabase.auth.onAuthStateChange((_,session)=>{
      setUser(session?.user ?? null);
      if (session?.user) loadFromCloud(session.user.id);
    });
    return ()=>subscription.unsubscribe();
  },[]);

  // Load from cloud
  const loadFromCloud = async (userId) => {
    if (!supabase) return;
    const {data} = await supabase.from("albums").select("owned,repeated").eq("user_id",userId).single();
    if (data) { setOwned(new Set(data.owned||[])); setRepeated(data.repeated||{}); }
  };

  // Save to cloud (debounced)
  const saveToCloud = useCallback((newOwned, newRepeated) => {
    if (!user || !supabase) return;
    clearTimeout(syncTimeout.current);
    syncTimeout.current = setTimeout(async ()=>{
      setSyncing(true);
      await supabase.from("albums").upsert({
        user_id: user.id, owned: [...newOwned], repeated: newRepeated,
        updated_at: new Date().toISOString(),
      }, {onConflict:"user_id"});
      setSyncing(false);
    }, 1500);
  },[user]);

  // Sign in with OTP code (no magic link)
  const signIn = async (email) => {
    setAuthLoading(true);
    const {error} = await supabase.auth.signInWithOtp({
      email,
      options:{
        shouldCreateUser: true,
        emailRedirectTo: null,
      }
    });
    setAuthLoading(false);
    return error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // On mount: check if URL has ?mercado= param
  useEffect(()=>{
    const params = new URLSearchParams(window.location.search);
    const code = params.get("mercado");
    if (code) {
      const decoded = decodeMarketLink(code);
      if (decoded) {
        setFriendData(decoded);
        setTab("cambios");
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  }, []);
  const showToast = (msg, emoji, color) => {
    setToast({msg, emoji, color});
    setTimeout(()=>setToast(null), 3500);
  };

  useEffect(()=>{
    saveData(owned,repeated);
    saveToCloud(owned,repeated);
    const newStreak = updateStreak();
    setStreakData(newStreak);
    setSavedPulse(true);
    const t=setTimeout(()=>setSavedPulse(false),1200);
    return()=>clearTimeout(t);
  },[owned,repeated]);

  const toggle = useCallback(id => {
    setOwned(p=>{
      const n = new Set(p);
      const wasOwned = n.has(id);
      wasOwned ? n.delete(id) : n.add(id);
      // Check completion only when marking (not unmarking)
      if (!wasOwned) {
        const sec = CODE_TO_SECTION[id];
        if (sec) {
          const allDone = sec.stickers.every(st => st.id===id || n.has(st.id));
          if (allDone) {
            if (sec.key==="FWCI") showToast("¡FWC Intro completada!", "🌍", "#e8c84a");
            else if (sec.key==="FWCH") showToast("¡FWC Historia completada!", "🏆", "#e8c84a");
            else if (sec.special==="cocacola") showToast("¡Coca-Cola completada!", "🥤", "#e8302a");
            else showToast(`¡${sec.name} completo!`, sec.flag, sec.color);
          }
          // Check full album
          if (n.size === TOTAL) showToast("¡ÁLBUM COMPLETO! 🏆", "⚽", "#e8c84a");
        }
      }
      return n;
    });
  },[]);
  const setRepeat = useCallback((id, count) => setRepeated(p=>{ if(count===0){const nx={...p};delete nx[id];return nx;} return {...p,[id]:count}; }),[]);
  const openRepeatModal = useCallback(id => {
    const sec = CODE_TO_SECTION[id];
    setRepeatModal({ id, color: sec?.color||"#a080ff" });
  },[]);

  const confirmTrade = useCallback((giving, receiving) => {
    // giving: ids I gave away → subtract 1 from my repeats
    setRepeated(p => {
      const nx = {...p};
      giving.forEach(id => {
        if (nx[id] === undefined) return;
        if (nx[id] <= 1) delete nx[id];
        else nx[id] = nx[id] - 1;
      });
      return nx;
    });
    // receiving: ids I got → mark as owned
    setOwned(p => {
      const n = new Set(p);
      receiving.forEach(id => n.add(id));
      return n;
    });
  }, []);

  const clearRepeats = useCallback((ids) => {
    setRepeated(p => {
      const nx = {...p};
      ids.forEach(id => delete nx[id]);
      return nx;
    });
  }, []);

  const totalOwned = owned.size;
  const pct = Math.round((totalOwned/TOTAL)*100);
  const missing = useMemo(()=>ALL_IDS.filter(id=>!owned.has(id)),[owned]);
  const repeatList = useMemo(()=>Object.entries(repeated).map(([id,c])=>({id,count:c})).sort((a,b)=>a.id.localeCompare(b.id)),[repeated]);
  const missingByTeam = useMemo(()=>{ const m={}; missing.forEach(id=>{ const c=id.replace(/\d+$/,""); if(!m[c])m[c]=[]; m[c].push(id); }); return m; },[missing]);
  const totalRepeatCopies = repeatList.reduce((a,r)=>a+r.count,0);
  const myCode = useMemo(()=>encodeTrade(repeatList, missing),[repeatList, missing]);

  const visibleSections = useMemo(()=>{
    let secs = ALBUM;
    if (activeGroup!=="ALL") secs=secs.filter(s=>activeGroup==="FWC"?s.special==="fwc":s.group===activeGroup);
    if (searchQ.trim()) {
      const q = searchQ.trim().toUpperCase();
      // If it's a sticker ID, show only the team that contains it
      if (ALL_IDS.includes(q)) {
        secs = secs.filter(s=>s.stickers.some(st=>st.id===q));
      } else {
        secs = secs.filter(s=>s.key.includes(q)||s.name.toUpperCase().includes(q)||
          (q==="FWC" && s.special==="fwc"));
      }
    }
    return secs;
  },[activeGroup,searchQ]);

  const handlePDF = async () => {
    setPdfLoading(true);
    try { await generatePDF(owned, repeated, missing, repeatList, missingByTeam); }
    catch(e){ console.error(e); alert("Error generando PDF. Intenta de nuevo."); }
    finally { setPdfLoading(false); }
  };

  const TABS=[
    {k:"album",    icon:<IconBook/>,    label:"Álbum"},
    {k:"stats",    icon:<IconBar/>,     label:"Stats"},
    {k:"repetidas",icon:<IconCopy/>,    label:"Repet."},
    {k:"faltantes",icon:<IconCircle/>,  label:"Faltan"},
    {k:"cambios",  icon:<IconArrows/>,  label:"Cambios"},
    {k:"about",
      icon: user
        ? <div style={{width:18,height:18,borderRadius:9,background:"linear-gradient(135deg,#3b82f6,#6366f1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:"bold",color:"#fff"}}>{user.email?.[0]?.toUpperCase()}</div>
        : <IconGear/>,
      label: user ? "Perfil" : "Config"},
  ];

  return (
    <div style={{minHeight:"100vh",background:"#080810",fontFamily:BODY,color:"#e0d8f0"}}>
      <style>{`
        @keyframes slideDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn    { from { opacity:0; } to { opacity:1; } }
        @keyframes tabSlide  { from { opacity:0; transform:translateX(10px); } to { opacity:1; transform:translateX(0); } }
        @keyframes toastIn   { from { opacity:0; transform:translateX(-50%) translateY(20px) scale(0.9); } to { opacity:1; transform:translateX(-50%) translateY(0) scale(1); } }
        @keyframes borderPulse {
          0%   { border-color: var(--tc); box-shadow: 0 8px 32px var(--tc-a); }
          40%  { border-color: #e8c84a; box-shadow: 0 0 40px #e8c84acc, 0 0 80px #e8c84a66; }
          70%  { border-color: #e8c84a; box-shadow: 0 0 60px #e8c84aff, 0 0 120px #e8c84a88; }
          100% { border-color: var(--tc); box-shadow: 0 8px 32px var(--tc-a); }
        }
        .toast-pulse { animation: toastIn 0.3s ease, borderPulse 1.4s ease 0.3s; }
        @keyframes spin      { to { transform:rotate(360deg) } }
        .accordion-content { animation: slideDown 0.2s ease; }
        .tab-content       { animation: tabSlide 0.18s ease; }
        button:active { opacity: 0.85; }
      `}</style>

      {showQuickEntry && <QuickEntryModal onClose={()=>setShowQuickEntry(false)} allIds={ALL_IDS}
        onMark={(ids)=>ids.forEach(id=>{ if(!owned.has(id)) toggle(id); })}/>}
      {toast && (
        <div className="toast-pulse"
          style={{
            "--tc": toast.color,
            "--tc-a": toast.color+"44",
            position:"fixed",bottom:90,left:"50%",transform:"translateX(-50%)",
            background:"linear-gradient(135deg,#1a1a2e,#0e0e1a)",
            border:`2px solid ${toast.color}`,borderRadius:16,
            padding:"14px 20px",zIndex:300,textAlign:"center",
            boxShadow:`0 8px 32px ${toast.color}44`,
            minWidth:220,maxWidth:320}}>
          <div style={{fontSize:32,marginBottom:6}}>{toast.emoji}</div>
          <div style={{fontSize:16,fontWeight:"700",color:toast.color,fontFamily:DISPLAY,letterSpacing:1}}>{toast.msg}</div>
        </div>
      )}
      {showTrade&&<TradeModal myCode={myCode} onClose={()=>setShowTrade(false)} onConfirm={confirmTrade}/>}
      {repeatModal&&(
        <RepeatModal id={repeatModal.id} count={repeated[repeatModal.id]||0} color={repeatModal.color}
          onSet={setRepeat} onClose={()=>setRepeatModal(null)}/>
      )}

      {/* Header + Tabs sticky together */}
      <div style={{position:"sticky",top:0,zIndex:20}}>
      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#0a0f2e 0%,#0d1f5c 40%,#0a1a4a 70%,#0c2860 100%)",padding:"14px 14px 10px",borderBottom:"2px solid #e8c84a"}}>
        <div style={{maxWidth:520,margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
            <div>
              <div style={{fontSize:14,letterSpacing:4,color:"#e8c84a",textTransform:"uppercase",fontFamily:BODY}}>Mundial 2026</div>
              <div style={{fontSize:28,fontWeight:"400",letterSpacing:2,fontFamily:DISPLAY,lineHeight:1}}>Album Tracker WC26</div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              {syncing && <div style={{fontSize:11,color:"#6090d0",letterSpacing:1}}>☁️</div>}
              {savedPulse && !syncing && <div style={{fontSize:11,color:"#60b060",letterSpacing:1}}>💾</div>}
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:32,fontWeight:"400",color:"#e8c84a",lineHeight:1,fontFamily:DISPLAY,letterSpacing:2}}>{pct}%</div>
                <div style={{fontSize:15,color:"#707090"}}>{totalOwned}/{TOTAL}</div>
              </div>
            </div>
          </div>
          <div style={{height:4,background:"#0e1528",borderRadius:2,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${pct}%`,background:"linear-gradient(90deg,#e8c84a,#f09820)",borderRadius:2,transition:"width 0.5s"}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:4,fontSize:15,color:"#404060"}}>
            <span>Faltan: {missing.length}</span>
            <span>Repetidas: {repeatList.length} tipos · {totalRepeatCopies} copias</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{background:"#0c0c18",borderBottom:"1px solid #181828",display:"flex"}}>
        {TABS.map(t=>(
          <button key={t.k} onClick={()=>setTab(t.k)} style={{flex:1,padding:"10px 2px",background:"none",border:"none",cursor:"pointer",color:tab===t.k?"#e8c84a":"#404060",fontSize:9,letterSpacing:0.5,textTransform:"uppercase",borderBottom:tab===t.k?"2px solid #e8c84a":"2px solid transparent",transition:"all 0.2s",display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
            <span style={{display:"flex",alignItems:"center",justifyContent:"center"}}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>
      </div>{/* end sticky wrapper */}

      <div style={{maxWidth:520,margin:"0 auto",padding:"12px 10px 40px"}}>

        {/* ══ ÁLBUM ══ */}
        {tab==="album"&&(
          <div className="tab-content">
            {/* Compact toolbar */}
            <div style={{background:"#0c0c18",border:"1px solid #1a1a28",borderRadius:12,padding:"8px 10px",marginBottom:10}}>
              {/* Row 1: search + expand/collapse icons */}
              <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8}}>
                <div style={{position:"relative",flex:1}}>
                  <input value={searchQ} onChange={e=>{
                    const v = e.target.value.toUpperCase().trim();
                    setSearchQ(e.target.value);
                    if (ALL_IDS.includes(v)) {
                      setStickerHighlight(v);
                      setExpandAll(true);
                      setTimeout(()=>{
                        const el = document.getElementById("sticker-"+v);
                        if (el) el.scrollIntoView({behavior:"smooth", block:"center"});
                      }, 300);
                    } else {
                      setStickerHighlight(null);
                    }
                  }} placeholder="Buscar equipo o figurita…"
                    style={{width:"100%",background:"#080810",border:"1px solid #1e1e2e",borderRadius:8,
                      color:"#e0d8f0",fontSize:13,padding:"7px 28px 7px 10px",boxSizing:"border-box",
                      fontFamily:BODY,outline:"none"}}/>
                  {searchQ && (
                    <button onClick={()=>{setSearchQ(""); setStickerHighlight(null);}}
                      style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",
                        background:"none",border:"none",color:"#505060",fontSize:14,cursor:"pointer",padding:0}}>✕</button>
                  )}
                </div>
                {/* Expand / collapse icons */}
                <button onClick={()=>setExpandAll(true)} title="Expandir todo"
                  style={{background:"none",border:"1px solid #2a2a3a",borderRadius:8,color:"#606070",
                    cursor:"pointer",fontSize:16,padding:"6px 9px",lineHeight:1,flexShrink:0}}>⊞</button>
                <button onClick={()=>setExpandAll(false)} title="Colapsar todo"
                  style={{background:"none",border:"1px solid #2a2a3a",borderRadius:8,color:"#606070",
                    cursor:"pointer",fontSize:16,padding:"6px 9px",lineHeight:1,flexShrink:0}}>⊟</button>
                <button onClick={()=>setShowQuickEntry(true)} title="Entrada rápida"
                  style={{background:"none",border:"1px solid #2a3a2a",borderRadius:8,color:"#507050",
                    cursor:"pointer",fontSize:14,padding:"6px 9px",lineHeight:1,flexShrink:0}}>⌨</button>
              </div>
              {/* Row 2: group filter pills */}
              <div style={{display:"flex",gap:3,overflowX:"auto",scrollbarWidth:"none",WebkitOverflowScrolling:"touch"}}>
                {["ALL","FWC",...GROUPS.map(g=>g.id)].map(g=>{
                  const col = g==="ALL"||g==="FWC" ? "#e8c84a" : (GROUP_COLORS[g]||"#e8c84a");
                  const active = activeGroup===g;
                  return (
                    <button key={g} onClick={()=>{setActiveGroup(g);setSearchQ("");}}
                      style={{flexShrink:0,padding:"3px 9px",borderRadius:20,fontSize:11,cursor:"pointer",
                        fontFamily:BODY,fontWeight:active?"700":"400",whiteSpace:"nowrap",
                        border: active?`1px solid ${col}`:"none",
                        background: active?`${col}22`:"transparent",
                        color: active?col:"#404058"}}>
                      {g==="ALL"?"Todos":g==="FWC"?"🌍 FWC":`${g}`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* FWC */}
            {visibleSections.filter(s=>s.special==="fwc").map(s=>(
              <FWCSpread key={s.key} section={s} owned={owned} repeated={repeated}
                expandAll={expandAll} onToggle={toggle} onOpenRepeat={openRepeatModal}
                onClearRepeats={clearRepeats} stickerHighlight={stickerHighlight}/>
            ))}
            {visibleSections.filter(s=>s.special!=="fwc").map(s=>(
              s.special==="cocacola"
                ? <CCSpread key={s.key} section={s} owned={owned} repeated={repeated} expandAll={expandAll} onToggle={toggle} onOpenRepeat={openRepeatModal} onClearRepeats={clearRepeats} stickerHighlight={stickerHighlight}/>
                : <TeamSpread key={s.key} section={s} owned={owned} repeated={repeated} expandAll={expandAll} onToggle={toggle} onOpenRepeat={openRepeatModal} onClearRepeats={clearRepeats} stickerHighlight={stickerHighlight}/>
            ))}
            {visibleSections.length===0&&<div style={{textAlign:"center",padding:40,color:"#303040",fontSize:12}}>Sin resultados</div>}
            <div style={{display:"flex",gap:12,justifyContent:"center",paddingTop:10,borderTop:"1px solid #141420"}}>
              {[["#70c070","#0a180a","Tengo"],["#a080e0","#1a0a50","Repetida (×N = copias totales)"],["#303048","#0d0d1a","Falta"]].map(([c,bg,l])=>(
                <div key={l} style={{display:"flex",alignItems:"center",gap:4,fontSize:8}}>
                  <div style={{width:10,height:10,borderRadius:3,background:bg,border:`1px solid ${c}88`}}/>
                  <span style={{color:"#404058"}}>{l}</span>
                </div>
              ))}
            </div>
            <div style={{textAlign:"center",fontSize:14,color:"#252535",marginTop:3}}>Tap = marcar · "+ repetida" = registrar copias extra</div>

            {/* Export / Import quick access */}
            <div style={{display:"flex",gap:8,marginTop:14,paddingTop:14,borderTop:"1px solid #141420"}}>
              <button onClick={()=>{
                const data={version:1,date:new Date().toISOString(),owned:[...owned],repeated};
                const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
                const url=URL.createObjectURL(blob);
                const a=document.createElement("a");
                a.href=url; a.download=`mi-album-wc26-${new Date().toISOString().slice(0,10)}.json`; a.click();
                URL.revokeObjectURL(url);
              }} style={{flex:1,padding:"10px 0",background:"#0a1a10",border:"1px solid #2a5a38",borderRadius:10,color:"#50d0a0",cursor:"pointer",fontSize:13,fontFamily:BODY,fontWeight:"600",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                📤 Exportar
              </button>
              <button onClick={()=>{
                const input=document.createElement("input");
                input.type="file"; input.accept=".json";
                input.onchange=e=>{
                  const file=e.target.files[0]; if(!file) return;
                  const reader=new FileReader();
                  reader.onload=ev=>{
                    try {
                      const data=JSON.parse(ev.target.result);
                      if(!data.owned||!data.repeated) throw new Error();
                      if(window.confirm(`¿Importar? (${data.owned.length} figuritas)\nEsto reemplazará tu progreso actual.`)){
                        setOwned(new Set(data.owned)); setRepeated(data.repeated);
                      }
                    } catch { alert("Archivo inválido."); }
                  };
                  reader.readAsText(file);
                };
                input.click();
              }} style={{flex:1,padding:"10px 0",background:"#0a0a1a",border:"1px solid #3a3a6a",borderRadius:10,color:"#8090d0",cursor:"pointer",fontSize:13,fontFamily:BODY,fontWeight:"600",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                📥 Importar
              </button>
            </div>
          </div>
        )}

        {/* ══ ACERCA ══ */}
        {tab==="about"&&(
          <div className="tab-content" style={{paddingTop:8}}>

            {/* ── LOGIN / PERFIL ── */}
            <div style={{background:"linear-gradient(135deg,#0e0e1a,#141428)",border:"1px solid #2a2a50",borderRadius:16,padding:20,marginBottom:12}}>
              <div style={{fontSize:11,color:"#404058",letterSpacing:2,textTransform:"uppercase",marginBottom:12}}>Cuenta</div>

              {!user ? (
                /* Not logged in */
                <LoginForm signIn={signIn} authLoading={authLoading}/>
              ) : (
                /* Logged in */
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
                    <div style={{width:44,height:44,borderRadius:22,background:"linear-gradient(135deg,#e8c84a,#f09820)",
                      display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:"bold",color:"#080810"}}>
                      {(user.email||"?")[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{fontSize:14,fontWeight:"600",color:"#e0d8f0"}}>{user.email}</div>
                      <div style={{fontSize:11,color:"#50d0a0",marginTop:2}}>☁️ Sincronizado en la nube</div>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={()=>{
                      if(window.confirm("¿Subir tu progreso local a la nube? Esto reemplazará los datos guardados en tu cuenta.")) {
                        saveToCloud(owned, repeated);
                      }
                    }} style={{flex:1,padding:"9px 0",background:"#0a1a10",border:"1px solid #2a5a38",
                      borderRadius:10,color:"#50d0a0",cursor:"pointer",fontSize:12,fontFamily:BODY}}>
                      ⬆ Subir local
                    </button>
                    <button onClick={signOut}
                      style={{flex:1,padding:"9px 0",background:"#1a0a0a",border:"1px solid #5a2020",
                        borderRadius:10,color:"#c05050",cursor:"pointer",fontSize:12,fontFamily:BODY}}>
                      Cerrar sesión
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── CONFIGURACIÓN ── */}
            <div style={{background:"#0e0e1a",border:"1px solid #1e1e30",borderRadius:14,padding:16,marginBottom:12}}>
              <div style={{fontSize:11,color:"#404058",letterSpacing:2,textTransform:"uppercase",marginBottom:12}}>Configuración</div>

              {/* Reset onboarding */}
              <button onClick={()=>{
                localStorage.removeItem("panini_onboarding_done");
                window.location.reload();
              }} style={{width:"100%",padding:"11px 0",background:"#0a0a14",border:"1px solid #2a2a40",
                borderRadius:10,color:"#6070a0",cursor:"pointer",fontSize:13,fontFamily:BODY,marginBottom:8,textAlign:"left",paddingLeft:14}}>
                🎓 Ver tutorial de nuevo
              </button>

              {/* Reset all */}
              <button onClick={()=>{
                if(window.confirm("¿Empezar desde cero? Se borrará todo tu progreso y repetidas.")) {
                  setOwned(new Set()); setRepeated({});
                }
              }} style={{width:"100%",padding:"11px 0",background:"#1a0808",border:"1px solid #5a2020",
                borderRadius:10,color:"#c05050",cursor:"pointer",fontSize:13,fontFamily:BODY,textAlign:"left",paddingLeft:14}}>
                🗑 Empezar desde cero
              </button>
            </div>

            {/* ── ACERCA ── */}
            <div style={{background:"linear-gradient(135deg,#0e0e1a,#141428)",border:"1px solid #2a2a50",borderRadius:16,padding:20,marginBottom:12,textAlign:"center"}}>
              <div style={{fontSize:11,color:"#404058",letterSpacing:2,textTransform:"uppercase",marginBottom:16}}>Acerca de</div>
              <div style={{fontSize:48,marginBottom:8}}>⚽</div>
              <div style={{fontSize:28,fontWeight:"400",color:"#e8c84a",letterSpacing:3,fontFamily:DISPLAY,lineHeight:1,marginBottom:4}}>Album Tracker WC26</div>
              <div style={{fontSize:12,color:"#606078",marginBottom:16}}>Mundial 2026 · v1.0</div>
              <div style={{fontSize:13,color:"#9090b0",marginBottom:16}}>Hecho con ❤️ por <strong style={{color:"#e0d8f0"}}>Hey Samwell</strong></div>
              <a href="https://instagram.com/hey_samwell" target="_blank" rel="noopener noreferrer"
                style={{display:"inline-flex",alignItems:"center",gap:6,padding:"8px 16px",
                  background:"linear-gradient(135deg,#833ab4,#fd1d1d,#f77737)",
                  borderRadius:20,color:"#fff",fontSize:13,fontWeight:"600",textDecoration:"none",marginBottom:12}}>
                📸 @hey_samwell
              </a>
            </div>

            {/* ── DONACIÓN ── */}
            <div style={{background:"linear-gradient(135deg,#1a1008,#120c04)",border:"1px solid #3a2808",borderRadius:14,padding:18,marginBottom:12,textAlign:"center"}}>
              <div style={{fontSize:28,marginBottom:8}}>🫙</div>
              <div style={{fontSize:15,fontWeight:"bold",color:"#f0b840",marginBottom:8}}>¿Te ayudó a completar tu álbum?</div>
              <div style={{fontSize:13,color:"#806040",lineHeight:1.7,marginBottom:14}}>
                Ayúdame a completar el mío y regálame un sobrecito ⚽
              </div>
              <a href="https://paypal.me/awesombroso" target="_blank" rel="noopener noreferrer"
                style={{display:"inline-block",padding:"12px 24px",
                  background:"linear-gradient(135deg,#003087,#009cde)",
                  borderRadius:12,color:"#fff",fontSize:14,fontWeight:"bold",textDecoration:"none"}}>
                🎁 Regalar un sobrecito
              </a>
            </div>

            {/* Legal disclaimer */}
            <div style={{textAlign:"center",padding:"10px 8px 4px"}}>
              <div style={{fontSize:10,color:"#252535",lineHeight:1.7}}>
                Unofficial fan-made tracker. Not affiliated with FIFA, Panini or any official tournament partners. All team names, flags and tournament references are used for informational purposes only.
              </div>
            </div>

          </div>
        )}

        {/* ══ REPETIDAS ══ */}
        {tab==="repetidas"&&(
          <div className="tab-content">
            {/* Header stats */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
              <div style={{background:"#0e0e1a",border:"1px solid #3a2a6a",borderRadius:12,padding:14,textAlign:"center"}}>
                <div style={{fontSize:36,fontWeight:"400",color:"#a080e0",fontFamily:DISPLAY,letterSpacing:2,lineHeight:1}}>{repeatList.length}</div>
                <div style={{fontSize:11,color:"#505068",marginTop:4,textTransform:"uppercase",letterSpacing:1}}>Distintas</div>
              </div>
              <div style={{background:"#0e0e1a",border:"1px solid #3a2a6a",borderRadius:12,padding:14,textAlign:"center"}}>
                <div style={{fontSize:36,fontWeight:"400",color:"#c0a0ff",fontFamily:DISPLAY,letterSpacing:2,lineHeight:1}}>{totalRepeatCopies}</div>
                <div style={{fontSize:11,color:"#505068",marginTop:4,textTransform:"uppercase",letterSpacing:1}}>Copias</div>
              </div>
            </div>

            {repeatList.length===0 ? (
              <div style={{textAlign:"center",padding:48,color:"#303048"}}>
                <div style={{fontSize:36,marginBottom:8}}>🔁</div>
                <div style={{fontSize:13}}>Sin repetidas aún — abre el Álbum y registra tus copias</div>
              </div>
            ) : (
              <div>
                {ALBUM.filter(sec=>repeatList.some(r=>r.id.startsWith(sec.key))).map(sec=>{
                  const items = repeatList.filter(r=>r.id.startsWith(sec.key));
                  const copies = items.reduce((a,r)=>a+r.count,0);
                  return (
                    <AccordionTeam key={sec.key} sec={sec} copies={copies} count={items.length}
                      countLabel={`${items.length} fig · ${copies} copias`} badgeColor="#a080e0" badgeBg="#1a1030" badgeBorder="#3a2060">
                      <div style={{padding:"10px 12px",display:"flex",flexWrap:"wrap",gap:6}}>
                        {items.map(({id,count})=>(
                          <button key={id} onClick={()=>openRepeatModal(id)}
                            style={{display:"flex",alignItems:"center",gap:0,background:"#10102a",
                              border:`1.5px solid ${sec.color}55`,borderRadius:20,overflow:"hidden",
                              cursor:"pointer",padding:0,fontFamily:BODY}}>
                            <span style={{padding:"5px 10px",fontSize:12,color:sec.color,fontWeight:"700"}}>{id}</span>
                            <span style={{padding:"5px 8px",background:sec.color+"22",fontSize:11,color:"#c0a0ff",fontWeight:"600",borderLeft:`1px solid ${sec.color}33`}}>×{count}</span>
                          </button>
                        ))}
                      </div>
                    </AccordionTeam>
                  );
                })}

                <button onClick={()=>navigator.clipboard?.writeText(`Mis repetidas Album WC2026:\n${repeatList.map(r=>`${r.id} ×${r.count}`).join("  |  ")}`)}
                  style={{width:"100%",marginTop:4,padding:"11px 0",background:"#0e0e28",border:"1px solid #303080",borderRadius:10,color:"#6070c0",cursor:"pointer",fontSize:13,fontFamily:BODY}}>
                  ⎘ Copiar lista para WhatsApp
                </button>
              </div>
            )}
          </div>
        )}

        {/* ══ FALTAN ══ */}
        {tab==="faltantes"&&(
          <div className="tab-content">
            {/* Header stats */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
              <div style={{background:"#0e0e1a",border:"1px solid #5a2020",borderRadius:12,padding:14,textAlign:"center"}}>
                <div style={{fontSize:36,fontWeight:"400",color:"#ef4444",fontFamily:DISPLAY,letterSpacing:2,lineHeight:1}}>{missing.length}</div>
                <div style={{fontSize:11,color:"#505060",textTransform:"uppercase",letterSpacing:1,marginTop:4}}>Faltantes</div>
              </div>
              <div style={{background:"#0e0e1a",border:"1px solid #1a2a3a",borderRadius:12,padding:14,textAlign:"center",display:"flex",flexDirection:"column",justifyContent:"center",gap:6}}>
                <button onClick={()=>{ const lines=Object.entries(missingByTeam).map(([c,ids])=>`${c}: ${ids.map(id=>id.replace(c,"")).join(" ")}`).join("\n"); navigator.clipboard?.writeText(`Faltan ${missing.length}:\n\n${lines}`); setShareMsg(true); setTimeout(()=>setShareMsg(false),2500); }}
                  style={{padding:"7px 0",background:"#0e0e28",border:"1px solid #303080",borderRadius:8,color:shareMsg?"#50d0a0":"#6070c0",cursor:"pointer",fontSize:12,fontFamily:BODY,fontWeight:"600"}}>
                  {shareMsg?"✓ Copiado":"⎘ Copiar lista"}
                </button>
                <button onClick={handlePDF} disabled={pdfLoading}
                  style={{padding:"7px 0",background:"#1a1020",border:"1px solid #6040a0",borderRadius:8,color:pdfLoading?"#504060":"#c090f0",cursor:pdfLoading?"not-allowed":"pointer",fontSize:12,fontFamily:BODY,fontWeight:"600",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                  {pdfLoading?<><div style={{width:12,height:12,border:"2px solid #50407044",borderTop:"2px solid #c090f0",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>PDF</>:<>📄 PDF</>}
                </button>
              </div>
            </div>

            {missing.length===0 ? (
              <div style={{textAlign:"center",padding:48}}>
                <div style={{fontSize:48,marginBottom:12}}>🏆</div>
                <div style={{fontSize:16,fontWeight:"400",color:"#60b060",fontFamily:DISPLAY,letterSpacing:2}}>¡ÁLBUM COMPLETO!</div>
              </div>
            ) : (
              ALBUM.filter(s=>missingByTeam[s.key]?.length>0).map(s=>{
                const mis = missingByTeam[s.key]||[];
                const col = s.color;
                return (
                  <AccordionTeam key={s.key} sec={s} count={mis.length}
                    countLabel={`Faltan ${mis.length}`} badgeColor="#ef4444" badgeBg="#1a0808" badgeBorder="#5a2020">
                    <div style={{padding:"10px 12px",display:"flex",flexWrap:"wrap",gap:5}}>
                      {mis.map(id=>(
                        <button key={id} onClick={()=>toggle(id)}
                          style={{padding:"4px 10px",borderRadius:20,background:"#0e0e1a",
                            border:`1px solid ${col}33`,color:"#606078",fontSize:11,
                            cursor:"pointer",fontFamily:BODY,fontWeight:"600"}}>
                          {id.replace(s.key,"")} <span style={{color:col+"66",fontSize:10}}>{s.key}</span>
                        </button>
                      ))}
                    </div>
                  </AccordionTeam>
                );
              })
            )}
          </div>
        )}

        {/* ══ STATS ══ */}
        {tab==="stats"&&(
          <div className="tab-content">
            {/* Hero progress ring area */}
            <div style={{background:"linear-gradient(135deg,#0e0e1a,#141428)",border:"1px solid #2a2a50",borderRadius:16,padding:20,marginBottom:14,textAlign:"center"}}>
              <div style={{fontSize:13,color:"#606078",letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>Progreso total</div>
              {/* Big circle */}
              <div style={{position:"relative",width:140,height:140,margin:"0 auto 16px"}}>
                <svg width="140" height="140" style={{transform:"rotate(-90deg)"}}>
                  <circle cx="70" cy="70" r="58" fill="none" stroke="#1a1a2a" strokeWidth="12"/>
                  <circle cx="70" cy="70" r="58" fill="none" stroke="#e8c84a" strokeWidth="12"
                    strokeDasharray={`${2*Math.PI*58*pct/100} ${2*Math.PI*58}`}
                    strokeLinecap="round"/>
                </svg>
                <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                  <div style={{fontSize:36,fontWeight:"400",color:"#e8c84a",lineHeight:1,fontFamily:DISPLAY,letterSpacing:3}}>{pct}%</div>
                  <div style={{fontSize:11,color:"#606078",marginTop:2}}>completado</div>
                </div>
              </div>
              {/* 3 stats */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                {[
                  [owned.size, "Tengo", "#70c070"],
                  [missing.length, "Faltan", "#c05050"],
                  [repeatList.length, "Repetidas", "#a080e0"],
                ].map(([val,label,color])=>(
                  <div key={label} style={{background:"#111120",borderRadius:10,padding:"10px 4px"}}>
                    <div style={{fontSize:32,fontWeight:"400",color,fontFamily:DISPLAY,letterSpacing:2,lineHeight:1}}>{val}</div>
                    <div style={{fontSize:11,color:"#404058",marginTop:4,fontFamily:BODY}}>{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── RACHA ── */}
            {(()=>{
              const today = new Date().toISOString().slice(0,10);
              const firstDay = streakData.firstDay || today;
              const daysSince = Math.floor((new Date(today) - new Date(firstDay)) / 86400000) + 1;
              const streak = streakData.streak || 0;
              const maxStreak = streakData.maxStreak || 0;
              const lastDay = streakData.lastDay;
              const isActiveToday = lastDay === today;
              const isActiveYesterday = lastDay === new Date(Date.now()-86400000).toISOString().slice(0,10);

              return (
                <div style={{background:"#0e0e1a",border:"1px solid #1e1e30",borderRadius:14,overflow:"hidden",marginBottom:14}}>
                  <div style={{padding:"12px 16px",borderBottom:"1px solid #1a1a28"}}>
                    <div style={{fontSize:13,fontWeight:"700",color:"#e0d8f0"}}>📅 Mi trayectoria</div>
                  </div>
                  <div style={{padding:"12px 16px"}}>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:10}}>
                      <div style={{background:"#111120",borderRadius:10,padding:"10px 6px",textAlign:"center"}}>
                        <div style={{fontSize:28,fontWeight:"400",color:"#e8c84a",fontFamily:DISPLAY,letterSpacing:2,lineHeight:1}}>{daysSince}</div>
                        <div style={{fontSize:10,color:"#404058",marginTop:4,textTransform:"uppercase",letterSpacing:1}}>días coleccionando</div>
                      </div>
                      <div style={{background:"#111120",borderRadius:10,padding:"10px 6px",textAlign:"center"}}>
                        <div style={{fontSize:28,fontWeight:"400",color: isActiveToday?"#50d0a0":isActiveYesterday?"#f97316":"#606078",fontFamily:DISPLAY,letterSpacing:2,lineHeight:1}}>
                          {streak}{isActiveToday?"🔥":""}
                        </div>
                        <div style={{fontSize:10,color:"#404058",marginTop:4,textTransform:"uppercase",letterSpacing:1}}>racha actual</div>
                      </div>
                      <div style={{background:"#111120",borderRadius:10,padding:"10px 6px",textAlign:"center"}}>
                        <div style={{fontSize:28,fontWeight:"400",color:"#a855f7",fontFamily:DISPLAY,letterSpacing:2,lineHeight:1}}>{maxStreak}</div>
                        <div style={{fontSize:10,color:"#404058",marginTop:4,textTransform:"uppercase",letterSpacing:1}}>mejor racha</div>
                      </div>
                    </div>
                    {lastDay && (
                      <div style={{fontSize:11,color:"#303048",textAlign:"center"}}>
                        {isActiveToday ? "🟢 Activo hoy" : `Último registro: ${lastDay}`}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* ── NIVEL DE SUERTE ── */}
            {(()=>{
              const totalCopies = Object.values(repeated).reduce((a,v)=>a+v,0);
              const totalStickers = owned.size + totalCopies;
              const ratio = totalStickers > 0 ? owned.size / totalStickers : 1;

              const RARE = [
                {id:"FWC0",  emoji:"⭐", note:"La legendaria"},
                {id:"ARG17", emoji:"🇦🇷", note:"ARG17"},
                {id:"POR15", emoji:"🇵🇹", note:"POR15"},
                {id:"FRA20", emoji:"🇫🇷", note:"FRA20"},
                {id:"ESP15", emoji:"🇪🇸", note:"ESP15"},
                {id:"CC1",   emoji:"🥤", note:"CC1"},
                {id:"NOR15", emoji:"🇳🇴", note:"NOR15"},
                {id:"BRA14", emoji:"🇧🇷", note:"BRA14"},
                {id:"ENG15", emoji:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", note:"ENG15"},
                {id:"MEX17", emoji:"🇲🇽", note:"MEX17"},
              ];
              const rareOwned = RARE.filter(r=>owned.has(r.id));
              const rareBonusPct = rareOwned.length * 3;
              const luckScore = Math.min(100, Math.round(ratio * 100) + rareBonusPct);

              const levels = [
                {min:90, emoji:"🍀", label:"Legendario",         color:"#e8c84a", msg:"El álbum te ama. Naciste con suerte."},
                {min:75, emoji:"⭐", label:"Muy suertudo",       color:"#22c55e", msg:"Claramente tienes algún truco. Bien jugado."},
                {min:60, emoji:"😊", label:"Normal",              color:"#3b82f6", msg:"Ni muy buena ni muy mala. La vida promedio del coleccionista."},
                {min:45, emoji:"😅", label:"Mala suerte",        color:"#f97316", msg:"Los sobres te están trolleando. Sigue intentando."},
                {min:0,  emoji:"💀", label:"El universo te odia", color:"#ef4444", msg:"Tantas repetidas... ¿estás bien? ¿necesitas un abrazo?"},
              ];
              const level = levels.find(l=>luckScore>=l.min) || levels[levels.length-1];

              return (
                <div style={{background:"linear-gradient(135deg,#0e0e1a,#141428)",border:`2px solid ${level.color}44`,borderRadius:14,padding:18,marginBottom:14}}>
                  <div style={{fontSize:13,color:"#606078",letterSpacing:2,textTransform:"uppercase",marginBottom:12,fontWeight:"600"}}>🎲 Nivel de suerte</div>
                  <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:14}}>
                    <div style={{position:"relative",width:80,height:80,flexShrink:0}}>
                      <svg width="80" height="80" style={{transform:"rotate(-90deg)"}}>
                        <circle cx="40" cy="40" r="32" fill="none" stroke="#1a1a2a" strokeWidth="8"/>
                        <circle cx="40" cy="40" r="32" fill="none" stroke={level.color} strokeWidth="8"
                          strokeDasharray={`${2*Math.PI*32*luckScore/100} ${2*Math.PI*32}`}
                          strokeLinecap="round"/>
                      </svg>
                      <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                        <div style={{fontSize:22,lineHeight:1}}>{level.emoji}</div>
                      </div>
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:22,fontWeight:"400",color:level.color,fontFamily:DISPLAY,letterSpacing:2,lineHeight:1,marginBottom:4}}>
                        {level.label.toUpperCase()}
                      </div>
                      <div style={{fontSize:12,color:"#606078",lineHeight:1.5}}>{level.msg}</div>
                    </div>
                  </div>
                  <div style={{height:8,background:"#111120",borderRadius:4,overflow:"hidden",marginBottom:8}}>
                    <div style={{height:"100%",width:`${luckScore}%`,background:`linear-gradient(90deg,${level.color}88,${level.color})`,borderRadius:4,transition:"width 0.8s ease"}}/>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#404058",marginBottom:12}}>
                    <span>Score: {luckScore}/100</span>
                    <span>{owned.size} únicas · {totalCopies} copias de más</span>
                  </div>
                  {totalStickers > 0 && (
                    <div style={{background:"#080810",borderRadius:10,padding:10}}>
                      <div style={{fontSize:11,color:"#505068",marginBottom:8,letterSpacing:1,textTransform:"uppercase"}}>
                        Cromos raros {rareOwned.length}/{RARE.length}
                      </div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                        {RARE.map(r=>{
                          const has = owned.has(r.id);
                          const isLegend = r.id==="FWC0";
                          return (
                            <div key={r.id} title={r.note} style={{padding:"5px 10px",borderRadius:6,fontSize:12,fontWeight:"600",
                              background: has ? (isLegend?"#2a1a00":"#0a1a10") : "#111120",
                              border: has ? (isLegend?"1px solid #e8c84a":"1px solid #2a5a38") : "1px solid #1a1a2a",
                              color: has ? (isLegend?"#e8c84a":"#50d0a0") : "#303040"}}>
                              {r.emoji} {r.id}
                            </div>
                          );
                        })}
                      </div>
                      {rareOwned.length > 0 && (
                        <div style={{fontSize:11,color:"#405040",marginTop:8}}>
                          +{rareBonusPct}% bonus por cromos raros
                        </div>
                      )}
                    </div>
                  )}
                  {totalStickers === 0 && (
                    <div style={{textAlign:"center",fontSize:12,color:"#303040",padding:8}}>
                      Marca algunas figuritas para calcular tu suerte
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Share Card */}
            <ShareCard owned={owned} missing={missing} repeatList={repeatList} pct={pct} totalOwned={owned.size}/>
            <div style={{background:"#0e0e1a",border:"1px solid #1e1e30",borderRadius:14,overflow:"hidden",marginBottom:14}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid #1a1a28"}}>
                <div style={{fontSize:13,fontWeight:"700",color:"#e0d8f0"}}>Progreso por sección</div>
              </div>
              <div style={{padding:"8px 16px 12px"}}>
                {[{key:"FWCI",label:"FWC · Intro",flag:"🌍"},{key:"FWCH",label:"FWC · Historia",flag:"🏆"}].map(({key,label,flag})=>{
                  const sec = ALBUM.find(s=>s.key===key);
                  if (!sec) return null;
                  const have = sec.stickers.filter(st=>owned.has(st.id)).length;
                  const total = sec.stickers.length;
                  const gPct = Math.round((have/total)*100);
                  return (
                    <div key={key} style={{marginBottom:10}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                        <div style={{display:"flex",alignItems:"center",gap:6}}>
                          <div style={{width:8,height:8,borderRadius:4,background:"#e8c84a",flexShrink:0}}/>
                          <span style={{fontSize:12,color:"#a0a0c0",fontWeight:"600"}}>{flag} {label}</span>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:6}}>
                          <span style={{fontSize:12,color:"#e8c84a",fontWeight:"700"}}>{gPct}%</span>
                          <span style={{fontSize:11,color:"#404058"}}>{have}/{total}</span>
                        </div>
                      </div>
                      <div style={{height:6,background:"#111120",borderRadius:3,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${gPct}%`,background:"#e8c84a",borderRadius:3,transition:"width 0.5s"}}/>
                      </div>
                    </div>
                  );
                })}
                {GROUPS.map(g=>{
                  const teamSecs = ALBUM.filter(s=>s.group===g.id);
                  const have = teamSecs.reduce((a,s)=>a+s.stickers.filter(st=>owned.has(st.id)).length,0);
                  const total = teamSecs.reduce((a,s)=>a+s.stickers.length,0);
                  const gPct = Math.round((have/total)*100);
                  const col = GROUP_COLORS[g.id];
                  return (
                    <div key={g.id} style={{marginBottom:10}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                        <div style={{display:"flex",alignItems:"center",gap:6}}>
                          <div style={{width:8,height:8,borderRadius:4,background:col,flexShrink:0}}/>
                          <span style={{fontSize:12,color:"#a0a0c0",fontWeight:"600"}}>Grupo {g.id}</span>
                          <span style={{fontSize:11,color:"#404058"}}>{g.teams.map(t=>t.flag).join(" ")}</span>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:6}}>
                          <span style={{fontSize:12,color:col,fontWeight:"700"}}>{gPct}%</span>
                          <span style={{fontSize:11,color:"#404058"}}>{have}/{total}</span>
                        </div>
                      </div>
                      <div style={{height:6,background:"#111120",borderRadius:3,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${gPct}%`,background:col,borderRadius:3,transition:"width 0.5s"}}/>
                      </div>
                    </div>
                  );
                })}
                {(()=>{
                  const sec = ALBUM.find(s=>s.special==="cocacola");
                  if (!sec) return null;
                  const have = sec.stickers.filter(st=>owned.has(st.id)).length;
                  const total = sec.stickers.length;
                  const gPct = Math.round((have/total)*100);
                  return (
                    <div style={{marginBottom:10}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                        <div style={{display:"flex",alignItems:"center",gap:6}}>
                          <div style={{width:8,height:8,borderRadius:4,background:"#e8302a",flexShrink:0}}/>
                          <span style={{fontSize:12,color:"#a0a0c0",fontWeight:"600"}}>🥤 Coca-Cola</span>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:6}}>
                          <span style={{fontSize:12,color:"#e8302a",fontWeight:"700"}}>{gPct}%</span>
                          <span style={{fontSize:11,color:"#404058"}}>{have}/{total}</span>
                        </div>
                      </div>
                      <div style={{height:6,background:"#111120",borderRadius:3,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${gPct}%`,background:"#e8302a",borderRadius:3,transition:"width 0.5s"}}/>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Compartir por WhatsApp */}
            {(()=>{
              const top = GROUPS.map(g=>{const s=ALBUM.filter(s=>s.group===g.id);const h=s.reduce((a,s)=>a+s.stickers.filter(st=>owned.has(st.id)).length,0);const t=s.reduce((a,s)=>a+s.stickers.length,0);return{id:g.id,pct:Math.round((h/t)*100)};}).sort((a,b)=>b.pct-a.pct)[0];
              const topLabel = top ? "Grupo "+top.id+" ("+top.pct+"%)" : "—";
              const txt = "⚽ Mi progreso Album Tracker WC26\n📊 "+pct+"% completado ("+owned.size+"/994)\n✅ Tengo: "+owned.size+" | ❌ Faltan: "+missing.length+" | 🔄 Repetidas: "+repeatList.length+"\n🏆 Top grupo: "+topLabel+"\n📅 "+(streakData.streak || 0)+" días de racha 🔥\n📱 panini-tracker-flame.vercel.app";
              return (
                <div style={{background:"#0e0e1a",border:"1px solid #1e1e30",borderRadius:14,padding:14,marginBottom:14}}>
                  <div style={{fontSize:13,fontWeight:"700",marginBottom:4}}>Compartir progreso</div>
                  <div style={{background:"#080810",border:"1px solid #1a1a2a",borderRadius:8,padding:"10px 12px",marginBottom:10,fontSize:11,color:"#606078",lineHeight:1.7,fontFamily:"monospace",whiteSpace:"pre-line"}}>
                    {txt}
                  </div>
                  <button onClick={()=>navigator.clipboard?.writeText(txt)}
                    style={{width:"100%",padding:"11px 0",background:"linear-gradient(135deg,#0a2018,#061410)",
                      border:"1px solid #2a6040",borderRadius:10,color:"#50d0a0",cursor:"pointer",
                      fontSize:13,fontFamily:BODY,fontWeight:"600"}}>
                    ⎘ Copiar para WhatsApp
                  </button>
                </div>
              );
            })()}

            {/* Share Card */}
            <ShareCard owned={owned} missing={missing} repeatList={repeatList} pct={pct} totalOwned={owned.size}/>

            {/* Progress by group */}
              <div style={{fontSize:13,fontWeight:"700",marginBottom:4}}>Mis datos</div>
              <div style={{fontSize:12,color:"#505068",marginBottom:12,lineHeight:1.6}}>
                Exporta tu progreso para abrirlo en otro dispositivo o guardarlo como respaldo.
              </div>
              <div style={{display:"flex",gap:8}}>
                {/* Export */}
                <button onClick={()=>{
                  const data = {
                    version: 1,
                    date: new Date().toISOString(),
                    owned: [...owned],
                    repeated,
                  };
                  const blob = new Blob([JSON.stringify(data, null, 2)], {type:"application/json"});
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `mi-album-wc26-${new Date().toISOString().slice(0,10)}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                  style={{flex:1,padding:"12px 0",background:"#0a1a10",border:"1px solid #2a5a38",
                    borderRadius:10,color:"#50d0a0",cursor:"pointer",fontSize:13,
                    fontFamily:"inherit",fontWeight:"600"}}>
                  📤 Exportar
                </button>

                {/* Import */}
                <button onClick={()=>{
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = ".json";
                  input.onchange = (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      try {
                        const data = JSON.parse(ev.target.result);
                        if (!data.owned || !data.repeated) throw new Error("Formato inválido");
                        if (window.confirm(`¿Importar este álbum? (${data.owned.length} figuritas)\nEsto reemplazará tu progreso actual.`)) {
                          setOwned(new Set(data.owned));
                          setRepeated(data.repeated);
                        }
                      } catch {
                        alert("Archivo inválido. Asegúrate de usar un archivo exportado desde esta app.");
                      }
                    };
                    reader.readAsText(file);
                  };
                  input.click();
                }}
                  style={{flex:1,padding:"12px 0",background:"#0a0a1a",border:"1px solid #3a3a6a",
                    borderRadius:10,color:"#8090d0",cursor:"pointer",fontSize:13,
                    fontFamily:"inherit",fontWeight:"600"}}>
                  📥 Importar
                </button>
              </div>
            </div>
          </div>
        )}


        {tab==="cambios"&&(
          <div className="tab-content">

            {/* ── MI QR DE CAMBIOS ── */}
            <QRMarket repeatList={repeatList} missing={missing} />

            {/* ── STATS ── */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
              <div style={{background:"#0c0c18",border:"1px solid #1a3a28",borderRadius:10,padding:12,textAlign:"center"}}>
                <div style={{fontSize:28,fontWeight:"400",color:"#50d0a0",fontFamily:DISPLAY,letterSpacing:2}}>{repeatList.length}</div>
                <div style={{fontSize:12,color:"#406050",letterSpacing:1,textTransform:"uppercase",marginTop:2}}>Puedo ofrecer</div>
              </div>
              <div style={{background:"#0c0c18",border:"1px solid #1a2a3a",borderRadius:10,padding:12,textAlign:"center"}}>
                <div style={{fontSize:28,fontWeight:"400",color:"#8090d0",fontFamily:DISPLAY,letterSpacing:2}}>{missing.length}</div>
                <div style={{fontSize:15,color:"#405060",letterSpacing:1,textTransform:"uppercase",marginTop:2}}>Necesito</div>
              </div>
            </div>

            {/* ── VER LINK DE AMIGO ── */}
            <div style={{background:"#0e0e1a",border:"1px solid #2a2a40",borderRadius:14,padding:18,marginBottom:12}}>
              <div style={{fontSize:16,fontWeight:"700",marginBottom:4}}>👀 Ver perfil de un amigo</div>
              {friendData && (
                <div style={{background:"#0a2a1a",border:"1px solid #2a6040",borderRadius:8,padding:"8px 12px",marginBottom:10,fontSize:12,color:"#50d0a0"}}>
                  ✓ Datos del QR detectados — comparando automáticamente con tu álbum
                </div>
              )}
              <div style={{fontSize:13,color:"#506070",lineHeight:1.6,marginBottom:12}}>
                Pega el link que te mandó tu amigo para ver sus repetidas y faltantes, y compara con las tuyas.
              </div>
              <FriendLinkInput myRepeats={repeatList} myMissing={missing} onConfirm={confirmTrade} preloaded={friendData}/>
            </div>

            {/* ── COMPARADOR CLÁSICO ── */}
            <div style={{background:"#0a0a14",border:"1px solid #1a1a28",borderRadius:14,padding:18}}>
              <div style={{fontSize:16,fontWeight:"700",marginBottom:4}}>🔄 Comparador de códigos</div>
              <div style={{fontSize:13,color:"#405060",lineHeight:1.6,marginBottom:12}}>
                También puedes usar el comparador original intercambiando códigos de texto.
              </div>
              <button onClick={()=>setShowTrade(true)}
                style={{width:"100%",padding:"12px 0",background:"linear-gradient(135deg,#0a2a1a,#061810)",
                  border:"1px solid #2a6040",borderRadius:10,color:"#50d0a0",cursor:"pointer",
                  fontSize:14,fontFamily:BODY,fontWeight:"600"}}>
                Abrir comparador de códigos
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
