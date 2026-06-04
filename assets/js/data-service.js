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
