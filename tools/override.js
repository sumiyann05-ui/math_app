// override.js
let pages = [];
let overrides = []; // {page, number, bbox:[l,t,r,b], margin:10}
let current = null;
let startPt = null;

async function loadPages(){
  const res = await fetch('../pages.json');
  pages = await res.json();
  const sel = document.getElementById('page-select');
  pages.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.page;
    opt.textContent = `${p.number} (page_${String(p.page).padStart(3,'0')})`;
    sel.appendChild(opt);
  });
  sel.value = pages[0].page;
  updateImage();
}

function getSelected(){
  const sel = document.getElementById('page-select');
  const page = parseInt(sel.value, 10);
  return pages.find(p => p.page === page);
}

function updateImage(){
  const p = getSelected();
  current = p;
  const img = document.getElementById('img');
  const ov = document.getElementById('overlay');
  img.src = `../${p.image}`; // assets/page_###.png
  document.getElementById('unit-badge').textContent = p.unit + ` ／ 番号 ${p.number}`;
  img.onload = () => {
    ov.width = img.clientWidth;
    ov.height = img.clientHeight;
    ov.style.left = img.offsetLeft + 'px';
    ov.style.top = img.offsetTop + 'px';
    drawRect(null);
  };
}

function drawRect(rect){
  const ov = document.getElementById('overlay');
  const ctx = ov.getContext('2d');
  ctx.clearRect(0,0,ov.width, ov.height);
  if(!rect) return;
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 2;
  ctx.setLineDash([6,4]);
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
}

function clientToImageCoords(xc, yc){
  const img = document.getElementById('img');
  const ov = document.getElementById('overlay');
  const rect = img.getBoundingClientRect();
  const scaleX = img.naturalWidth / ov.width;
  const scaleY = img.naturalHeight / ov.height;
  const x = (xc - rect.left) * scaleX;
  const y = (yc - rect.top) * scaleY;
  return {x, y, scaleX, scaleY};
}

function wireDrag(){
  const ov = document.getElementById('overlay');
  ov.style.pointerEvents = 'auto';
  ov.addEventListener('mousedown', (e)=>{
    startPt = {x: e.clientX, y: e.clientY};
  });
  ov.addEventListener('mousemove', (e)=>{
    if(!startPt) return;
    const img = document.getElementById('img');
    const rect = img.getBoundingClientRect();
    const x0 = Math.min(startPt.x, e.clientX) - rect.left;
    const y0 = Math.min(startPt.y, e.clientY) - rect.top;
    const w = Math.abs(e.clientX - startPt.x);
    const h = Math.abs(e.clientY - startPt.y);
    drawRect({x:x0, y:y0, w, h});
  });
  window.addEventListener('mouseup', (e)=>{
    if(!startPt) return;
    const a = clientToImageCoords(startPt.x, startPt.y);
    const b = clientToImageCoords(e.clientX, e.clientY);
    const left = Math.min(a.x, b.x);
    const top = Math.min(a.y, b.y);
    const right = Math.max(a.x, b.x);
    const bottom = Math.max(a.y, b.y);
    current._lastRect = {left, top, right, bottom};
    startPt = null;
  });
}

function renderList(){
  const div = document.getElementById('list');
  div.innerHTML = '<b>指定済み：</b>';
  overrides.sort((x,y)=>x.number-y.number);
  overrides.forEach(o=>{
    const p = document.createElement('div');
    p.className='rect';
    p.textContent = `${o.number} / page_${String(o.page).padStart(3,'0')} : [${o.bbox.map(v=>Math.round(v)).join(', ')}]`;
    div.appendChild(p);
  });
}

function addOverride(){
  if(!current || !current._lastRect){ alert('画像上で枠をドラッグしてください。'); return; }
  const margin = 12;
  const o = { page: current.page, number: current.number, bbox: [current._lastRect.left, current._lastRect.top, current._lastRect.right, current._lastRect.bottom], margin };
  // replace if exists
  const idx = overrides.findIndex(v=>v.page===o.page);
  if(idx>=0) overrides[idx]=o; else overrides.push(o);
  renderList();
}

function downloadJSON(){
  const blob = new Blob([JSON.stringify({overrides}, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'overrides.json';
  a.click();
}

function loadJSON(){
  const fi = document.getElementById('file-upload');
  if(!fi.files || !fi.files[0]){ alert('ファイルを選択してください。'); return; }
  const reader = new FileReader();
  reader.onload = ()=>{
    try{
      const data = JSON.parse(reader.result);
      overrides = data.overrides || [];
      renderList();
      alert('読み込みました。');
    }catch(e){ alert('JSONの形式が不正です。'); }
  };
  reader.readAsText(fi.files[0]);
}

// init
window.addEventListener('DOMContentLoaded', ()=>{
  loadPages();
  wireDrag();
  document.getElementById('page-select').addEventListener('change', updateImage);
  document.getElementById('btn-add').addEventListener('click', addOverride);
  document.getElementById('btn-clear').addEventListener('click', ()=>{ current._lastRect=null; drawRect(null); });
  document.getElementById('btn-download').addEventListener('click', downloadJSON);
  document.getElementById('btn-load').addEventListener('click', loadJSON);
});
