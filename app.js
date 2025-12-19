
let PROBLEMS = [];
let MODE = 'random';
let CURRENT = null;
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const STORAGE_KEY = 'math_app_results_v1';
function loadResults(){ try{ return JSON.parse(localStorage.getItem(STORAGE_KEY))||{ratings:{},history:[]}; }catch(e){ return {ratings:{},history:[]}; } }
function saveResults(d){ localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }
function setRating(id, r){ const d=loadResults(); d.ratings[id]=r; d.history.push({id,rating:r,ts:new Date().toISOString()}); saveResults(d); }
function showScreen(id){ $$('.screen').forEach(el=>el.classList.add('hidden')); $(id).classList.remove('hidden'); }
function pickRandomEligible(){ let pool=[]; if(MODE==='random'){ pool=PROBLEMS.slice(); } else { const latest=loadResults().ratings||{}; pool=PROBLEMS.filter(p=>latest[p.id]!=='◎'); if(pool.length===0){ alert('◎以外の問題がありません。ランダムに切り替えます。'); MODE='random'; pool=PROBLEMS.slice(); } } if(pool.length===0) return null; return pool[Math.floor(Math.random()*pool.length)]; }
function renderProblemOnly(p){ $('#q-number').textContent=`問題番号: ${p.number ?? p.id}`; $('#q-title').textContent=p.title || '問題'; $('#q-statement').innerHTML = p.question_img? `<img src="${p.question_img}" alt="問題" class="qimg">` : (p.question||''); showScreen('#question-screen'); }
function renderProblemWithSolution(p){ $('#s-number').textContent=`問題番号: ${p.number ?? p.id}`; $('#s-title').textContent=p.title || '問題＋解答解説'; const qHtml = p.question_img? `<img src="${p.question_img}" alt="問題" class="qimg">` : (p.question||''); const sHtml = p.solution_img? `<img src="${p.solution_img}" alt="解答解説" class="simg">` : (p.solution||''); $('#s-statement').innerHTML=qHtml; $('#s-solution').innerHTML=sHtml; showScreen('#solution-screen'); }
function nextProblem(){ CURRENT = pickRandomEligible(); if(!CURRENT){ alert('問題がありません。'); showScreen('#start-screen'); return; } renderProblemOnly(CURRENT); }

document.addEventListener('DOMContentLoaded', async ()=>{
  $('#btn-random').addEventListener('click', ()=>{ MODE='random'; nextProblem(); });
  $('#btn-focus').addEventListener('click', ()=>{ MODE='focus'; nextProblem(); });
  $('#btn-show-solution').addEventListener('click', ()=>{ if(CURRENT) renderProblemWithSolution(CURRENT); });
  $$('#solution-screen .rate').forEach(btn=> btn.addEventListener('click', ()=>{ if(CURRENT) setRating(CURRENT.id, btn.dataset.rate); nextProblem(); }));
  $('#btn-exit').addEventListener('click', ()=>{ try{ window.close(); }catch(e){} showScreen('#exit-screen'); });
  $('#btn-back-home').addEventListener('click', ()=> showScreen('#start-screen'));
  try{ const res = await fetch('problems.json'); PROBLEMS = await res.json(); } catch(e){ PROBLEMS = window.PROBLEMS_EMBEDDED || []; }
});
