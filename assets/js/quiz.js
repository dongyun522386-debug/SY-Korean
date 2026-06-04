// ── QUIZ ────────────────────────────────────────────────
function startQuiz() {
  quizAnswered = false;
  document.getElementById('quizBtn').disabled = true;
  const all = getFilteredWords();
  if (all.length < 4) { showToast('단어가 너무 적어요 (최소 4개 필요) 🔍'); document.getElementById('quizBtn').disabled = false; return; }
  const correct = all[Math.floor(Math.random() * all.length)];
  const wrongs  = all.filter(w => w.id !== correct.id).sort(() => Math.random()-.5).slice(0,3);
  const options = [...wrongs, correct].sort(() => Math.random()-.5);
  document.getElementById('qWord').textContent = correct.korean;
  document.getElementById('qRom').textContent  = '[' + correct.romanization + ']';
  document.getElementById('quizFeedback').textContent = '';
  document.getElementById('quizOptions').innerHTML = options.map(opt =>
    `<button class="quiz-opt" data-id="${esc(opt.id)}" data-correct="${esc(correct.id)}">${esc(opt.chinese)}</button>`
  ).join('');
  document.querySelectorAll('.quiz-opt').forEach(b => b.addEventListener('click', function() {
    answerQuiz(this.dataset.id, this.dataset.correct);
  }));
  document.getElementById('quizOverlay').classList.add('open');
  document.getElementById('quizScore').textContent = `점수: ${quizScore} / ${quizTotal}`;
}

function answerQuiz(chosenId, correctId) {
  if (quizAnswered) return;
  quizAnswered = true; quizTotal++;
  const fb = document.getElementById('quizFeedback');
  document.querySelectorAll('.quiz-opt').forEach(b => {
    b.disabled = true;
    if (b.dataset.id === correctId) b.classList.add('correct');
    if (b.dataset.id === chosenId && chosenId !== correctId) b.classList.add('wrong');
  });
  if (chosenId === correctId) {
    quizScore++;
    fb.textContent = '🎉 정답이에요! 正确！'; fb.style.color = '#4CAF50';
  } else {
    fb.textContent = '❌ 틀렸어요. 加油！'; fb.style.color = 'var(--accent)';
  }
  document.getElementById('quizScore').textContent = `점수: ${quizScore} / ${quizTotal}`;
}
