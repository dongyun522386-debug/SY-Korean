function applyDarkMode() {
  document.body.classList.toggle('dark', darkMode);
  const darkToggle = $('darkToggle');
  darkToggle.textContent = darkMode ? '☀️' : '🌙';
  darkToggle.setAttribute('aria-label', darkMode ? '라이트 모드 전환' : '다크 모드 전환');
  darkToggle.setAttribute('title', darkMode ? '라이트 모드 전환' : '다크 모드 전환');
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
  const pct = words.length ? (words.filter(word => learnedWords.has(word.id)).length / words.length * 100) : 0;
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
  return (vocabulary[tab] || []).filter(word => (word.content_type || 'vocab') === type).length;
}

function getTodayTargetCount() {
  const words = (vocabulary[currentTab] || [])
    .filter(word => (word.content_type || 'vocab') === currentContentType && !learnedWords.has(word.id));
  return Math.min(words.length, 10);
}

function updateDashboardSummary() {
  setText('dashboardBookName', BOOK_LABEL[currentTab] || '감자도리 1권');
  setText('todayPlanCount', getTodayTargetCount());
  setText('dashboardTotalCount', getBookTotal());
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

  if (!revealBtn) return;
  revealBtn.style.display = hiddenCount || showAllBooks ? '' : 'none';
  revealBtn.textContent = showAllBooks ? '빈 단어장 숨기기' : '다른 단어장 보기';
  revealBtn.classList.toggle('active', showAllBooks);
  revealBtn.setAttribute('aria-expanded', String(showAllBooks));
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

function handleCardClick(event, cardEl) {
  if (event.target.closest('button')) return;
  event.preventDefault();
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;
  cardEl.classList.toggle('flipped');
  requestAnimationFrame(() => {
    if (Math.abs(window.scrollY - scrollY) > 1 || Math.abs(window.scrollX - scrollX) > 1) {
      window.scrollTo(scrollX, scrollY);
    }
  });
}

function speakWord(event, word) {
  event.stopPropagation();
  if (!window.speechSynthesis) return;
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = 'ko-KR';
  utterance.rate = 0.85;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tab));
  document.querySelectorAll('.mobile-tab-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tab));
  updateDashboardSummary();
  renderCards();
}

function switchContentType(type) {
  currentContentType = type;
  document.querySelectorAll('.content-tab-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.type === type));
  updateDashboardSummary();
  renderCards();
}

function showToast(message) {
  const toast = $('toastMsg');
  toast.textContent = message;
  toast.style.opacity = '1';
  toast.style.transform = 'translateX(-50%) translateY(0)';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(20px)';
  }, 2800);
}
