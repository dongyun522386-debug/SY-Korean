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

function esc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
