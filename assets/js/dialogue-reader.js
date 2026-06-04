let selectedDialogueId = '';
let showDialogueTranslations = false;

function parseDialogueLines(korean, chinese) {
  const koLines = String(korean || '').split('\n').filter(Boolean);
  const zhLines = String(chinese || '').split('\n').filter(Boolean);
  return koLines.map((line, index) => {
    const match = line.match(/^([AB]):\s*(.*)$/);
    const zhMatch = (zhLines[index] || '').match(/^([AB]):\s*(.*)$/);
    return {
      speaker: match?.[1] || '',
      text: match?.[2] || line,
      translation: zhMatch?.[2] || zhLines[index] || ''
    };
  });
}

function buildDialogueReader(dialogues) {
  if (!dialogues.some(item => item.id === selectedDialogueId)) selectedDialogueId = dialogues[0].id;
  const selectedIndex = dialogues.findIndex(item => item.id === selectedDialogueId);
  const active = dialogues[selectedIndex];
  const learned = learnedWords.has(active.id);
  const lines = parseDialogueLines(active.example_kr, active.example_zh);
  const list = dialogues.map((item, index) => `
    <button class="dialogue-list-item ${item.id === active.id ? 'active' : ''}" type="button"
      onclick="selectDialogue('${esc(item.id)}')" aria-pressed="${item.id === active.id}">
      <span class="dialogue-list-number">${index + 1}</span>
      <span>
        <strong>${esc(item.korean.replace(/^상황 \d+:\s*/, ''))}</strong>
        <small>${esc(item.chinese.replace(/^情境 \d+[：:]\s*/, ''))}</small>
      </span>
    </button>`).join('');
  const messages = lines.map((line, index) => `
    <div class="dialogue-message speaker-${line.speaker.toLowerCase()}">
      <span class="dialogue-speaker">${esc(line.speaker || '?')}</span>
      <div class="dialogue-bubble">
        <div class="dialogue-line">
          <span>${esc(line.text)}</span>
          <button class="dialogue-speak-btn" type="button" data-text="${esc(line.text)}"
            onclick="speakDialogueLine(event,this)" aria-label="${index + 1}번째 문장 듣기" title="문장 듣기">🔊</button>
        </div>
        ${line.translation ? `<p class="dialogue-translation ${showDialogueTranslations ? 'visible' : ''}">${esc(line.translation)}</p>` : ''}
      </div>
    </div>`).join('');
  return `
    <section class="dialogue-reader" aria-label="예문 대화 읽기">
      <aside class="dialogue-sidebar">
        <div class="dialogue-sidebar-heading">
          <strong>예문 대화</strong>
          <span>${dialogues.length}개 상황</span>
        </div>
        <div class="dialogue-list">${list}</div>
      </aside>
      <article class="dialogue-panel" data-id="${esc(active.id)}">
        <header class="dialogue-panel-header">
          <div>
            <span class="dialogue-eyebrow">상황 ${selectedIndex + 1}</span>
            <h3>${esc(active.korean.replace(/^상황 \d+:\s*/, ''))}</h3>
            <p>${esc(active.chinese.replace(/^情境 \d+[：:]\s*/, ''))}</p>
          </div>
          <div class="dialogue-header-actions">
            <button type="button" onclick="toggleDialogueTranslations()" aria-pressed="${showDialogueTranslations}">
              ${showDialogueTranslations ? '번역 숨기기' : '번역 보기'}
            </button>
            <button type="button" data-text="${esc(active.example_kr)}" onclick="speakDialogueLine(event,this)">🔊 전체 듣기</button>
          </div>
        </header>
        <div class="dialogue-messages">${messages}</div>
        <footer class="dialogue-panel-footer">
          <button type="button" class="dialogue-nav-btn" onclick="moveDialogue(-1)" ${selectedIndex === 0 ? 'disabled' : ''}>← 이전</button>
          <button type="button" class="dialogue-complete-btn ${learned ? 'completed' : ''}" onclick="toggleLearned(event,'${esc(active.id)}')">
            ${learned ? '✅ 학습 완료' : '⬜ 학습 완료'}
          </button>
          <button type="button" class="dialogue-nav-btn" onclick="moveDialogue(1)" ${selectedIndex === dialogues.length - 1 ? 'disabled' : ''}>다음 →</button>
        </footer>
      </article>
    </section>`;
}

function selectDialogue(id) {
  selectedDialogueId = id;
  renderCards();
}

function moveDialogue(direction) {
  const dialogues = getFilteredWords();
  const currentIndex = dialogues.findIndex(item => item.id === selectedDialogueId);
  const next = dialogues[currentIndex + direction];
  if (!next) return;
  selectedDialogueId = next.id;
  renderCards();
  document.querySelector('.dialogue-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function toggleDialogueTranslations() {
  showDialogueTranslations = !showDialogueTranslations;
  renderCards();
}

function speakDialogueLine(e, button) {
  speakWord(e, button.dataset.text || '');
}
