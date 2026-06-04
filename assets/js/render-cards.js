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
