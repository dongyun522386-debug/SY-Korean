// ── FLASHCARD ───────────────────────────────────────────
function openFlashcard() {
  flashWords = getFilteredWords();
  if (!flashWords.length) { showToast('해당 조건에 맞는 단어가 없어요 🔍'); return; }
  flashIdx = 0; flashFlipped = false;
  const cc = ['#3182F6','#69A7FF'];
  const flashBackEl = document.querySelector('.flash-back');
  if(flashBackEl) flashBackEl.style.background = `linear-gradient(145deg,${cc[0]},${cc[1]})`;
  document.getElementById('flashCategory').textContent = `${BOOK_LABEL[currentTab]} · ${CONTENT_LABEL[currentContentType]}`;
  document.getElementById('flashOverlay').classList.add('open');
  renderFlashCard();
}

function renderFlashCard() {
  const w = flashWords[flashIdx];
  document.getElementById('flashWord').textContent = w.korean;
  document.getElementById('flashRom').textContent  = '[' + w.romanization + ']';
  document.getElementById('flashZh').textContent   = w.chinese;
  document.getElementById('flashExKr').textContent = w.example_kr ? '📝 ' + w.example_kr : '';
  document.getElementById('flashExZh').textContent = w.example_zh ? '🇨🇳 ' + w.example_zh : '';
  document.getElementById('flashPos').textContent  = (flashIdx+1) + ' / ' + flashWords.length;
  document.getElementById('flashLevelBadge').textContent = w.level;
  // reset flip
  flashFlipped = false;
  document.getElementById('flashCard').classList.remove('flipped');
  // nav buttons
  document.getElementById('flashPrev').disabled = flashIdx === 0;
  document.getElementById('flashNext').disabled = flashIdx === flashWords.length - 1;
}

function toggleFlashCard() {
  flashFlipped = !flashFlipped;
  document.getElementById('flashCard').classList.toggle('flipped', flashFlipped);
}

function moveFlash(dir) {
  const newIdx = flashIdx + dir;
  if (newIdx < 0 || newIdx >= flashWords.length) return;
  flashIdx = newIdx;
  renderFlashCard();
}

function speakFlash() {
  const w = flashWords[flashIdx];
  if (!w || !window.speechSynthesis) return;
  const u = new SpeechSynthesisUtterance(w.korean);
  u.lang = 'ko-KR'; u.rate = 0.85;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}
