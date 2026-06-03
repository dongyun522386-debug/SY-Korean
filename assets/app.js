const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON);

// ── STATE ──────────────────────────────────────────────
const TABS = ['book1','book2','book3','book4','book5'];
const LEGACY_CATEGORIES = ['nouns','verbs','adjectives','fixed','numbers','daily'];
const CONTENT_TYPES = ['vocab','pronunciation','dialogue','reading','listening'];
const BOOK_LABEL = {book1:'감자도리 1권',book2:'감자도리 2권',book3:'감자도리 3권',book4:'감자도리 4권',book5:'감자도리 5권'};
const CONTENT_LABEL = {vocab:'단어 뜻',pronunciation:'발음 연습',dialogue:'예문 대화',reading:'읽기 연습',listening:'듣기 연습'};
let vocabulary   = Object.fromEntries(TABS.map(t => [t, []]));
let learnedWords = new Set();
let bookmarks    = new Set();
let currentUser  = null;
let isAdmin      = false;
let currentTab   = 'book1';
let currentContentType = 'vocab';
let currentLevel = '전체';
let sortAlpha    = false;
let searchQuery  = '';
let showBookmarksOnly = false;
let showAllBooks = false;
let darkMode     = localStorage.getItem('dark_mode') === 'true';
// Quiz
let quizScore = 0, quizTotal = 0, quizAnswered = false;
// Flashcard
let flashWords = [], flashIdx = 0, flashFlipped = false;

const LOCAL_DIALOGUE_ITEMS = window.LOCAL_DIALOGUE_ITEMS || [];

function $(id) {
  return document.getElementById(id);
}

function setText(id, value) {
  const el = $(id);
  if (el) el.textContent = value;
}

function setVisible(id, visible) {
  const el = $(id);
  if (el) el.style.display = visible ? '' : 'none';
}

function getAllLearningItems() {
  return TABS.flatMap(tab => vocabulary[tab] || []);
}

// ── INIT ───────────────────────────────────────────────
async function init() {
  applyDarkMode();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) { window.location.href = 'login.html'; return; }
  currentUser = user;

  const { data: profile } = await sb.from('profiles').select('*').eq('id', user.id).single();
  setText('userName', profile?.display_name || user.email.split('@')[0]);
  if (profile?.role === 'admin') {
    isAdmin = true;
    setVisible('adminLink', true);
  }

  const { data: words, error: wErr } = await sb.from('words').select('*').order('category').order('sort_order');
  if (wErr) { showLoadError(wErr.message); return; }
  (words || []).forEach(w => {
    const normalized = normalizeLearningItem(w);
    if (vocabulary[normalized.book]) vocabulary[normalized.book].push(normalized);
  });
  mergeLocalDialogueItems();

  const { data: progress } = await sb.from('user_progress').select('word_id,learned,bookmarked').eq('user_id', user.id);
  learnedWords = new Set((progress||[]).filter(p => p.learned).map(p => p.word_id));
  bookmarks    = new Set((progress||[]).filter(p => p.bookmarked).map(p => p.word_id));
  loadLocalProgress();

  setVisible('loadingState', false);
  setVisible('mainContent', true);
  updateTabCounts();
  updateBookVisibility();
  renderCards();
  bindEvents();
  updateProgress();
  updateDashboardSummary();
}

function showLoadError(msg) {
  $('loadingState').innerHTML =
    `<div style="font-size:3rem">⚠️</div><p style="color:var(--accent)">데이터 로드 실패<br><small>${msg}</small></p>`;
}

function applyDarkMode() {
  document.body.classList.toggle('dark', darkMode);
  const darkToggle = $('darkToggle');
  darkToggle.textContent = darkMode ? '☀️' : '🌙';
  darkToggle.setAttribute('aria-label', darkMode ? '라이트 모드 전환' : '다크 모드 전환');
  darkToggle.setAttribute('title', darkMode ? '라이트 모드 전환' : '다크 모드 전환');
}

function normalizeLearningItem(word) {
  const rawBook = word.book || word.book_id || word.volume || word.volume_id;
  const book = TABS.includes(rawBook) ? rawBook : 'book1';
  const rawType = word.content_type || word.contentType || word.type;
  const contentType = CONTENT_TYPES.includes(rawType) ? rawType : 'vocab';
  return {
    ...word,
    book,
    content_type: contentType,
    category: LEGACY_CATEGORIES.includes(word.category) ? word.category : 'nouns'
  };
}

function mergeLocalDialogueItems() {
  const existing = new Set((vocabulary.book1 || [])
    .filter(w => (w.content_type || 'vocab') === 'dialogue')
    .map(w => w.korean));
  LOCAL_DIALOGUE_ITEMS.forEach(item => {
    if (!existing.has(item.korean)) vocabulary.book1.push(item);
  });
}

function getLocalProgressKey(kind) {
  return `local_${kind}_${currentUser?.id || 'guest'}`;
}

function readLocalSet(kind) {
  try {
    return new Set(JSON.parse(localStorage.getItem(getLocalProgressKey(kind)) || '[]'));
  } catch {
    return new Set();
  }
}

function saveLocalSet(kind, values) {
  localStorage.setItem(getLocalProgressKey(kind), JSON.stringify([...values]));
}

function loadLocalProgress() {
  readLocalSet('learned').forEach(id => learnedWords.add(id));
  readLocalSet('bookmarks').forEach(id => bookmarks.add(id));
}

function findLearningItem(wordId) {
  return getAllLearningItems().find(w => w.id === wordId);
}

function updateTabCounts() {
  TABS.forEach(tab => {
    const words = vocabulary[tab] || [];
    const el = $('cnt-' + tab);
    if (el) el.textContent = words.length;
    updateTabProgress(tab);
  });
  updateBookVisibility();
  updateDashboardSummary();
}

function updateTabProgress(tab) {
  const words = vocabulary[tab] || [];
  const pct = words.length ? (words.filter(w => learnedWords.has(w.id)).length / words.length * 100) : 0;
  const el = $('prg-' + tab);
  if (el) el.style.width = pct + '%';
}

function updateProgress() {
  setText('learnedCount', learnedWords.size);
  setText('bookmarkCount', bookmarks.size);
  TABS.forEach(updateTabProgress);
  updateDashboardSummary();
}

function getBookTotal(tab = currentTab) {
  return (vocabulary[tab] || []).length;
}

function getTypeTotal(tab = currentTab, type = currentContentType) {
  return (vocabulary[tab] || []).filter(w => (w.content_type || 'vocab') === type).length;
}

function getTodayTargetCount() {
  const words = (vocabulary[currentTab] || [])
    .filter(w => (w.content_type || 'vocab') === currentContentType && !learnedWords.has(w.id));
  return Math.min(words.length, 10);
}

function updateDashboardSummary() {
  const bookTotal = getBookTotal();
  const todayCount = getTodayTargetCount();
  const bookName = BOOK_LABEL[currentTab] || '감자도리 1권';
  setText('dashboardBookName', bookName);
  setText('todayPlanCount', todayCount);
  setText('dashboardTotalCount', bookTotal);
  setText('dashboardBookmarkCount', bookmarks.size);
  setText('todayLearnedMeter', learnedWords.size);
}

function updateBookVisibility() {
  const revealBtn = $('showEmptyBooksBtn');
  let hiddenCount = 0;
  TABS.forEach(tab => {
    const shouldHide = !showAllBooks && getBookTotal(tab) === 0 && tab !== currentTab && !isAdmin;
    if (shouldHide) hiddenCount++;
    document.querySelectorAll(`[data-tab="${tab}"]`).forEach(btn => {
      btn.classList.toggle('is-hidden', shouldHide);
      btn.setAttribute('aria-hidden', shouldHide ? 'true' : 'false');
    });
  });
  if (revealBtn) {
    revealBtn.style.display = hiddenCount || showAllBooks ? '' : 'none';
    revealBtn.textContent = showAllBooks ? '빈 단어장 숨기기' : '다른 단어장 보기';
    revealBtn.classList.toggle('active', showAllBooks);
    revealBtn.setAttribute('aria-expanded', String(showAllBooks));
  }
}

function setLevelFilter(level) {
  currentLevel = level;
  document.querySelectorAll('.filter-btn:not(.bookmark-filter)').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.level === level);
  });
}

function resetFilters() {
  searchQuery = '';
  showBookmarksOnly = false;
  sortAlpha = false;
  setLevelFilter('전체');
  const searchInput = $('searchInput');
  if (searchInput) searchInput.value = '';
  $('bookmarkFilter')?.classList.remove('active');
  $('sortBtn')?.classList.remove('active');
}

function showAllWords() {
  resetFilters();
  if (getTypeTotal(currentTab, currentContentType) === 0 && getTypeTotal(currentTab, 'vocab') > 0) {
    switchContentType('vocab');
    return;
  }
  renderCards();
}

function clearSearchFilter() {
  searchQuery = '';
  const searchInput = $('searchInput');
  if (searchInput) searchInput.value = '';
  renderCards();
}

function clearLevelFilter() {
  setLevelFilter('전체');
  renderCards();
}

function toggleBookmarkFilter() {
  showBookmarksOnly = !showBookmarksOnly;
  $('bookmarkFilter')?.classList.toggle('active', showBookmarksOnly);
  renderCards();
}

function toggleSortFilter() {
  sortAlpha = !sortAlpha;
  $('sortBtn')?.classList.toggle('active', sortAlpha);
  renderCards();
}

function openAdminOrToast() {
  if (isAdmin) {
    window.location.href = 'admin.html';
    return;
  }
  showToast('관리자만 단어를 추가할 수 있어요');
}

// ── RENDER ─────────────────────────────────────────────
function getFilteredWords() {
  let words = [...(vocabulary[currentTab] || [])].filter(w => (w.content_type || 'vocab') === currentContentType);
  if (showBookmarksOnly) words = words.filter(w => bookmarks.has(w.id));
  if (currentLevel !== '전체') words = words.filter(w => w.level === currentLevel);
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    words = words.filter(w =>
      String(w.korean || '').toLowerCase().includes(q) ||
      String(w.chinese || '').toLowerCase().includes(q) ||
      String(w.romanization || '').toLowerCase().includes(q)
    );
  }
  if (sortAlpha) words.sort((a, b) => a.korean.localeCompare(b.korean, 'ko'));
  return words;
}

function renderResultBar({ bookTotal, typeTotal, filteredCount }) {
  const bar = $('resultBar');
  if (!bar) return;

  const hasActiveCondition = searchQuery || showBookmarksOnly || currentLevel !== '전체' || sortAlpha || typeTotal !== bookTotal;
  const countHtml = hasActiveCondition
    ? `<span class="result-count">전체 <strong>${bookTotal}</strong>개 중 현재 조건 <strong>${filteredCount}</strong>개</span>`
    : `<span class="result-count">전체 단어 <strong>${bookTotal}</strong>개</span>`;
  const contextHtml = `<span class="result-context">${BOOK_LABEL[currentTab]} · ${CONTENT_LABEL[currentContentType]} ${typeTotal}개</span>`;

  // 활성 필터 칩 생성
  const chips = [];
  if (searchQuery) {
    chips.push(`<span class="filter-chip" onclick="clearSearchFilter()">🔍 "${esc(searchQuery)}" <span class="chip-x">✕</span></span>`);
  }
  if (currentLevel !== '전체') {
    chips.push(`<span class="filter-chip" onclick="clearLevelFilter()">${currentLevel} <span class="chip-x">✕</span></span>`);
  }
  if (showBookmarksOnly) {
    chips.push(`<span class="filter-chip chip-bookmark" onclick="toggleBookmarkFilter()">⭐ 즐겨찾기 <span class="chip-x">✕</span></span>`);
  }
  if (sortAlpha) {
    chips.push(`<span class="filter-chip chip-sort" onclick="toggleSortFilter()">가나다순 ↕ <span class="chip-x">✕</span></span>`);
  }

  bar.innerHTML = countHtml + contextHtml + (chips.length ? `<div class="active-filters">${chips.join('')}</div>` : '');
}

function renderCards() {
  // BUG FIX: reset all flipped cards before re-render
  document.querySelectorAll('.card-wrap.flipped').forEach(c => c.classList.remove('flipped'));
  const grid  = $('cardGrid');
  const words = getFilteredWords();
  const bookTotal = getBookTotal();
  const typeTotal = getTypeTotal();
  renderResultBar({ bookTotal, typeTotal, filteredCount: words.length });
  updateDashboardSummary();
  if (!words.length) {
    grid.innerHTML = buildEmptyState(bookTotal, typeTotal);
    return;
  }
  if (currentContentType === 'dialogue') {
    grid.innerHTML = buildDialogueReader(words);
    return;
  }
  grid.innerHTML = words.map(w => buildCard(w)).join('');
}

function buildEmptyState(bookTotal, typeTotal) {
  const icon = bookTotal ? '🔎' : '📚';
  const title = '현재 조건에 맞는 단어가 없습니다';
  const sub = bookTotal
    ? '다른 학습 유형이나 필터를 선택하거나 전체 단어를 확인해보세요.'
    : '아직 이 단어장에는 학습 자료가 없습니다. 관리자 화면에서 단어를 추가할 수 있어요.';
  const addButton = `<button class="empty-action secondary" onclick="openAdminOrToast()">단어 추가하기</button>`;
  return `<div class="empty-state">
    <div class="empty-icon">${icon}</div>
    <div class="empty-title">${title}</div>
    <div class="empty-sub">${sub}<br><small>현재 유형 ${typeTotal}개 / 전체 ${bookTotal}개</small></div>
    <div class="empty-actions">
      <button class="empty-action" onclick="showAllWords()">전체 보기</button>
      ${addButton}
    </div>
  </div>`;
}

function buildCard(w) {
  const learned    = learnedWords.has(w.id);
  const bookmarked = bookmarks.has(w.id);
  const contentType = w.content_type || 'vocab';
  return `
  <div class="card-wrap" data-id="${w.id}" data-cat="${esc(w.category)}" data-type="${esc(contentType)}" onclick="handleCardClick(event,this)">
    <div class="card-inner">
      <div class="card-face card-front">
        <div class="card-top">
          <span class="level-badge level-${esc(w.level)}">${esc(w.level)}</span>
          <div class="card-actions">
            <button class="speak-btn"    onclick="speakWord(event,'${esc(w.korean)}')" title="발음">🔊</button>
            <button class="bookmark-btn ${bookmarked?'bookmarked':''}" onclick="toggleBookmark(event,'${w.id}')" title="즐겨찾기">${bookmarked?'⭐':'☆'}</button>
            <button class="check-btn    ${learned?'checked':''}"    onclick="toggleLearned(event,'${w.id}')">${learned?'✅':'⬜'}</button>
          </div>
        </div>
        <div class="card-middle">
          <div class="word-kr">${esc(w.korean)}</div>
          <div class="word-rom">[${esc(w.romanization)}]</div>
        </div>
        <div class="card-bottom"><span class="flip-hint">클릭하면 뜻이 나와요 · 点击查看意思</span></div>
      </div>
      <div class="card-face card-back">
        <div class="back-top">
          <span class="back-label">${esc(w.korean)} · ${esc(w.romanization)}</span>
          <button class="back-check-btn ${learned?'checked':''}" onclick="toggleLearned(event,'${w.id}')">${learned?'✅':'⬜'}</button>
        </div>
        <div class="word-zh">${esc(w.chinese)}</div>
        <div class="example-block">
          <div class="example-kr">${contentType === 'dialogue' ? '' : '📝 '}${esc(w.example_kr||'')}</div>
          <div class="example-zh">${contentType === 'dialogue' ? '' : '🇨🇳 '}${esc(w.example_zh||'')}</div>
        </div>
      </div>
    </div>
  </div>`;
}

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

function esc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── INTERACTIONS ────────────────────────────────────────
function handleCardClick(e, cardEl) {
  if (e.target.closest('button')) return;
  e.preventDefault();
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;
  cardEl.classList.toggle('flipped');
  requestAnimationFrame(() => {
    if (Math.abs(window.scrollY - scrollY) > 1 || Math.abs(window.scrollX - scrollX) > 1) {
      window.scrollTo(scrollX, scrollY);
    }
  });
}

function speakWord(e, word) {
  e.stopPropagation();
  if (!window.speechSynthesis) return;
  const u = new SpeechSynthesisUtterance(word);
  u.lang = 'ko-KR'; u.rate = 0.85;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

async function toggleLearned(e, wordId) {
  e.stopPropagation();
  const btns = document.querySelectorAll(`[data-id="${wordId}"] .check-btn, [data-id="${wordId}"] .back-check-btn, [data-id="${wordId}"] .dialogue-complete-btn`);
  btns.forEach(b => b.disabled = true);
  const was = learnedWords.has(wordId);
  was ? learnedWords.delete(wordId) : learnedWords.add(wordId);
  updateProgress();
  const now = learnedWords.has(wordId);
  btns.forEach(b => {
    const isDialogueComplete = b.classList.contains('dialogue-complete-btn');
    b.textContent = isDialogueComplete
      ? (now ? '✅ 학습 완료' : '⬜ 학습 완료')
      : (now ? '✅' : '⬜');
    b.classList.toggle('checked', now);
    b.classList.toggle('completed', now);
  });
  const item = findLearningItem(wordId);
  if (item?.is_local) {
    const localLearned = readLocalSet('learned');
    now ? localLearned.add(wordId) : localLearned.delete(wordId);
    saveLocalSet('learned', localLearned);
    btns.forEach(b => b.disabled = false);
    return;
  }
  await sb.from('user_progress').upsert(
    { user_id: currentUser.id, word_id: wordId, learned: !was, learned_at: !was ? new Date().toISOString() : null },
    { onConflict: 'user_id,word_id' }
  );
  btns.forEach(b => b.disabled = false);
}

async function toggleBookmark(e, wordId) {
  e.stopPropagation();
  const was = bookmarks.has(wordId);
  was ? bookmarks.delete(wordId) : bookmarks.add(wordId);
  updateProgress();
  const card = document.querySelector(`[data-id="${wordId}"]`);
  if (card) {
    const now = bookmarks.has(wordId);
    const btn = card.querySelector('.bookmark-btn');
    if (btn) { btn.textContent = now ? '⭐' : '☆'; btn.classList.toggle('bookmarked', now); }
  }
  const item = findLearningItem(wordId);
  if (item?.is_local) {
    const localBookmarks = readLocalSet('bookmarks');
    bookmarks.has(wordId) ? localBookmarks.add(wordId) : localBookmarks.delete(wordId);
    saveLocalSet('bookmarks', localBookmarks);
    return;
  }
  await sb.from('user_progress').upsert(
    { user_id: currentUser.id, word_id: wordId, bookmarked: !was },
    { onConflict: 'user_id,word_id' }
  );
}

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

// ── SWITCH TAB ──────────────────────────────────────────
function switchTab(tab) {
  currentTab = tab;
  // Desktop tabs
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  // Mobile tabs
  document.querySelectorAll('.mobile-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  updateDashboardSummary();
  renderCards();
}

function switchContentType(type) {
  currentContentType = type;
  document.querySelectorAll('.content-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.type === type));
  updateDashboardSummary();
  renderCards();
}

// ── EVENTS ──────────────────────────────────────────────
function bindEvents() {
  // Desktop tabs
  document.querySelectorAll('.tab-btn').forEach(btn =>
    btn.addEventListener('click', () => switchTab(btn.dataset.tab))
  );
  // Mobile tabs
  document.querySelectorAll('.mobile-tab-btn').forEach(btn =>
    btn.addEventListener('click', () => switchTab(btn.dataset.tab))
  );
  document.querySelectorAll('.content-tab-btn').forEach(btn =>
    btn.addEventListener('click', () => switchContentType(btn.dataset.type))
  );
  // Filters
  document.querySelectorAll('.filter-btn:not(.bookmark-filter)').forEach(btn =>
    btn.addEventListener('click', () => {
      setLevelFilter(btn.dataset.level);
      renderCards();
    })
  );
  $('showEmptyBooksBtn')?.addEventListener('click', function() {
    showAllBooks = !showAllBooks;
    updateBookVisibility();
  });
  // Bookmark filter
  $('bookmarkFilter').addEventListener('click', toggleBookmarkFilter);
  // Sort
  $('sortBtn').addEventListener('click', toggleSortFilter);
  // Search
  $('searchInput').addEventListener('input', e => {
    searchQuery = e.target.value.trim(); renderCards();
  });
  // Quiz
  $('quizBtn').addEventListener('click', () => { quizScore=0; quizTotal=0; startQuiz(); });
  $('quizNextBtn').addEventListener('click', startQuiz);
  // Flashcard
  $('adminLink').addEventListener('click', () => {
    window.location.href = 'admin.html';
  });
  $('todayStartBtn').addEventListener('click', () => $('flashBtn').click());
  $('reviewBtn').addEventListener('click', () => {
    showBookmarksOnly = true;
    $('bookmarkFilter').classList.add('active');
    renderCards();
    if (getFilteredWords().length) $('flashBtn').click();
  });
  $('allWordsBtn').addEventListener('click', showAllWords);
  $('heroFlashBtn').addEventListener('click', () => $('flashBtn').click());
  $('heroQuizBtn').addEventListener('click', () => $('quizBtn').click());
  $('heroNumBtn').addEventListener('click', () => $('numOpenBtn').click());
  $('flashBtn').addEventListener('click', openFlashcard);
  $('flashCloseBtn').addEventListener('click', () => $('flashOverlay').classList.remove('open'));
  $('flashCard').addEventListener('click', toggleFlashCard);
  $('flashPrev').addEventListener('click', () => moveFlash(-1));
  $('flashSpeak').addEventListener('click', speakFlash);
  $('flashNext').addEventListener('click', () => moveFlash(1));
  // Keyboard shortcuts for flashcard
  document.addEventListener('keydown', e => {
    if (!$('flashOverlay').classList.contains('open')) return;
    if (e.key === ' ' || e.key === 'ArrowUp') { e.preventDefault(); toggleFlashCard(); }
    if (e.key === 'ArrowRight') moveFlash(1);
    if (e.key === 'ArrowLeft')  moveFlash(-1);
    if (e.key === 'Escape') $('flashOverlay').classList.remove('open');
  });
  // Dark mode
  $('darkToggle').addEventListener('click', () => {
    darkMode = !darkMode; localStorage.setItem('dark_mode', darkMode); applyDarkMode();
  });
  // Logout
  $('logoutBtn').addEventListener('click', async () => {
    await sb.auth.signOut(); window.location.href = 'login.html';
  });
  // Tips
  $('tipsToggle').addEventListener('click', () => {
    $('tipsBody').classList.toggle('open');
    $('tipsToggle').classList.toggle('open');
  });
  // Quiz close re-enables button
  $('quizCloseBtn').addEventListener('click', () => {
    $('quizOverlay').classList.remove('open');
    $('quizBtn').disabled = false;
  });
  $('quizOverlay').addEventListener('click', e => {
    if (e.target===e.currentTarget) {
      e.currentTarget.classList.remove('open');
      $('quizBtn').disabled = false;
    }
  });
  // Quiz keyboard: 1-4 select answer, Enter=next, Escape=close
  document.addEventListener('keydown', e => {
    const quizOpen = $('quizOverlay').classList.contains('open');
    if (quizOpen) {
      if (!quizAnswered) {
        const opts = document.querySelectorAll('.quiz-opt');
        if (e.key==='1' && opts[0]) opts[0].click();
        else if (e.key==='2' && opts[1]) opts[1].click();
        else if (e.key==='3' && opts[2]) opts[2].click();
        else if (e.key==='4' && opts[3]) opts[3].click();
      }
      if (e.key==='Enter') $('quizNextBtn').click();
      if (e.key==='Escape') { $('quizCloseBtn').click(); }
    }
  });
  // 숫자 연습 modal open
  $('numOpenBtn').addEventListener('click', openNumModal);
  $('numClose').addEventListener('click', () => $('numOverlay').classList.remove('open'));
  $('numOverlay').addEventListener('click', e => { if (e.target===e.currentTarget) e.currentTarget.classList.remove('open'); });
  // num sub-tabs
  document.querySelectorAll('.num-stab').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.num-stab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const t = btn.dataset.stab;
    $('numPanelTable').style.display = t==='table' ? '' : 'none';
    $('numPanelQuiz').style.display  = t==='quiz'  ? '' : 'none';
    $('numPanelListen').style.display= t==='listen'? '' : 'none';
    if (t==='quiz') startNumQuiz();
    if (t==='listen') startNumListen();
  }));
  $('numQuizRestart').addEventListener('click', startNumQuiz);
  $('numQNext').addEventListener('click', () => { numQAnswered=false; startNumQuestion(); });
  $('numLPlay').addEventListener('click', playNumListen);
  $('numLNext').addEventListener('click', () => { numLAnswered=false; startNumListen(); });
}

// ── TOAST ──────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toastMsg');
  t.textContent = msg;
  t.style.opacity = '1'; t.style.transform = 'translateX(-50%) translateY(0)';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(-50%) translateY(20px)'; }, 2800);
}

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

init();
