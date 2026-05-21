const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON);

// ── STATE ──────────────────────────────────────────────
const TABS = ['book1','book2','book3','book4','book5'];
const LEGACY_CATEGORIES = ['nouns','verbs','adjectives','fixed','numbers','daily'];
const CONTENT_TYPES = ['vocab','pronunciation','dialogue','reading','listening'];
const BOOK_LABEL = {book1:'감자도리 1권',book2:'감자도리 2권',book3:'감자도리 3권',book4:'감자도리 4권',book5:'감자도리 5권'};
const CONTENT_LABEL = {vocab:'단어',pronunciation:'발음',dialogue:'대화',reading:'읽기',listening:'듣기'};
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
let darkMode     = localStorage.getItem('dark_mode') === 'true';
// Quiz
let quizScore = 0, quizTotal = 0, quizAnswered = false;
// Flashcard
let flashWords = [], flashIdx = 0, flashFlipped = false;

const LOCAL_DIALOGUE_ITEMS = [
  {
    id: '11111111-1111-4111-8111-111111111101',
    korean: '상황 1: 생일 케이크 주문하기',
    romanization: 'saengil keikeu jumunhagi',
    chinese: '情境 1：订生日蛋糕',
    example_kr: `A: 여보세요? 빵집이에요.
B: 안녕하세요. 케이크 있어요?
A: 네, 있어요.
B: 케이크가 얼마예요?
A: 이만 원이에요.
B: 좋아요. 하나 주세요.
A: 언제 필요해요?
B: 6월 19일이에요.
A: 생일이에요?
B: 네, 제 친구 생일이에요.
A: 알겠어요. 전화번호가 뭐예요?
B: 010-1234-5678이에요.`,
    example_zh: `A: 喂？这里是面包店。
B: 你好。有蛋糕吗？
A: 有的。
B: 蛋糕多少钱？
A: 两万韩元。
B: 好的。请给我一个。
A: 什么时候需要？
B: 6月19日。
A: 是生日吗？
B: 是的，是我朋友的生日。
A: 知道了。电话号码是多少？
B: 是010-1234-5678。`
  },
  {
    id: '11111111-1111-4111-8111-111111111102',
    korean: '상황 2: 꽃집에서 꽃 사기',
    romanization: 'kkotjibeseo kkot sagi',
    chinese: '情境 2：在花店买花',
    example_kr: `A: 어서 오세요.
B: 안녕하세요. 꽃 있어요?
A: 네, 있어요.
B: 이 꽃은 얼마예요?
A: 만 오천 원이에요.
B: 좋아요. 이거 주세요.
A: 선물이에요?
B: 네, 오늘 제 어머니 생일이에요.
A: 아, 생일 축하드려요.
B: 감사합니다.`,
    example_zh: `A: 欢迎光临。
B: 你好。有花吗？
A: 有的。
B: 这束花多少钱？
A: 一万五千韩元。
B: 好的。请给我这个。
A: 是礼物吗？
B: 是的，今天是我妈妈的生日。
A: 啊，祝生日快乐。
B: 谢谢。`
  },
  {
    id: '11111111-1111-4111-8111-111111111103',
    korean: '상황 3: 식당 예약 전화하기',
    romanization: 'sikdang yeyak jeonhwahagi',
    chinese: '情境 3：打电话预约餐厅',
    example_kr: `A: 여보세요? 감자식당이에요.
B: 안녕하세요. 오늘 자리 있어요?
A: 네, 있어요.
B: 몇 시에 가능해요?
A: 7시에 가능해요.
B: 좋아요. 7시에 갈게요.
A: 이름이 뭐예요?
B: 린단이에요.
A: 전화번호가 뭐예요?
B: 010-2222-3333이에요.
A: 네, 예약됐어요.`,
    example_zh: `A: 喂？这里是土豆餐厅。
B: 你好。今天有座位吗？
A: 有的。
B: 几点可以？
A: 7点可以。
B: 好的。我7点去。
A: 名字是什么？
B: 是琳丹。
A: 电话号码是多少？
B: 是010-2222-3333。
A: 好的，预约好了。`
  },
  {
    id: '11111111-1111-4111-8111-111111111104',
    korean: '상황 4: 선물 가격 묻기',
    romanization: 'seonmul gagyeok mutgi',
    chinese: '情境 4：询问礼物价格',
    example_kr: `A: 어서 오세요.
B: 안녕하세요. 이 시계 얼마예요?
A: 삼만 원이에요.
B: 조금 비싸요. 저 가방은 얼마예요?
A: 이만 원이에요.
B: 좋아요. 이 가방 주세요.
A: 선물이에요?
B: 네, 친구 생일 선물이에요.
A: 친구 생일이 언제예요?
B: 6월 19일이에요.`,
    example_zh: `A: 欢迎光临。
B: 你好。这块手表多少钱？
A: 三万韩元。
B: 有点贵。那个包多少钱？
A: 两万韩元。
B: 好的。请给我这个包。
A: 是礼物吗？
B: 是的，是朋友的生日礼物。
A: 朋友的生日是什么时候？
B: 6月19日。`
  },
  {
    id: '11111111-1111-4111-8111-111111111105',
    korean: '상황 5: 친구에게 생일 전화하기',
    romanization: 'chinguege saengil jeonhwahagi',
    chinese: '情境 5：给朋友打生日电话',
    example_kr: `A: 여보세요?
B: 여보세요? 린단 씨예요?
A: 네, 맞아요. 누구예요?
B: 저 도리예요.
A: 아, 도리 씨! 안녕하세요.
B: 오늘 생일이에요?
A: 네, 맞아요.
B: 생일 축하해요!
A: 고마워요.
B: 오늘 시간 있어요?
A: 네, 있어요.
B: 같이 케이크 먹어요.
A: 좋아요!`,
    example_zh: `A: 喂？
B: 喂？是琳丹吗？
A: 是的，没错。你是谁？
B: 我是多利。
A: 啊，多利！你好。
B: 今天是你的生日吗？
A: 是的，没错。
B: 生日快乐！
A: 谢谢。
B: 今天有时间吗？
A: 有的。
B: 一起吃蛋糕吧。
A: 好啊！`
  },
  {
    id: '11111111-1111-4111-8111-111111111106',
    korean: '상황 6: 요일 대화',
    romanization: 'yoil daehwa',
    chinese: '情境 6：星期对话',
    example_kr: `A: 월요일에 뭐 해요?
B: 학교에 가요.
A: 화요일에도 학교에 가요?
B: 네, 화요일에도 학교에 가요.
A: 수요일에는 뭐 해요?
B: 친구를 만나요.
A: 목요일에는요?
B: 한국어를 공부해요.
A: 금요일에는 뭐 해요?
B: 영화를 봐요.
A: 토요일에는 쉬어요?
B: 네, 토요일에는 쉬어요.`,
    example_zh: `A: 星期一做什么？
B: 去学校。
A: 星期二也去学校吗？
B: 是的，星期二也去学校。
A: 星期三做什么？
B: 见朋友。
A: 星期四呢？
B: 学习韩语。
A: 星期五做什么？
B: 看电影。
A: 星期六休息吗？
B: 是的，星期六休息。`
  },
  {
    id: '11111111-1111-4111-8111-111111111107',
    korean: '상황 7: 하루 시간 표현',
    romanization: 'haru sigan pyohyeon',
    chinese: '情境 7：一天中的时间表达',
    example_kr: `A: 오늘 뭐 해요?
B: 새벽에 운동해요.
A: 새벽에요? 정말 부지런해요.
B: 아침에는 밥을 먹어요.
A: 오전에는 뭐 해요?
B: 학교에 가요.
A: 점심에는 뭐 먹어요?
B: 김밥을 먹어요.
A: 오후에는 뭐 해요?
B: 친구하고 카페에 가요.
A: 저녁에는요?
B: 집에서 쉬어요.
A: 밤에는 뭐 해요?
B: 한국어를 공부해요.`,
    example_zh: `A: 今天做什么？
B: 清晨运动。
A: 清晨吗？真勤快。
B: 早上吃饭。
A: 上午做什么？
B: 去学校。
A: 中午吃什么？
B: 吃紫菜包饭。
A: 下午做什么？
B: 和朋友去咖啡馆。
A: 晚上呢？
B: 在家休息。
A: 夜里做什么？
B: 学习韩语。`
  },
  {
    id: '11111111-1111-4111-8111-111111111108',
    korean: '상황 8: 평일과 주말',
    romanization: 'pyeongilgwa jumal',
    chinese: '情境 8：平日和周末',
    example_kr: `A: 평일에 바빠요?
B: 네, 평일에 바빠요.
A: 왜요?
B: 학교에 가고 공부해요.
A: 주말에는 뭐 해요?
B: 주말에는 쉬어요.
A: 토요일에는 뭐 해요?
B: 친구를 만나요.
A: 일요일에는요?
B: 집에서 쉬어요.
A: 좋아요. 주말이 좋아요?
B: 네, 주말이 정말 좋아요.`,
    example_zh: `A: 平日忙吗？
B: 是的，平日很忙。
A: 为什么？
B: 去学校，也学习。
A: 周末做什么？
B: 周末休息。
A: 星期六做什么？
B: 见朋友。
A: 星期日呢？
B: 在家休息。
A: 好。喜欢周末吗？
B: 是的，真的很喜欢周末。`
  },
  {
    id: '11111111-1111-4111-8111-111111111109',
    korean: '상황 9: 그제부터 모레까지',
    romanization: 'geujebuteo morekkaji',
    chinese: '情境 9：从前天到后天',
    example_kr: `A: 그제 뭐 했어요?
B: 그제 친구를 만났어요.
A: 어제는 뭐 했어요?
B: 어제 영화를 봤어요.
A: 오늘은 뭐 해요?
B: 오늘 한국어를 공부해요.
A: 내일은 뭐 해요?
B: 내일 학교에 가요.
A: 모레는요?
B: 모레 집에서 쉬어요.
A: 좋아요. 아주 바빠요.
B: 네, 조금 바빠요.`,
    example_zh: `A: 前天做了什么？
B: 前天见了朋友。
A: 昨天做了什么？
B: 昨天看了电影。
A: 今天做什么？
B: 今天学习韩语。
A: 明天做什么？
B: 明天去学校。
A: 后天呢？
B: 后天在家休息。
A: 好。很忙啊。
B: 是的，有点忙。`
  },
  {
    id: '11111111-1111-4111-8111-111111111110',
    korean: '상황 10: 쉬운 수업용 요일 대화',
    romanization: 'swiun sueobyong yoil daehwa',
    chinese: '情境 10：简单课堂星期对话',
    example_kr: `A: 오늘 무슨 요일이에요?
B: 오늘은 월요일이에요.
A: 월요일에 뭐 해요?
B: 학교에 가요.
A: 내일은 무슨 요일이에요?
B: 내일은 화요일이에요.
A: 화요일에도 학교에 가요?
B: 네, 학교에 가요.
A: 주말에는 뭐 해요?
B: 집에서 쉬어요.`,
    example_zh: `A: 今天星期几？
B: 今天是星期一。
A: 星期一做什么？
B: 去学校。
A: 明天星期几？
B: 明天是星期二。
A: 星期二也去学校吗？
B: 是的，去学校。
A: 周末做什么？
B: 在家休息。`
  },
  {
    id: '11111111-1111-4111-8111-111111111111',
    korean: '상황 11: 시간 표현 자연스러운 대화',
    romanization: 'sigan pyohyeon jayeonseureoun daehwa',
    chinese: '情境 11：自然使用时间表达的对话',
    example_kr: `A: 어제 뭐 했어요?
B: 어제 오전에 학교에 갔어요.
A: 오후에는 뭐 했어요?
B: 오후에는 친구를 만났어요.
A: 저녁에는요?
B: 저녁에는 식당에 갔어요.
A: 오늘은 뭐 해요?
B: 오늘 아침에 밥을 먹고, 오전에 공부해요.
A: 점심에는 뭐 먹어요?
B: 비빔밥을 먹어요.
A: 내일은 뭐 해요?
B: 내일은 평일이라서 학교에 가요.
A: 주말에는요?
B: 주말에는 쉬어요.`,
    example_zh: `A: 昨天做了什么？
B: 昨天上午去了学校。
A: 下午做了什么？
B: 下午见了朋友。
A: 晚上呢？
B: 晚上去了餐厅。
A: 今天做什么？
B: 今天早上吃饭，上午学习。
A: 中午吃什么？
B: 吃拌饭。
A: 明天做什么？
B: 明天是平日，所以去学校。
A: 周末呢？
B: 周末休息。`
  }
].map((item, index) => ({
  ...item,
  level: '초급',
  category: 'daily',
  book: 'book1',
  content_type: 'dialogue',
  sort_order: index + 1,
  is_local: true
}));

// ── INIT ───────────────────────────────────────────────
async function init() {
  applyDarkMode();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) { window.location.href = 'login.html'; return; }
  currentUser = user;

  const { data: profile } = await sb.from('profiles').select('*').eq('id', user.id).single();
  document.getElementById('userName').textContent = profile?.display_name || user.email.split('@')[0];
  if (profile?.role === 'admin') {
    isAdmin = true;
    document.getElementById('adminLink').style.display = '';
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

  document.getElementById('loadingState').style.display = 'none';
  document.getElementById('mainContent').style.display  = '';
  updateTabCounts();
  renderCards();
  bindEvents();
  updateProgress();
}

function showLoadError(msg) {
  document.getElementById('loadingState').innerHTML =
    `<div style="font-size:3rem">⚠️</div><p style="color:var(--accent)">데이터 로드 실패<br><small>${msg}</small></p>`;
}

function applyDarkMode() {
  document.body.classList.toggle('dark', darkMode);
  document.getElementById('darkToggle').textContent = darkMode ? '☀️' : '🌙';
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
  return TABS.flatMap(tab => vocabulary[tab] || []).find(w => w.id === wordId);
}

function updateTabCounts() {
  TABS.forEach(tab => {
    const words = vocabulary[tab] || [];
    const el = document.getElementById('cnt-' + tab);
    if (el) el.textContent = words.length;
    updateTabProgress(tab);
  });
}

function updateTabProgress(tab) {
  const words = vocabulary[tab] || [];
  const pct = words.length ? (words.filter(w => learnedWords.has(w.id)).length / words.length * 100) : 0;
  const el = document.getElementById('prg-' + tab);
  if (el) el.style.width = pct + '%';
}

function updateProgress() {
  document.getElementById('learnedCount').textContent  = learnedWords.size;
  document.getElementById('bookmarkCount').textContent = bookmarks.size;
  TABS.forEach(updateTabProgress);
}

// ── RENDER ─────────────────────────────────────────────
function getFilteredWords() {
  let words = [...(vocabulary[currentTab] || [])].filter(w => (w.content_type || 'vocab') === currentContentType);
  if (showBookmarksOnly) words = words.filter(w => bookmarks.has(w.id));
  if (currentLevel !== '전체') words = words.filter(w => w.level === currentLevel);
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    words = words.filter(w => w.korean.toLowerCase().includes(q) || w.chinese.includes(q) || w.romanization.toLowerCase().includes(q));
  }
  if (sortAlpha) words.sort((a, b) => a.korean.localeCompare(b.korean, 'ko'));
  return words;
}

function renderResultBar(total, filtered) {
  const bar = document.getElementById('resultBar');
  if (!bar) return;

  // 카운트 텍스트
  const isFiltered = filtered < total;
  const countHtml = isFiltered
    ? `<span class="result-count">전체 <strong>${total}</strong>개 중 <strong>${filtered}</strong>개</span>`
    : `<span class="result-count">단어 <strong>${total}</strong>개</span>`;

  // 활성 필터 칩 생성
  const chips = [];
  if (searchQuery) {
    chips.push(`<span class="filter-chip" onclick="document.getElementById('searchInput').value='';searchQuery='';renderCards()">🔍 "${searchQuery}" <span class="chip-x">✕</span></span>`);
  }
  if (currentLevel !== '전체') {
    chips.push(`<span class="filter-chip" onclick="currentLevel='전체';document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));document.querySelector('.filter-btn').classList.add('active');renderCards()">${currentLevel} <span class="chip-x">✕</span></span>`);
  }
  if (showBookmarksOnly) {
    chips.push(`<span class="filter-chip chip-bookmark" onclick="document.getElementById('bookmarkFilter').click()">⭐ 즐겨찾기 <span class="chip-x">✕</span></span>`);
  }
  if (sortAlpha) {
    chips.push(`<span class="filter-chip chip-sort" onclick="document.getElementById('sortBtn').click()">가나다순 ↕ <span class="chip-x">✕</span></span>`);
  }

  bar.innerHTML = countHtml + (chips.length ? `<div class="active-filters">${chips.join('')}</div>` : '');
}

function renderCards() {
  // BUG FIX: reset all flipped cards before re-render
  document.querySelectorAll('.card-wrap.flipped').forEach(c => c.classList.remove('flipped'));
  const grid  = document.getElementById('cardGrid');
  const words = getFilteredWords();
  const total = (vocabulary[currentTab] || []).filter(w => (w.content_type || 'vocab') === currentContentType).length;
  renderResultBar(total, words.length);
  if (!words.length) {
    let icon, title, sub, action = '';
    const allInTab = total;

    if (allInTab === 0) {
      icon  = currentContentType === 'vocab' ? '📝' : '📂';
      title = `${BOOK_LABEL[currentTab]} ${CONTENT_LABEL[currentContentType]} 자료가 없어요`;
      sub   = currentContentType === 'vocab'
        ? '이 권의 단어 자료가 아직 연결되지 않았어요.<br>관리자 패널에서 추가해보세요!'
        : '감자도리 원본 HTML에서 이 영역의 자료를 다음 단계에 분할 반영할 예정이에요.';
    } else if (showBookmarksOnly) {
      // 북마크 없음
      icon  = '⭐';
      title = '북마크한 단어가 없어요';
      sub   = '카드의 ⭐ 버튼을 눌러 중요한 단어를 저장해보세요!';
      action = `<button class="empty-action" onclick="document.getElementById('bookmarkFilter').click()">북마크 필터 끄기</button>`;
    } else if (searchQuery) {
      // 검색 결과 없음
      icon  = '🔍';
      title = `"${searchQuery}" 검색 결과가 없어요`;
      sub   = '다른 검색어를 입력하거나 필터를 조정해보세요.<br>한국어·중국어·로마자 모두 검색 가능해요!';
      action = `<button class="empty-action" onclick="document.getElementById('searchInput').value='';searchQuery='';renderCards()">검색 초기화</button>`;
    } else {
      // 레벨 필터 결과 없음
      icon  = '📚';
      title = `${currentLevel} 단어가 없어요`;
      sub   = '다른 레벨을 선택하거나 전체 보기를 눌러보세요.';
      action = `<button class="empty-action" onclick="currentLevel='전체';document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));document.querySelector('.filter-btn').classList.add('active');renderCards()">전체 보기</button>`;
    }

    grid.innerHTML = `<div class="empty-state">
      <div class="empty-icon">${icon}</div>
      <div class="empty-title">${title}</div>
      <div class="empty-sub">${sub}</div>
      ${action}
    </div>`;
    return;
  }
  grid.innerHTML = words.map(w => buildCard(w)).join('');
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
  const btns = document.querySelectorAll(`[data-id="${wordId}"] .check-btn, [data-id="${wordId}"] .back-check-btn`);
  btns.forEach(b => b.disabled = true);
  const was = learnedWords.has(wordId);
  was ? learnedWords.delete(wordId) : learnedWords.add(wordId);
  updateProgress();
  const now = learnedWords.has(wordId);
  btns.forEach(b => { b.textContent = now ? '✅' : '⬜'; b.classList.toggle('checked', now); });
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
  renderCards();
}

function switchContentType(type) {
  currentContentType = type;
  document.querySelectorAll('.content-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.type === type));
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
      document.querySelectorAll('.filter-btn:not(.bookmark-filter)').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentLevel = btn.dataset.level;
      renderCards();
    })
  );
  // Bookmark filter
  document.getElementById('bookmarkFilter').addEventListener('click', function() {
    showBookmarksOnly = !showBookmarksOnly;
    this.classList.toggle('active', showBookmarksOnly);
    renderCards();
  });
  // Sort
  document.getElementById('sortBtn').addEventListener('click', () => {
    sortAlpha = !sortAlpha;
    document.getElementById('sortBtn').classList.toggle('active', sortAlpha);
    renderCards();
  });
  // Search
  document.getElementById('searchInput').addEventListener('input', e => {
    searchQuery = e.target.value.trim(); renderCards();
  });
  // Quiz
  document.getElementById('quizBtn').addEventListener('click', () => { quizScore=0; quizTotal=0; startQuiz(); });
  document.getElementById('quizNextBtn').addEventListener('click', startQuiz);
  // Flashcard
  document.getElementById('adminLink').addEventListener('click', () => {
    window.location.href = 'admin.html';
  });
  document.getElementById('heroFlashBtn').addEventListener('click', () => document.getElementById('flashBtn').click());
  document.getElementById('heroQuizBtn').addEventListener('click', () => document.getElementById('quizBtn').click());
  document.getElementById('heroNumBtn').addEventListener('click', () => document.getElementById('numOpenBtn').click());
  document.getElementById('flashBtn').addEventListener('click', openFlashcard);
  document.getElementById('flashCloseBtn').addEventListener('click', () => document.getElementById('flashOverlay').classList.remove('open'));
  document.getElementById('flashCard').addEventListener('click', toggleFlashCard);
  document.getElementById('flashPrev').addEventListener('click', () => moveFlash(-1));
  document.getElementById('flashSpeak').addEventListener('click', speakFlash);
  document.getElementById('flashNext').addEventListener('click', () => moveFlash(1));
  // Keyboard shortcuts for flashcard
  document.addEventListener('keydown', e => {
    if (!document.getElementById('flashOverlay').classList.contains('open')) return;
    if (e.key === ' ' || e.key === 'ArrowUp') { e.preventDefault(); toggleFlashCard(); }
    if (e.key === 'ArrowRight') moveFlash(1);
    if (e.key === 'ArrowLeft')  moveFlash(-1);
    if (e.key === 'Escape') document.getElementById('flashOverlay').classList.remove('open');
  });
  // Dark mode
  document.getElementById('darkToggle').addEventListener('click', () => {
    darkMode = !darkMode; localStorage.setItem('dark_mode', darkMode); applyDarkMode();
  });
  // Logout
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await sb.auth.signOut(); window.location.href = 'login.html';
  });
  // Tips
  document.getElementById('tipsToggle').addEventListener('click', () => {
    document.getElementById('tipsBody').classList.toggle('open');
    document.getElementById('tipsToggle').classList.toggle('open');
  });
  // Quiz close re-enables button
  document.getElementById('quizCloseBtn').addEventListener('click', () => {
    document.getElementById('quizOverlay').classList.remove('open');
    document.getElementById('quizBtn').disabled = false;
  });
  document.getElementById('quizOverlay').addEventListener('click', e => {
    if (e.target===e.currentTarget) {
      e.currentTarget.classList.remove('open');
      document.getElementById('quizBtn').disabled = false;
    }
  });
  // Quiz keyboard: 1-4 select answer, Enter=next, Escape=close
  document.addEventListener('keydown', e => {
    const quizOpen = document.getElementById('quizOverlay').classList.contains('open');
    if (quizOpen) {
      if (!quizAnswered) {
        const opts = document.querySelectorAll('.quiz-opt');
        if (e.key==='1' && opts[0]) opts[0].click();
        else if (e.key==='2' && opts[1]) opts[1].click();
        else if (e.key==='3' && opts[2]) opts[2].click();
        else if (e.key==='4' && opts[3]) opts[3].click();
      }
      if (e.key==='Enter') document.getElementById('quizNextBtn').click();
      if (e.key==='Escape') { document.getElementById('quizCloseBtn').click(); }
    }
  });
  // 숫자 연습 modal open
  document.getElementById('numOpenBtn').addEventListener('click', openNumModal);
  document.getElementById('numClose').addEventListener('click', () => document.getElementById('numOverlay').classList.remove('open'));
  document.getElementById('numOverlay').addEventListener('click', e => { if (e.target===e.currentTarget) e.currentTarget.classList.remove('open'); });
  // num sub-tabs
  document.querySelectorAll('.num-stab').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.num-stab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const t = btn.dataset.stab;
    document.getElementById('numPanelTable').style.display = t==='table' ? '' : 'none';
    document.getElementById('numPanelQuiz').style.display  = t==='quiz'  ? '' : 'none';
    document.getElementById('numPanelListen').style.display= t==='listen'? '' : 'none';
    if (t==='quiz') startNumQuiz();
    if (t==='listen') startNumListen();
  }));
  document.getElementById('numQuizRestart').addEventListener('click', startNumQuiz);
  document.getElementById('numQNext').addEventListener('click', () => { numQAnswered=false; startNumQuestion(); });
  document.getElementById('numLPlay').addEventListener('click', playNumListen);
  document.getElementById('numLNext').addEventListener('click', () => { numLAnswered=false; startNumListen(); });
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
