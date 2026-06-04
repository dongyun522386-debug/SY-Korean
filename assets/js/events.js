let eventsBound = false;

function bindNavigationEvents() {
  document.querySelectorAll('.tab-btn, .mobile-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
  document.querySelectorAll('.content-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchContentType(btn.dataset.type));
  });
  $('adminLink').addEventListener('click', () => {
    window.location.href = 'admin.html';
  });
  $('logoutBtn').addEventListener('click', async () => {
    await sb.auth.signOut();
    window.location.href = 'login.html';
  });
}

function bindFilterEvents() {
  document.querySelectorAll('.filter-btn:not(.bookmark-filter)').forEach(btn => {
    btn.addEventListener('click', () => {
      setLevelFilter(btn.dataset.level);
      renderCards();
    });
  });
  $('showEmptyBooksBtn')?.addEventListener('click', () => {
    showAllBooks = !showAllBooks;
    updateBookVisibility();
  });
  $('bookmarkFilter').addEventListener('click', toggleBookmarkFilter);
  $('sortBtn').addEventListener('click', toggleSortFilter);
  $('searchInput').addEventListener('input', event => {
    searchQuery = event.target.value.trim();
    renderCards();
  });
}

function bindDashboardEvents() {
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
  $('darkToggle').addEventListener('click', () => {
    darkMode = !darkMode;
    localStorage.setItem('dark_mode', darkMode);
    applyDarkMode();
  });
  $('tipsToggle').addEventListener('click', () => {
    $('tipsBody').classList.toggle('open');
    $('tipsToggle').classList.toggle('open');
  });
}

function bindFlashcardEvents() {
  $('flashBtn').addEventListener('click', openFlashcard);
  $('flashCloseBtn').addEventListener('click', () => $('flashOverlay').classList.remove('open'));
  $('flashCard').addEventListener('click', toggleFlashCard);
  $('flashPrev').addEventListener('click', () => moveFlash(-1));
  $('flashSpeak').addEventListener('click', speakFlash);
  $('flashNext').addEventListener('click', () => moveFlash(1));

  document.addEventListener('keydown', event => {
    if (!$('flashOverlay').classList.contains('open')) return;
    if (event.key === ' ' || event.key === 'ArrowUp') {
      event.preventDefault();
      toggleFlashCard();
    }
    if (event.key === 'ArrowRight') moveFlash(1);
    if (event.key === 'ArrowLeft') moveFlash(-1);
    if (event.key === 'Escape') $('flashOverlay').classList.remove('open');
  });
}

function closeQuiz() {
  $('quizOverlay').classList.remove('open');
  $('quizBtn').disabled = false;
}

function bindQuizEvents() {
  $('quizBtn').addEventListener('click', () => {
    quizScore = 0;
    quizTotal = 0;
    startQuiz();
  });
  $('quizNextBtn').addEventListener('click', startQuiz);
  $('quizCloseBtn').addEventListener('click', closeQuiz);
  $('quizOverlay').addEventListener('click', event => {
    if (event.target === event.currentTarget) closeQuiz();
  });

  document.addEventListener('keydown', event => {
    if (!$('quizOverlay').classList.contains('open')) return;
    if (!quizAnswered) {
      const options = document.querySelectorAll('.quiz-opt');
      const optionIndex = Number(event.key) - 1;
      if (optionIndex >= 0 && optionIndex < 4 && options[optionIndex]) options[optionIndex].click();
    }
    if (event.key === 'Enter') $('quizNextBtn').click();
    if (event.key === 'Escape') closeQuiz();
  });
}

function bindNumberEvents() {
  $('numOpenBtn').addEventListener('click', openNumModal);
  $('numClose').addEventListener('click', () => $('numOverlay').classList.remove('open'));
  $('numOverlay').addEventListener('click', event => {
    if (event.target === event.currentTarget) event.currentTarget.classList.remove('open');
  });
  document.querySelectorAll('.num-stab').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.num-stab').forEach(item => item.classList.remove('active'));
    btn.classList.add('active');
    const tab = btn.dataset.stab;
    $('numPanelTable').style.display = tab === 'table' ? '' : 'none';
    $('numPanelQuiz').style.display = tab === 'quiz' ? '' : 'none';
    $('numPanelListen').style.display = tab === 'listen' ? '' : 'none';
    if (tab === 'quiz') startNumQuiz();
    if (tab === 'listen') startNumListen();
  }));
  $('numQuizRestart').addEventListener('click', startNumQuiz);
  $('numQNext').addEventListener('click', () => {
    numQAnswered = false;
    startNumQuestion();
  });
  $('numLPlay').addEventListener('click', playNumListen);
  $('numLNext').addEventListener('click', () => {
    numLAnswered = false;
    startNumListen();
  });
}

function bindEvents() {
  if (eventsBound) return;
  eventsBound = true;
  bindNavigationEvents();
  bindFilterEvents();
  bindDashboardEvents();
  bindFlashcardEvents();
  bindQuizEvents();
  bindNumberEvents();
}
