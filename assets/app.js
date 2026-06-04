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

function openAdminOrToast() {
  if (isAdmin) {
    window.location.href = 'admin.html';
    return;
  }
  showToast('관리자만 단어를 추가할 수 있어요');
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

init();
