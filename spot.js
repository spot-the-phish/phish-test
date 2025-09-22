
const SIZE = { w: 1536, h: 1024 };
const HALF_W = 768;
const RADIUS = 22;
const MIN_BLOB = 220;
const REVEAL_STEP = 1;

const board = document.getElementById('board');
const canvas = document.getElementById('diff');
const ctx = canvas.getContext('2d');
const marks = document.getElementById('marks');

const foundEl = document.getElementById('found');
const totalEl = document.getElementById('total');
const mistakesEl = document.getElementById('mistakes');
const bar = document.getElementById('bar');
const btnReveal = document.getElementById('reveal');
const btnReset = document.getElementById('reset');
const timerEl = document.getElementById('timer');

let regions = [];
let mistakes = 0;
let startTime = Date.now();
let timerHandle = null;

function startTimer(){
  if (timerHandle) clearInterval(timerHandle);
  startTime = Date.now();
  timerHandle = setInterval(() => {
    const s = Math.floor((Date.now() - startTime)/1000);
    const m = String(Math.floor(s/60)).padStart(2,'0');
    const sec = String(s%60).padStart(2,'0');
    timerEl.textContent = `${m}:${sec}`;
  }, 500);
}

function drawMiss(x,y){
  const el = document.createElement('div');
  el.className = 'miss';
  el.style.width = el.style.height = (RADIUS*2)+'px';
  el.style.left = (x - RADIUS) + 'px';
  el.style.top  = (y - RADIUS) + 'px';
  marks.appendChild(el);
  setTimeout(()=> el.remove(), 700);
}

function drawHit(reg){
  const el = document.createElement('div');
  el.className = 'hit';
  const r = Math.max(RADIUS+6, reg.r);
  el.style.width = el.style.height = (r*2)+'px';
  el.style.left = (reg.cx - r) + 'px';
  el.style.top  = (reg.cy - r) + 'px';
  marks.appendChild(el);
}

function updateHUD(){
  const found = regions.filter(r=>r.found).length;
  foundEl.textContent = found;
  totalEl.textContent = regions.length;
  bar.style.width = (regions.length ? (found/regions.length*100) : 0) + '%';
  mistakesEl.textContent = mistakes;
}

function pointHitsRegion(x,y,reg){
  const dx = x - reg.cx;
  const dy = y - reg.cy;
  return Math.sqrt(dx*dx + dy*dy) <= Math.max(RADIUS, reg.r);
}

function handleClick(ev){
  const rect = board.getBoundingClientRect();
  const x = ev.clientX - rect.left;
  const y = ev.clientY - rect.top;
  if (x < 0 || x > SIZE.w || y < 0 || y > SIZE.h) return;

  const hit = regions.find(r => !r.found && pointHitsRegion(x,y,r));
  if (hit){
    hit.found = true;
    drawHit(hit);
  } else {
    mistakes += 1;
    drawMiss(x,y);
  }
  updateHUD();
}

board.addEventListener('click', handleClick);

btnReset.addEventListener('click', () => {
  marks.innerHTML = '';
  regions.forEach(r=> r.found = false);
  mistakes = 0;
  updateHUD();
  startTimer();
});

btnReveal.addEventListener('click', () => {
  let left = REVEAL_STEP;
  for (const r of regions){
    if (!r.found){
      r.found = true;
      drawHit(r);
      left--;
      if (left<=0) break;
    }
  }
  updateHUD();
});

async function loadAndDiff(){
  const img = await new Promise((resolve)=>{
    const a = new Image(); a.src = 'left.png';
    const b = new Image(); b.src = 'right.png';
    let ra=false, rb=false;
    a.onload = ()=>{ra=true; if (rb) resolve([a,b])};
    b.onload = ()=>{rb=true; if (ra) resolve([a,b])};
  });

  const [A,B] = img;
  const off = document.createElement('canvas');
  off.width = SIZE.w; off.height = SIZE.h;
  const octx = off.getContext('2d');
  octx.drawImage(A, 0, 0, HALF_W, SIZE.h);
  octx.drawImage(B, HALF_W, 0, HALF_W, SIZE.h);

  const dataA = octx.getImageData(0,0,HALF_W,SIZE.h).data;
  const dataB = octx.getImageData(HALF_W,0,HALF_W,SIZE.h).data;

  const diff = new Uint8ClampedArray(HALF_W*SIZE.h);
  for (let i=0, j=0; i<dataA.length; i+=4, j++){
    const dr = Math.abs(dataA[i] - dataB[i]);
    const dg = Math.abs(dataA[i+1] - dataB[i+1]);
    const db = Math.abs(dataA[i+2] - dataB[i+2]);
    const d = (dr+dg+db)/3;
    diff[j] = d;
  }

  const W = HALF_W, H = SIZE.h;
  const TH = 22;
  const bin = new Uint8Array(W*H);
  for (let i=0;i<diff.length;i++) bin[i] = diff[i] > TH ? 1 : 0;

  function idx(x,y){ return y*W+x; }
  for (let pass=0; pass<2; pass++){
    const copy = bin.slice();
    for (let y=1;y<H-1;y++){
      for (let x=1;x<W-1;x++){
        let s=0;
        for (let yy=-1; yy<=1; yy++)
          for (let xx=-1; xx<=1; xx++)
            s += copy[idx(x+xx,y+yy)];
        bin[idx(x,y)] = s>=3 ? 1 : bin[idx(x,y)];
      }
    }
  }

  const vis = new Uint8Array(W*H);
  const regs = [];
  for (let y=0;y<H;y++){
    for (let x=0;x<W;x++){
      const p = idx(x,y);
      if (bin[p] && !vis[p]){
        let q=[[x,y]], head=0;
        vis[p]=1;
        let minx=x, maxx=x, miny=y, maxy=y, count=0, sumx=0, sumy=0;
        while (head<q.length){
          const [cx,cy] = q[head++];
          const cp = idx(cx,cy);
          if (!bin[cp] || vis[cp]) continue;
          vis[cp]=1;
          count++; sumx+=cx; sumy+=cy;
          if (cx<minx) minx=cx; if (cx>maxx) maxx=cx;
          if (cy<miny) miny=cy; if (cy>maxy) maxy=cy;
          for (let yy=-1; yy<=1; yy++)
            for (let xx=-1; xx<=1; xx++){
              const nx = cx+xx, ny = cy+yy;
              if (nx>=0 && nx<W && ny>=0 && ny<H && !vis[idx(nx,ny)])
                q.push([nx,ny]);
            }
        }
        if (count >= MIN_BLOB){
          const cx = Math.round(sumx/count);
          const cy = Math.round(sumy/count);
          const r = Math.max(14, Math.ceil(Math.hypot(maxx-minx, maxy-miny)/6));
          regs.push({cx: cx, cy: cy, r, found:false});
          regs.push({cx: cx+HALF_W, cy: cy, r, found:false});
        }
      }
    }
  }

  // Remove near-duplicates
  regions = regs.filter((r,idx) => {
    for (let j=0;j<idx;j++){
      const p = regs[j];
      if (Math.hypot(p.cx-r.cx, p.cy-r.cy) < 18) return false;
    }
    return true;
  });

  updateHUD();
  startTimer();
}

loadAndDiff();
