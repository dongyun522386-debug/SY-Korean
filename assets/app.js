async function init() {
  try {
    applyDarkMode();
    const { user, profile } = await loadApplicationData();
    if (!user) {
      window.location.href = 'login.html';
      return;
    }

    setText('userName', profile?.display_name || user.email.split('@')[0]);
    setVisible('adminLink', isAdmin);
    setVisible('loadingState', false);
    setVisible('mainContent', true);

    updateTabCounts();
    updateBookVisibility();
    renderCards();
    bindEvents();
    updateProgress();
    updateDashboardSummary();
  } catch (error) {
    showLoadError(error.message);
  }
}

function showLoadError(message) {
  $('loadingState').innerHTML =
    `<div style="font-size:3rem">⚠️</div><p style="color:var(--accent)">데이터 로드 실패<br><small>${esc(message)}</small></p>`;
}

init();
