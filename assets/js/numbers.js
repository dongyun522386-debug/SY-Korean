// ── 숫자 연습 ────────────────────────────────────────────
const SINO_KR = {1:'일',2:'이',3:'삼',4:'사',5:'오',6:'육',7:'칠',8:'팔',9:'구',10:'십',20:'이십',30:'삼십',40:'사십',50:'오십',60:'육십',70:'칠십',80:'팔십',90:'구십',100:'백',1000:'천',10000:'만'};
const NATIVE_KR = {1:'하나',2:'둘',3:'셋',4:'넷',5:'다섯',6:'여섯',7:'일곱',8:'여덟',9:'아홉',10:'열',20:'스물',30:'서른',40:'마흔',50:'쉰',60:'예순',70:'일흔',80:'여든',90:'아흔'};

function getSino(n) {
  if (SINO_KR[n]) return SINO_KR[n];
  const t=Math.floor(n/10)*10, o=n%10;
  return (t>=10?SINO_KR[t]:'') + (o?SINO_KR[o]:'');
}

function getNative(n) {
  if (NATIVE_KR[n]) return NATIVE_KR[n];
  if (n>99||n<1) return null;
  const t=Math.floor(n/10)*10, o=n%10;
  return (t?NATIVE_KR[t]:'') + (o?NATIVE_KR[o]:'');
}

let numQAnswered=false, numQScore=0, numQTotal=0, numQCorrect=null, numQType='sino';
let numLAnswered=false, numLScore=0, numLTotal=0, numLCorrect=null, numLWord='';

function openNumModal() {
  document.getElementById('numOverlay').classList.add('open');
  // reset to table tab
  document.querySelectorAll('.num-stab').forEach((b,i) => b.classList.toggle('active', i===0));
  document.getElementById('numPanelTable').style.display='';
  document.getElementById('numPanelQuiz').style.display='none';
  document.getElementById('numPanelListen').style.display='none';
}

function startNumQuiz() {
  numQAnswered=false; numQScore=0; numQTotal=0;
  document.getElementById('numQScore').textContent='0 / 0';
  document.getElementById('numQFb').textContent='';
  document.getElementById('numQNext').style.display='none';
  startNumQuestion();
}

function startNumQuestion() {
  numQAnswered=false;
  document.getElementById('numQFb').textContent='';
  document.getElementById('numQNext').style.display='none';
  // pick random number 1-99 that has both readings
  let n; do { n=Math.floor(Math.random()*99)+1; } while(!getSino(n)||!getNative(n));
  numQCorrect=n;
  // alternately ask sino or native
  numQType=Math.random()<0.5?'sino':'native';
  document.getElementById('numQNum').textContent=n;
  document.getElementById('numQAsk').textContent=numQType==='sino'?'한자어로는? (漢字語)':'고유어로는? (固有語)';
  document.getElementById('numQType').textContent=numQType==='sino'?'📅 한자어':'🕐 고유어';
  // generate options
  const correctAns = numQType==='sino' ? getSino(n) : getNative(n);
  const pool=[];
  while(pool.length<3) {
    let r=Math.floor(Math.random()*99)+1;
    const ans=numQType==='sino'?getSino(r):getNative(r);
    if(r!==n && ans && ans!==correctAns && !pool.includes(ans)) pool.push(ans);
  }
  const opts=[...pool, correctAns].sort(()=>Math.random()-.5);
  document.getElementById('numQOpts').innerHTML=opts.map(o=>
    `<button class="num-qopt" data-ans="${o}">${o}</button>`
  ).join('');
  document.querySelectorAll('.num-qopt').forEach(b => b.addEventListener('click', function() {
    if(numQAnswered) return;
    numQAnswered=true; numQTotal++;
    const fb=document.getElementById('numQFb');
    document.querySelectorAll('.num-qopt').forEach(x => {
      x.disabled=true;
      if(x.dataset.ans===correctAns) x.classList.add('correct');
      if(x.dataset.ans===this.dataset.ans && this.dataset.ans!==correctAns) x.classList.add('wrong');
    });
    if(this.dataset.ans===correctAns) {
      numQScore++; fb.textContent='🎉 정답! 正确！'; fb.style.color='#4CAF50';
    } else {
      fb.textContent=`❌ 정답: ${correctAns}`; fb.style.color='var(--accent)';
    }
    document.getElementById('numQScore').textContent=`${numQScore} / ${numQTotal}`;
    document.getElementById('numQNext').style.display='';
  }));
}

function startNumListen() {
  numLAnswered=false; numLScore=0; numLTotal=0;
  document.getElementById('numLScore').textContent='0 / 0';
  document.getElementById('numLFb').textContent='';
  document.getElementById('numLOpts').innerHTML='';
  document.getElementById('numLNext').style.display='none';
  document.getElementById('numLPlay').style.display='';
}

function playNumListen() {
  if(numLAnswered) return;
  // pick random 1-20 for listening (easier)
  const nums=[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,30,40,50];
  const n=nums[Math.floor(Math.random()*nums.length)];
  numLCorrect=n;
  // randomly read as sino or native
  const useSino=Math.random()<0.5;
  numLWord=useSino?getSino(n):getNative(n);
  if(!numLWord){numLWord=getSino(n);} // fallback
  const u=new SpeechSynthesisUtterance(numLWord);
  u.lang='ko-KR'; u.rate=0.8;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
  // show options (4 digit options)
  const pool=new Set([n]);
  while(pool.size<4){pool.add(nums[Math.floor(Math.random()*nums.length)]);}
  const opts=[...pool].sort((a,b)=>a-b);
  document.getElementById('numLOpts').innerHTML=opts.map(o=>
    `<button class="num-qopt" data-ans="${o}">${o}</button>`
  ).join('');
  document.querySelectorAll('#numLOpts .num-qopt').forEach(b=>b.addEventListener('click', function() {
    if(numLAnswered) return;
    numLAnswered=true; numLTotal++;
    const fb=document.getElementById('numLFb');
    document.querySelectorAll('#numLOpts .num-qopt').forEach(x=>{
      x.disabled=true;
      if(parseInt(x.dataset.ans)===numLCorrect) x.classList.add('correct');
      if(parseInt(x.dataset.ans)===parseInt(this.dataset.ans)&&parseInt(this.dataset.ans)!==numLCorrect) x.classList.add('wrong');
    });
    if(parseInt(this.dataset.ans)===numLCorrect){
      numLScore++; fb.textContent=`🎉 정답! "${numLWord}" = ${numLCorrect}`; fb.style.color='#4CAF50';
    } else {
      fb.textContent=`❌ 정답: ${numLCorrect} (${numLWord})`; fb.style.color='var(--accent)';
    }
    document.getElementById('numLScore').textContent=`${numLScore} / ${numLTotal}`;
    document.getElementById('numLNext').style.display='';
  }));
}
