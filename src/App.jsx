import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Analytics } from "@vercel/analytics/react";

// Load Inter from Google Fonts
if (typeof document !== "undefined" && !document.getElementById("inter-font")) {
  const link = document.createElement("link");
  link.id = "inter-font";
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap";
  document.head.appendChild(link);
}

// ── Album data ────────────────────────────────────────────────────────────────
const GROUPS = [
  { id:"A", teams:[{code:"MEX",name:"Mexico",flag:"🇲🇽"},{code:"RSA",name:"South Africa",flag:"🇿🇦"},{code:"KOR",name:"Korea Republic",flag:"🇰🇷"},{code:"CZE",name:"Czechia",flag:"🇨🇿"}] },
  { id:"B", teams:[{code:"CAN",name:"Canada",flag:"🇨🇦"},{code:"BIH",name:"Bosnia-Herzegovina",flag:"🇧🇦"},{code:"QAT",name:"Qatar",flag:"🇶🇦"},{code:"SUI",name:"Switzerland",flag:"🇨🇭"}] },
  { id:"C", teams:[{code:"BRA",name:"Brazil",flag:"🇧🇷"},{code:"MAR",name:"Morocco",flag:"🇲🇦"},{code:"HAI",name:"Haiti",flag:"🇭🇹"},{code:"SCO",name:"Scotland",flag:"🏴󠁧󠁢󠁳󠁣󠁴󠁿"}] },
  { id:"D", teams:[{code:"USA",name:"USA",flag:"🇺🇸"},{code:"PAR",name:"Paraguay",flag:"🇵🇾"},{code:"AUS",name:"Australia",flag:"🇦🇺"},{code:"TUR",name:"Türkiye",flag:"🇹🇷"}] },
  { id:"E", teams:[{code:"GER",name:"Germany",flag:"🇩🇪"},{code:"CUW",name:"Curaçao",flag:"🏝️"},{code:"CIV",name:"Côte d'Ivoire",flag:"🇨🇮"},{code:"ECU",name:"Ecuador",flag:"🇪🇨"}] },
  { id:"F", teams:[{code:"NED",name:"Netherlands",flag:"🇳🇱"},{code:"JPN",name:"Japan",flag:"🇯🇵"},{code:"SWE",name:"Sweden",flag:"🇸🇪"},{code:"TUN",name:"Tunisia",flag:"🇹🇳"}] },
  { id:"G", teams:[{code:"BEL",name:"Belgium",flag:"🇧🇪"},{code:"EGV",name:"Egypt",flag:"🇪🇬"},{code:"IRN",name:"IR Iran",flag:"🇮🇷"},{code:"NZL",name:"New Zealand",flag:"🇳🇿"}] },
  { id:"H", teams:[{code:"ESP",name:"Spain",flag:"🇪🇸"},{code:"CPV",name:"Cabo Verde",flag:"🇨🇻"},{code:"KSA",name:"Saudi Arabia",flag:"🇸🇦"},{code:"URU",name:"Uruguay",flag:"🇺🇾"}] },
  { id:"I", teams:[{code:"FRA",name:"France",flag:"🇫🇷"},{code:"SEN",name:"Senegal",flag:"🇸🇳"},{code:"IRQ",name:"Iraq",flag:"🇮🇶"},{code:"NOR",name:"Norway",flag:"🇳🇴"}] },
  { id:"J", teams:[{code:"ARG",name:"Argentina",flag:"🇦🇷"},{code:"ALG",name:"Algeria",flag:"🇩🇿"},{code:"AUT",name:"Austria",flag:"🇦🇹"},{code:"JOR",name:"Jordan",flag:"🇯🇴"}] },
  { id:"K", teams:[{code:"POR",name:"Portugal",flag:"🇵🇹"},{code:"COD",name:"Congo DR",flag:"🇨🇩"},{code:"UZB",name:"Uzbekistan",flag:"🇺🇿"},{code:"COL",name:"Colombia",flag:"🇨🇴"}] },
  { id:"L", teams:[{code:"ENG",name:"England",flag:"🏴󠁧󠁢󠁥󠁮󠁧󠁿"},{code:"CRO",name:"Croatia",flag:"🇭🇷"},{code:"GHA",name:"Ghana",flag:"🇬🇭"},{code:"PAN",name:"Panama",flag:"🇵🇦"}] },
];
const GROUP_COLORS = { A:"#5a9a70",B:"#5a709a",C:"#9a7050",D:"#7050aa",E:"#aa5050",F:"#50aaaa",G:"#8a8a40",H:"#aa5080",I:"#508a50",J:"#8a5050",K:"#5050aa",L:"#7aaa50" };

const buildAlbum = () => {
  const secs = [];
  secs.push({ key:"FWC", name:"FWC", flag:"🌍", group:null, color:"#e8c84a",
    stickers: Array.from({length:20},(_,i)=>({id:`FWC${i}`,num:i})) });
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
const loadData = () => { try { const r=localStorage.getItem(SK); return r?JSON.parse(r):{owned:[],repeated:{}}; } catch { return {owned:[],repeated:{}}; }};
const saveData = (o,r) => { try { localStorage.setItem(SK,JSON.stringify({owned:[...o],repeated:r})); } catch {} };

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
  doc.text("Panini FIFA World Cup 2026™", W/2, 22, {align:"center"});
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
    doc.text("Panini FIFA World Cup 2026™ Tracker", margin, 292);
    doc.text(`Pág. ${i} / ${pages}`, W-margin, 292, {align:"right"});
  }

  doc.save(`panini-wc2026-${new Date().toISOString().slice(0,10)}.pdf`);
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
function StickerBox({ id, num, color, size, owned, repeated, onToggle, onOpenRepeat }) {
  size = size || "md";
  const has = owned.has(id);
  const rep = repeated[id] || 0;
  const minH = size==="lg" ? 90 : size==="md" ? 72 : 56;
  const numFs = size==="lg" ? 18 : size==="md" ? 15 : 12;
  const bg   = has ? (rep>0 ? "#2a1a6e" : color+"22") : "#0d0d1a";
  const bCol = has ? (rep>0 ? "#8060e0" : color)       : "#252535";
  const textC= has ? (rep>0 ? "#c0a0ff" : color)       : "#35354a";

  return (
    <div style={{width:"100%",minHeight:minH,background:bg,border:"1.5px solid "+bCol,borderRadius:8,
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
      transition:"all 0.15s",position:"relative",fontFamily:"Inter, system-ui, sans-serif",
      overflow:"hidden",userSelect:"none",WebkitUserSelect:"none"}}>

      {/* Main tap area */}
      <div onClick={()=>onToggle(id)}
        style={{flex:1,width:"100%",display:"flex",flexDirection:"column",alignItems:"center",
          justifyContent:"center",gap:2,cursor:"pointer",
          padding: has ? "6px 2px 20px" : "6px 2px"}}>
        <div style={{fontSize:numFs,fontWeight:"900",color:textC,lineHeight:1}}>{num}</div>
        <div style={{fontSize:14,color:has ? color+"bb" : "#252535",letterSpacing:0.5,fontWeight:"bold"}}>{id}</div>
        {rep>0 && (
          <div style={{background:"#1a0a40",border:"1px solid #6040b0",borderRadius:4,
            padding:"1px 5px",fontSize:16,color:"#c0a0ff",fontWeight:"bold",marginTop:1}}>
            {"\xd7"}{rep+1}
          </div>
        )}
      </div>

      {/* Rep strip — only when owned, tap to open counter */}
      {has && (
        <div onClick={e=>{e.stopPropagation();onOpenRepeat(id);}}
          style={{position:"absolute",bottom:0,left:0,right:0,
            background: rep>0 ? "#2a1060" : color+"18",
            borderTop:"1px solid "+(rep>0 ? "#6040b0" : color+"33"),
            padding:"3px 0",textAlign:"center",cursor:"pointer",
            fontSize:14,color:rep>0 ? "#c0a0ff" : color+"99",
            fontWeight:"bold",letterSpacing:0.3}}>
          {rep>0 ? ("\u25c8 "+rep+" extra") : "+ repetida"}
        </div>
      )}
    </div>
  );
}

// ── Coca-Cola Spread ──────────────────────────────────────────────────────────
// Page 1: 6 stickers (CC1-CC6) in 2 rows of 3
// Page 2: row of 3 (CC7-CC9) + row of 3 (CC10-CC12) + row of 2 (CC13-CC14) + Coca-Cola logo tile
function CCSpread({ section, owned, repeated, onToggle, onOpenRepeat }) {
  const { color, stickers } = section;
  const have = stickers.filter(s=>owned.has(s.id)).length;
  const pct  = Math.round((have/14)*100);
  const s = n => stickers[n-1];
  const box = (n, size="md") => (
    <StickerBox key={n} id={s(n).id} num={n} color={color} size={size}
      owned={owned} repeated={repeated} onToggle={onToggle} onOpenRepeat={onOpenRepeat}/>
  );

  return (
    <div style={{background:"#0e0e1a",border:"2px solid #e8302a44",borderRadius:14,overflow:"hidden",marginBottom:16}}>
      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#e8302a22,#e8302a08)",borderBottom:"1px solid #e8302a33",padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{fontSize:24}}>🥤</div>
          <div>
            <div style={{fontSize:14,fontWeight:"bold",letterSpacing:-0.3}}>Coca-Cola</div>
            <div style={{fontSize:12,color:"#e8302a99",letterSpacing:1,textTransform:"uppercase"}}>Sección especial · CC</div>
          </div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:18,fontWeight:"bold",color:"#e8302a"}}>{pct}%</div>
          <div style={{fontSize:12,color:"#505068"}}>{have}/14</div>
        </div>
      </div>
      <div style={{height:3,background:"#111120"}}><div style={{height:"100%",width:`${pct}%`,background:"#e8302a",transition:"width 0.3s"}}/></div>

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
        <button onClick={()=>stickers.filter(st=>owned.has(st.id)).forEach(st=>onToggle(st.id))}
          style={{padding:"4px 10px",background:"#0e0e1a",border:"1px solid #30304a",borderRadius:6,color:"#505068",cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>✗ Limpiar</button>
      </div>
    </div>
  );
}

// ── Team Spread ───────────────────────────────────────────────────────────────
function TeamSpread({ section, owned, repeated, onToggle, onOpenRepeat }) {
  const { key:code, name, flag, group, color, stickers } = section;
  const have = stickers.filter(s=>owned.has(s.id)).length;
  const pct  = Math.round((have/20)*100);
  const s = n => stickers[n-1];
  const box = (n, size="md") => (
    <StickerBox key={n} id={s(n).id} num={n} color={color} size={size}
      owned={owned} repeated={repeated} onToggle={onToggle} onOpenRepeat={onOpenRepeat}/>
  );

  return (
    <div style={{background:"#0e0e1a",border:`2px solid ${color}44`,borderRadius:14,overflow:"hidden",marginBottom:16}}>
      <div style={{background:`linear-gradient(135deg,${color}22,${color}08)`,borderBottom:`1px solid ${color}33`,padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{fontSize:24}}>{flag}</div>
          <div>
            <div style={{fontSize:16,fontWeight:"bold",letterSpacing:-0.3}}>{name}</div>
            <div style={{fontSize:15,color:`${color}bb`,letterSpacing:2,textTransform:"uppercase"}}>Grupo {group} · {code}</div>
          </div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:18,fontWeight:"bold",color}}>{pct}%</div>
          <div style={{fontSize:15,color:"#505068"}}>{have}/20</div>
        </div>
      </div>
      <div style={{height:3,background:"#111120"}}><div style={{height:"100%",width:`${pct}%`,background:color,transition:"width 0.3s"}}/></div>

      {/* ── PAGE 1 ── */}
      <div style={{padding:"10px 10px 6px",borderBottom:`1px solid ${color}18`}}>
        <div style={{fontSize:16,color:"#303048",letterSpacing:2,marginBottom:5}}>PÁG 1 · {code}</div>
        {/* Row 1: info placeholder (50%) | carta 1 (25%) | carta 2 (25%) */}
        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gap:5,marginBottom:5}}>
          {/* Info tile — not selectable */}
          <div style={{background:"linear-gradient(135deg,"+color+"18,"+color+"08)",
            border:"1.5px solid "+color+"35",borderRadius:8,
            display:"flex",flexDirection:"column",alignItems:"flex-start",justifyContent:"space-between",
            padding:"10px 12px",minHeight:90,boxSizing:"border-box",overflow:"hidden",position:"relative"}}>
            {/* Big code watermark */}
            <div style={{position:"absolute",right:-4,top:-6,fontSize:52,fontWeight:"900",
              color:color+"18",letterSpacing:-4,lineHeight:1,userSelect:"none",
              fontFamily:"Arial Black, sans-serif"}}>
              {code}
            </div>
            {/* Top: group badge */}
            <div style={{background:color+"22",border:"1px solid "+color+"44",borderRadius:4,
              padding:"2px 7px",fontSize:14,color:color,fontWeight:"bold",letterSpacing:2,
              textTransform:"uppercase",zIndex:1}}>
              GRP {group}
            </div>
            {/* Main code */}
            <div style={{fontSize:28,fontWeight:"900",color,lineHeight:1,letterSpacing:-1,
              fontFamily:"Arial Black, sans-serif",zIndex:1}}>
              {code}
            </div>
            {/* Bottom: full name */}
            <div style={{fontSize:14,color:color+"99",letterSpacing:0.5,
              textTransform:"uppercase",zIndex:1,lineHeight:1.2}}>
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
        <button onClick={()=>stickers.filter(st=>owned.has(st.id)).forEach(st=>onToggle(st.id))}
          style={{padding:"4px 10px",background:"#0e0e1a",border:"1px solid #30304a",borderRadius:6,color:"#505068",cursor:"pointer",fontSize:15,fontFamily:"inherit"}}>✗ Limpiar</button>
      </div>
    </div>
  );
}

// ── Scan Modal ────────────────────────────────────────────────────────────────
function ScanModal({ onClose, onApply }) {
  const fileRef = useRef();
  const [preview, setPreview] = useState(null);
  const [b64, setB64] = useState(null);
  const [mime, setMime] = useState("image/jpeg");
  const [phase, setPhase] = useState("idle");
  const [result, setResult] = useState(null);
  const [action, setAction] = useState("found");
  const teamCodes = GROUPS.flatMap(g=>g.teams.map(t=>t.code)).join(", ");

  const handleFile = f => {
    if(!f) return; setMime(f.type||"image/jpeg");
    const r=new FileReader(); r.onload=e=>{setPreview(e.target.result);setB64(e.target.result.split(",")[1]);setPhase("idle");setResult(null);}; r.readAsDataURL(f);
  };
  const scan = async () => {
    if(!b64) return; setPhase("scanning");
    try {
      const prompt = "Panini FIFA World Cup 2026 sticker album. IDs: TEAMCODE+1-20. e.g. MEX1, CZE13. Valid codes: FWC," + teamCodes + ". Return ONLY JSON, no markdown: {\"found\":[\"MEX1\",...],\"empty\":[\"MEX2\",...]}";
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1500,messages:[{role:"user",content:[{type:"image",source:{type:"base64",media_type:mime,data:b64}},{type:"text",text:prompt}]}]})});
      const data=await res.json();
      const text=(data.content||[]).map(b=>b.text||"").join("").replace(/```json|```/g,"").trim();
      const parsed=JSON.parse(text);
      const valid=arr=>(arr||[]).filter(id=>ALL_IDS.includes(id));
      setResult({found:valid(parsed.found),empty:valid(parsed.empty)});setPhase("done");
    } catch { setPhase("error"); }
  };
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.9)",zIndex:200,display:"flex",alignItems:"flex-start",justifyContent:"center",overflowY:"auto"}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:"#0a0a14",border:"1px solid #2a2a50",borderRadius:16,width:"100%",maxWidth:460,margin:"20px 12px",padding:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div><div style={{fontSize:15,letterSpacing:3,color:"#e8c84a",textTransform:"uppercase"}}>IA Scanner</div><div style={{fontSize:16,fontWeight:"bold"}}>Escanear página</div></div>
          <button onClick={onClose} style={{background:"none",border:"none",color:"#505060",fontSize:20,cursor:"pointer"}}>✕</button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={e=>handleFile(e.target.files[0])}/>
        {!preview?(
          <div style={{border:"2px dashed #252540",borderRadius:12,padding:32,textAlign:"center",cursor:"pointer",marginBottom:14}} onClick={()=>fileRef.current.click()}>
            <div style={{fontSize:40,marginBottom:8}}>📷</div>
            <div style={{fontSize:16,color:"#808090"}}>Toca para tomar foto</div>
          </div>
        ):(
          <div style={{marginBottom:14}}>
            <div style={{position:"relative",borderRadius:10,overflow:"hidden",marginBottom:8}}>
              <img src={preview} alt="" style={{width:"100%",display:"block",maxHeight:260,objectFit:"contain",background:"#111"}}/>
              {phase==="scanning"&&<div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:8}}><div style={{width:34,height:34,border:"3px solid #e8c84a22",borderTop:"3px solid #e8c84a",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/><div style={{fontSize:15,color:"#e8c84a"}}>Analizando…</div></div>}
            </div>
          </div>
        )}
        {phase==="done"&&result&&(
          <div style={{background:"#0d0d1a",border:"1px solid #202030",borderRadius:10,padding:14,marginBottom:14}}>
            {result.found.length>0&&<div style={{marginBottom:8}}><div style={{fontSize:14,color:"#60b060",marginBottom:3}}>✓ Presentes ({result.found.length})</div><div style={{fontSize:16,color:"#505060",wordBreak:"break-all"}}>{result.found.join(", ")}</div></div>}
            {result.empty.length>0&&<div style={{marginBottom:8}}><div style={{fontSize:14,color:"#c05050",marginBottom:3}}>○ Vacíos ({result.empty.length})</div><div style={{fontSize:16,color:"#505060",wordBreak:"break-all"}}>{result.empty.join(", ")}</div></div>}
            {(result.found.length>0||result.empty.length>0)&&(
              <div style={{marginTop:10}}>
                {[{val:"found",label:`Marcar TENGO (${result.found.length})`,color:"#60b060",bg:"#0a1a0a"},{val:"empty",label:`Marcar FALTAN (${result.empty.length})`,color:"#c05050",bg:"#1a0a0a"},{val:"both",label:"Ambas",color:"#e8c84a",bg:"#1a1a0a"}].map(o=>(
                  <button key={o.val} onClick={()=>setAction(o.val)} style={{display:"block",width:"100%",marginBottom:5,padding:"7px 10px",borderRadius:7,border:`1px solid ${action===o.val?o.color:o.color+"33"}`,background:action===o.val?o.bg:"transparent",color:o.color,cursor:"pointer",fontSize:14,fontFamily:"inherit",textAlign:"left"}}>
                    {action===o.val?"● ":"○ "}{o.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <div style={{display:"flex",gap:8}}>
          {preview&&phase!=="scanning"&&<button onClick={scan} style={{flex:1,padding:"11px 0",background:"#0e0e28",border:"1px solid #4050a0",borderRadius:10,color:"#8090d0",cursor:"pointer",fontSize:16,fontFamily:"inherit"}}>{phase==="done"?"↺ Re-analizar":"🔍 Analizar"}</button>}
          {phase==="done"&&result&&(result.found.length>0||result.empty.length>0)&&<button onClick={()=>{onApply(result,action);onClose();}} style={{flex:1,padding:"11px 0",background:"#0a180a",border:"1px solid #40a040",borderRadius:10,color:"#60b060",cursor:"pointer",fontSize:16,fontFamily:"inherit"}}>✓ Aplicar</button>}
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}

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
export default function PaniniTracker() {
  const [owned,    setOwned]    = useState(()=>new Set(loadData().owned));
  const [repeated, setRepeated] = useState(()=>loadData().repeated);
  const [tab, setTab] = useState("album");
  const [showTrade, setShowTrade] = useState(false);
  const [repeatModal, setRepeatModal] = useState(null);
  const [savedPulse, setSavedPulse] = useState(false);
  const [shareMsg, setShareMsg] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [activeGroup, setActiveGroup] = useState("ALL");
  const [searchQ, setSearchQ] = useState("");

  useEffect(()=>{ saveData(owned,repeated); setSavedPulse(true); const t=setTimeout(()=>setSavedPulse(false),1200); return()=>clearTimeout(t); },[owned,repeated]);

  const toggle = useCallback(id => setOwned(p=>{ const n=new Set(p); n.has(id)?n.delete(id):n.add(id); return n; }),[]);
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

  const applyScan = (result, action) => {
    setOwned(p=>{ const n=new Set(p); if(action==="found"||action==="both") result.found.forEach(id=>n.add(id)); if(action==="empty"||action==="both") result.empty.forEach(id=>n.delete(id)); return n; });
  };

  const totalOwned = owned.size;
  const pct = Math.round((totalOwned/TOTAL)*100);
  const missing = useMemo(()=>ALL_IDS.filter(id=>!owned.has(id)),[owned]);
  const repeatList = useMemo(()=>Object.entries(repeated).map(([id,c])=>({id,count:c})).sort((a,b)=>a.id.localeCompare(b.id)),[repeated]);
  const missingByTeam = useMemo(()=>{ const m={}; missing.forEach(id=>{ const c=id.replace(/\d+$/,""); if(!m[c])m[c]=[]; m[c].push(id); }); return m; },[missing]);
  const totalRepeatCopies = repeatList.reduce((a,r)=>a+r.count,0);
  const myCode = useMemo(()=>encodeTrade(repeatList, missing),[repeatList, missing]);

  const visibleSections = useMemo(()=>{
    let secs = ALBUM;
    if (activeGroup!=="ALL") secs=secs.filter(s=>activeGroup==="FWC"?s.key==="FWC":s.group===activeGroup);
    if (searchQ.trim()) { const q=searchQ.trim().toUpperCase(); secs=secs.filter(s=>s.key.includes(q)||s.name.toUpperCase().includes(q)); }
    return secs;
  },[activeGroup,searchQ]);

  const handlePDF = async () => {
    setPdfLoading(true);
    try { await generatePDF(owned, repeated, missing, repeatList, missingByTeam); }
    catch(e){ console.error(e); alert("Error generando PDF. Intenta de nuevo."); }
    finally { setPdfLoading(false); }
  };

  const TABS=[{k:"album",icon:"◉",label:"Álbum"},{k:"repetidas",icon:"◈",label:"Repet."},{k:"faltantes",icon:"○",label:"Faltan"},{k:"cambios",icon:"🔄",label:"Cambios"},{k:"about",icon:"☕",label:"Acerca"}];

  return (
    <div style={{minHeight:"100vh",background:"#080810",fontFamily:"'Inter', system-ui, sans-serif",color:"#e0d8f0"}}>
      {showTrade&&<TradeModal myCode={myCode} onClose={()=>setShowTrade(false)} onConfirm={confirmTrade}/>}
      {repeatModal&&(
        <RepeatModal id={repeatModal.id} count={repeated[repeatModal.id]||0} color={repeatModal.color}
          onSet={setRepeat} onClose={()=>setRepeatModal(null)}/>
      )}

      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#0c1430,#142050,#0c2850)",padding:"14px 14px 10px",borderBottom:"2px solid #e8c84a",position:"sticky",top:0,zIndex:10}}>
        <div style={{maxWidth:520,margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
            <div>
              <div style={{fontSize:14,letterSpacing:4,color:"#e8c84a",textTransform:"uppercase"}}>FIFA World Cup 2026™</div>
              <div style={{fontSize:18,fontWeight:"bold",letterSpacing:-0.5}}>Panini Tracker</div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              {savedPulse&&<div style={{fontSize:14,color:"#60b060",letterSpacing:1}}>💾</div>}
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:26,fontWeight:"bold",color:"#e8c84a",lineHeight:1}}>{pct}%</div>
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
      <div style={{display:"flex",background:"#0c0c18",borderBottom:"1px solid #181828",maxWidth:520,margin:"0 auto"}}>
        {TABS.map(t=>(
          <button key={t.k} onClick={()=>setTab(t.k)} style={{flex:1,padding:"9px 2px",background:"none",border:"none",cursor:"pointer",color:tab===t.k?"#e8c84a":"#404060",fontSize:15,letterSpacing:0.5,textTransform:"uppercase",borderBottom:tab===t.k?"2px solid #e8c84a":"2px solid transparent",transition:"all 0.2s"}}>
            <div style={{fontSize:16,marginBottom:2}}>{t.icon}</div>{t.label}
          </button>
        ))}
      </div>

      <div style={{maxWidth:520,margin:"0 auto",padding:"12px 10px 80px"}}>

        {/* ══ ÁLBUM ══ */}
        {tab==="album"&&(
          <div>
            <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Buscar equipo… (ej: Mexico, BRA)"
              style={{width:"100%",background:"#0c0c18",border:"1px solid #202030",borderRadius:8,color:"#e0d8f0",fontSize:15,padding:"8px 12px",boxSizing:"border-box",fontFamily:"inherit",outline:"none",marginBottom:10}}/>
            <div style={{display:"flex",gap:4,overflowX:"auto",paddingBottom:8,marginBottom:10,scrollbarWidth:"none"}}>
              {["ALL","FWC",...GROUPS.map(g=>g.id)].map(g=>{
                const col=g==="ALL"||g==="FWC"?"#e8c84a":(GROUP_COLORS[g]||"#e8c84a");
                return <button key={g} onClick={()=>{setActiveGroup(g);setSearchQ("");}} style={{flexShrink:0,padding:"4px 10px",borderRadius:20,fontSize:16,cursor:"pointer",border:`1px solid ${activeGroup===g?col:"#202030"}`,background:activeGroup===g?`${col}22`:"transparent",color:activeGroup===g?col:"#505068",whiteSpace:"nowrap"}}>
                  {g==="ALL"?"Todos":g==="FWC"?"🌍 Intro":`Grp ${g}`}
                </button>;
              })}
            </div>

            {/* FWC */}
            {visibleSections.filter(s=>s.key==="FWC").map(s=>(
              <div key="FWC" style={{background:"#0e0e1a",border:"2px solid #e8c84a33",borderRadius:14,overflow:"hidden",marginBottom:16}}>
                <div style={{padding:"10px 14px",display:"flex",alignItems:"center",gap:10,borderBottom:"1px solid #e8c84a22",background:"#e8c84a08"}}>
                  <div style={{fontSize:24}}>🌍</div>
                  <div style={{flex:1}}><div style={{fontSize:16,fontWeight:"bold"}}>FWC</div><div style={{fontSize:15,color:"#e8c84a88"}}>FWC0 – FWC19</div></div>
                  <div style={{fontSize:15,color:"#e8c84a"}}>{s.stickers.filter(st=>owned.has(st.id)).length}/20</div>
                </div>
                <div style={{height:3,background:"#111120"}}><div style={{height:"100%",width:`${Math.round(s.stickers.filter(st=>owned.has(st.id)).length/20*100)}%`,background:"#e8c84a",transition:"width 0.3s"}}/></div>
                <div style={{padding:"10px",display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:5}}>
                  {s.stickers.map(st=>(
                    <StickerBox key={st.id} id={st.id} num={st.num} color="#e8c84a" size="md"
                      owned={owned} repeated={repeated} onToggle={toggle} onOpenRepeat={openRepeatModal}/>
                  ))}
                </div>
              </div>
            ))}
            {visibleSections.filter(s=>s.key!=="FWC").map(s=>(
              s.special==="cocacola"
                ? <CCSpread key={s.key} section={s} owned={owned} repeated={repeated} onToggle={toggle} onOpenRepeat={openRepeatModal}/>
                : <TeamSpread key={s.key} section={s} owned={owned} repeated={repeated} onToggle={toggle} onOpenRepeat={openRepeatModal}/>
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
          </div>
        )}

        {/* ══ ACERCA ══ */}
        {tab==="about"&&(
          <div style={{paddingTop:8}}>
            {/* Hero card */}
            <div style={{background:"linear-gradient(135deg,#0e0e1a,#141428)",border:"1px solid #2a2a50",borderRadius:16,padding:24,marginBottom:14,textAlign:"center"}}>
              <div style={{fontSize:48,marginBottom:12}}>⚽</div>
              <div style={{fontSize:22,fontWeight:"900",color:"#e8c84a",letterSpacing:-0.5,marginBottom:4}}>Panini Tracker</div>
              <div style={{fontSize:13,color:"#606078",marginBottom:16}}>FIFA World Cup 2026™</div>
              <div style={{width:48,height:2,background:"#e8c84a33",margin:"0 auto 16px"}}/>
              <div style={{fontSize:14,color:"#9090b0",lineHeight:1.7}}>
                Hecho por
              </div>
              <div style={{fontSize:22,fontWeight:"900",color:"#e0d8f0",marginTop:4,marginBottom:8}}>Hey Samwell</div>
              <a href="https://instagram.com/hey_samwell" target="_blank" rel="noopener noreferrer"
                style={{display:"inline-flex",alignItems:"center",gap:6,padding:"7px 14px",
                  background:"linear-gradient(135deg,#833ab4,#fd1d1d,#f77737)",
                  borderRadius:20,color:"#fff",fontSize:13,fontWeight:"600",textDecoration:"none"}}>
                <span>📸</span> @hey_samwell
              </a>
            </div>

            {/* Coffee / donation */}
            <div style={{background:"linear-gradient(135deg,#1a1008,#120c04)",border:"1px solid #6040108",borderRadius:14,padding:20,marginBottom:14,textAlign:"center"}}>
              <div style={{fontSize:32,marginBottom:10}}>☕</div>
              <div style={{fontSize:16,fontWeight:"bold",color:"#f0b840",marginBottom:8}}>¿Te fue útil el tracker?</div>
              <div style={{fontSize:13,color:"#806040",lineHeight:1.7,marginBottom:16}}>
                Si te ayudó a completar tu álbum o simplemente te gustó, puedes invitarme un café. Cada granito de arena ayuda a seguir haciendo cositas.
              </div>
              <a href="https://paypal.me/awesombroso" target="_blank" rel="noopener noreferrer"
                style={{display:"inline-block",padding:"13px 28px",
                  background:"linear-gradient(135deg,#003087,#009cde)",
                  borderRadius:12,color:"#fff",fontSize:15,fontWeight:"bold",
                  textDecoration:"none",letterSpacing:0.3}}>
                ☕ Invitar un café vía PayPal
              </a>
            </div>

            {/* Stats summary */}
            <div style={{background:"#0e0e1a",border:"1px solid #1e1e30",borderRadius:14,padding:16,marginBottom:14}}>
              <div style={{fontSize:11,color:"#404058",letterSpacing:2,textTransform:"uppercase",marginBottom:12}}>Tu progreso</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,textAlign:"center"}}>
                {[
                  [owned.size, "Tengo", "#70c070"],
                  [missing.length, "Faltan", "#c05050"],
                  [repeatList.length, "Repet.", "#a080e0"],
                ].map(([val,label,color])=>(
                  <div key={label}>
                    <div style={{fontSize:24,fontWeight:"900",color}}>{val}</div>
                    <div style={{fontSize:11,color:"#404058",marginTop:2}}>{label}</div>
                  </div>
                ))}
              </div>
              <div style={{marginTop:12,height:5,background:"#111120",borderRadius:3,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${pct}%`,background:"linear-gradient(90deg,#e8c84a,#f09820)",borderRadius:3,transition:"width 0.5s"}}/>
              </div>
              <div style={{textAlign:"center",marginTop:6,fontSize:12,color:"#e8c84a",fontWeight:"bold"}}>{pct}% completado</div>
            </div>

            {/* Version */}
            <div style={{textAlign:"center",padding:"16px 0",fontSize:11,color:"#252535"}}>
              v1.0 · Hecho por Hey Samwell 🇲🇽
            </div>
          </div>
        )}

        {/* ══ REPETIDAS ══ */}
        {tab==="repetidas"&&(
          <div>
            {/* Stats */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
              <div style={{background:"#0e0e1a",border:"1px solid #3a2a6a",borderRadius:10,padding:12,textAlign:"center"}}>
                <div style={{fontSize:24,fontWeight:"bold",color:"#a080e0"}}>{repeatList.length}</div>
                <div style={{fontSize:15,color:"#505068"}}>stickers distintos</div>
              </div>
              <div style={{background:"#0e0e1a",border:"1px solid #3a2a6a",borderRadius:10,padding:12,textAlign:"center"}}>
                <div style={{fontSize:24,fontWeight:"bold",color:"#c0a0ff"}}>{totalRepeatCopies}</div>
                <div style={{fontSize:15,color:"#505068"}}>copias para cambiar</div>
              </div>
            </div>

            {/* How to add */}
            <div style={{background:"#0a0a18",border:"1px dashed #2a2a50",borderRadius:10,padding:12,marginBottom:14,display:"flex",gap:10,alignItems:"flex-start"}}>
              <div style={{fontSize:18}}>💡</div>
              <div>
                <div style={{fontSize:14,fontWeight:"bold",marginBottom:3}}>Cómo registrar repetidas</div>
                <div style={{fontSize:16,color:"#505068",lineHeight:1.6}}>
                  En el <strong style={{color:"#e8c84a"}}>Álbum</strong>, marca la figurita (tap).<br/>
                  Aparece una barra <strong style={{color:"#a080e0"}}>+ repetida</strong> abajo de la cajita.<br/>
                  Tócala para abrir el contador y poner cuántas copias de más tienes.
                </div>
              </div>
            </div>

            {repeatList.length===0?(
              <div style={{textAlign:"center",padding:32,color:"#303048",fontSize:12}}>
                Sin repetidas registradas aún.
              </div>
            ):(
              <div>
                {/* Group by team */}
                {ALBUM.filter(sec=>repeatList.some(r=>r.id.startsWith(sec.key))).map(sec=>{
                  const items = repeatList.filter(r=>r.id.startsWith(sec.key));
                  return (
                    <div key={sec.key} style={{marginBottom:10,background:"#0c0c18",border:`1px solid ${sec.color}33`,borderRadius:10,overflow:"hidden"}}>
                      <div style={{padding:"8px 12px",borderBottom:`1px solid ${sec.color}22`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <span style={{fontSize:11}}>{sec.flag} {sec.name}</span>
                        <span style={{fontSize:15,color:"#a080e0"}}>{items.length} sticker{items.length>1?"s":""} · {items.reduce((a,r)=>a+r.count,0)} copias</span>
                      </div>
                      <div style={{padding:"8px 12px",display:"flex",flexWrap:"wrap",gap:6}}>
                        {items.map(({id,count})=>(
                          <div key={id} style={{display:"flex",alignItems:"center",background:"#10102a",border:`1px solid ${sec.color}44`,borderRadius:8,overflow:"hidden"}}>
                            <div style={{padding:"6px 8px",fontSize:14,color:sec.color,fontWeight:"bold"}}>{id}</div>
                            <div style={{display:"flex",alignItems:"center",background:"#1a1a3a",borderLeft:`1px solid ${sec.color}22`}}>
                              <button onClick={()=>setRepeat(id,Math.max(0,count-1))} style={{padding:"6px 8px",background:"none",border:"none",cursor:"pointer",color:"#505068",fontSize:14,lineHeight:1}}>−</button>
                              <div style={{minWidth:20,textAlign:"center",fontSize:16,fontWeight:"bold",color:"#c0a0ff"}}>×{count}</div>
                              <button onClick={()=>setRepeat(id,Math.min(20,count+1))} style={{padding:"6px 8px",background:"none",border:"none",cursor:"pointer",color:"#a080e0",fontSize:14,lineHeight:1}}>+</button>
                            </div>
                            <button onClick={()=>openRepeatModal(id)} style={{padding:"6px 8px",background:"#181828",border:"none",cursor:"pointer",color:"#606080",fontSize:16,fontFamily:"inherit"}}>✎</button>
                            <button onClick={()=>setRepeat(id,0)} style={{padding:"6px 8px",background:"#1a0808",border:"none",cursor:"pointer",color:"#b04040",fontSize:10}}>✗</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                <button onClick={()=>navigator.clipboard?.writeText(`Mis repetidas Panini WC2026:\n${repeatList.map(r=>`${r.id} ×${r.count}`).join("  |  ")}`)}
                  style={{width:"100%",marginTop:6,padding:"10px 0",background:"#0e0e28",border:"1px solid #303080",borderRadius:10,color:"#6070c0",cursor:"pointer",fontSize:14,fontFamily:"inherit"}}>
                  ⎘ Copiar lista para WhatsApp
                </button>
              </div>
            )}
          </div>
        )}

        {/* ══ FALTAN ══ */}
        {tab==="faltantes"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div><div style={{fontSize:22,fontWeight:"bold"}}>{missing.length}</div><div style={{fontSize:15,color:"#404050"}}>figuritas faltantes</div></div>
              <div style={{display:"flex",gap:6}}>
                <button onClick={()=>{ const lines=Object.entries(missingByTeam).map(([c,ids])=>`${c}: ${ids.map(id=>id.replace(c,"")).join(" ")}`).join("\n"); navigator.clipboard?.writeText(`Faltan ${missing.length}:\n\n${lines}`); setShareMsg(true); setTimeout(()=>setShareMsg(false),2500); }}
                  style={{padding:"7px 10px",background:"#0e0e28",border:"1px solid #404090",borderRadius:8,color:"#6070c0",cursor:"pointer",fontSize:16,fontFamily:"inherit"}}>
                  {shareMsg?"✓ Copiado!":"⎘ Copiar"}
                </button>
              </div>
            </div>

            {/* PDF download button */}
            <button onClick={handlePDF} disabled={pdfLoading}
              style={{width:"100%",marginBottom:14,padding:"12px 0",background:"linear-gradient(135deg,#1a1020,#120c1a)",border:"1px solid #7050a0",borderRadius:12,color:pdfLoading?"#504060":"#c090f0",cursor:pdfLoading?"not-allowed":"pointer",fontSize:16,fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
              {pdfLoading?<><div style={{width:14,height:14,border:"2px solid #50407044",borderTop:"2px solid #c090f0",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>Generando PDF…</>:<>📄 Descargar reporte PDF (Repetidas + Faltan)</>}
            </button>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

            {missing.length===0?(
              <div style={{textAlign:"center",padding:40,fontSize:22}}>🏆<div style={{fontSize:16,marginTop:8,color:"#60b060"}}>¡Álbum completo!</div></div>
            ):(
              ALBUM.filter(s=>missingByTeam[s.key]?.length>0).map(s=>{
                const mis=missingByTeam[s.key]||[];
                return (
                  <div key={s.key} style={{marginBottom:8,background:"#0c0c18",border:`1px solid ${s.color}22`,borderRadius:10,overflow:"hidden"}}>
                    <div style={{padding:"7px 12px",borderBottom:`1px solid ${s.color}11`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span style={{fontSize:11}}>{s.flag} {s.name}</span>
                      <span style={{fontSize:16,color:"#c05050"}}>Faltan {mis.length}</span>
                    </div>
                    <div style={{padding:"7px 12px",display:"flex",flexWrap:"wrap",gap:4}}>
                      {mis.map(id=>(
                        <button key={id} onClick={()=>toggle(id)} style={{padding:"2px 6px",borderRadius:4,background:"#101018",border:`1px solid ${s.color}33`,color:"#606078",fontSize:16,cursor:"pointer",fontFamily:"inherit"}}>
                          {id}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ══ CAMBIOS ══ */}
        {tab==="cambios"&&(
          <div>
            {/* Hero */}
            <div style={{background:"linear-gradient(135deg,#0a1e18,#061410)",border:"1px solid #1a3a28",borderRadius:14,padding:20,marginBottom:14,textAlign:"center"}}>
              <div style={{fontSize:42,marginBottom:8}}>🔄</div>
              <div style={{fontSize:15,fontWeight:"bold",marginBottom:6}}>Comparar con un amigo</div>
              <div style={{fontSize:14,color:"#507060",lineHeight:1.7,marginBottom:16}}>
                Comparte tu código con un amigo.<br/>
                Cuando él pegue el suyo, la app calcula<br/>
                exactamente qué figuritas se pueden intercambiar.
              </div>
              <button onClick={()=>setShowTrade(true)}
                style={{padding:"13px 28px",background:"linear-gradient(135deg,#0a2a1a,#061810)",
                  border:"1px solid #2a6040",borderRadius:12,color:"#50d0a0",cursor:"pointer",
                  fontSize:14,fontFamily:"inherit",fontWeight:"bold",letterSpacing:0.5}}>
                Abrir comparador
              </button>
            </div>

            {/* Stats */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
              <div style={{background:"#0c0c18",border:"1px solid #1a3a28",borderRadius:10,padding:12,textAlign:"center"}}>
                <div style={{fontSize:22,fontWeight:"bold",color:"#50d0a0"}}>{repeatList.length}</div>
                <div style={{fontSize:15,color:"#406050",letterSpacing:1,textTransform:"uppercase",marginTop:2}}>Puedo ofrecer</div>
              </div>
              <div style={{background:"#0c0c18",border:"1px solid #1a2a3a",borderRadius:10,padding:12,textAlign:"center"}}>
                <div style={{fontSize:22,fontWeight:"bold",color:"#8090d0"}}>{missing.length}</div>
                <div style={{fontSize:15,color:"#405060",letterSpacing:1,textTransform:"uppercase",marginTop:2}}>Necesito</div>
              </div>
            </div>

            {/* How it works */}
            <div style={{fontSize:16,color:"#404050",marginBottom:8,letterSpacing:2,textTransform:"uppercase"}}>Cómo funciona</div>
            {[
              ["1","Abre el comparador y copia tu código"],
              ["2","Mándaselo a tu amigo por WhatsApp"],
              ["3","Él pega tu código en su app (tab Cambios)"],
              ["4","Cada quien ve qué figuritas pueden intercambiarse"],
            ].map(([n,t])=>(
              <div key={n} style={{display:"flex",gap:10,padding:"9px 0",borderBottom:"1px solid #101018",alignItems:"center"}}>
                <div style={{width:22,height:22,borderRadius:11,background:"#0a2a1a",border:"1px solid #2a5a38",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:16,color:"#50d0a0",fontWeight:"bold",flexShrink:0}}>{n}</div>
                <div style={{fontSize:14,color:"#607060"}}>{t}</div>
              </div>
            ))}
          </div>
        )}

      </div>
      <Analytics />
    </div>
  );
}
