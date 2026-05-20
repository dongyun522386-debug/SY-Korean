-- ══════════════════════════════════════════════════════════════
--  한국어 단어장 · Supabase 초기 설정 SQL
--  Supabase Dashboard → SQL Editor 에서 전체 실행하세요
--  실행 전: 아래 'YOUR_ADMIN_EMAIL@example.com' 을 교체하세요
-- ══════════════════════════════════════════════════════════════

-- ── 1. 테이블 생성 ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS profiles (
  id           UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email        TEXT,
  display_name TEXT,
  role         TEXT DEFAULT 'student' CHECK (role IN ('admin', 'student')),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS words (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  korean       TEXT NOT NULL,
  romanization TEXT NOT NULL,
  chinese      TEXT NOT NULL,
  example_kr   TEXT DEFAULT '',
  example_zh   TEXT DEFAULT '',
  level        TEXT CHECK (level IN ('초급', '중급', '고급')) DEFAULT '초급',
  category     TEXT CHECK (category IN ('nouns', 'verbs', 'adjectives', 'fixed', 'numbers', 'daily')) NOT NULL,
  book         TEXT NOT NULL DEFAULT 'book1' CHECK (book IN ('book1', 'book2', 'book3', 'book4', 'book5')),
  content_type TEXT NOT NULL DEFAULT 'vocab' CHECK (content_type IN ('vocab', 'pronunciation', 'dialogue', 'reading', 'listening')),
  sort_order   INT  DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE words
  ADD COLUMN IF NOT EXISTS book TEXT NOT NULL DEFAULT 'book1'
    CHECK (book IN ('book1', 'book2', 'book3', 'book4', 'book5'));

ALTER TABLE words
  ADD COLUMN IF NOT EXISTS content_type TEXT NOT NULL DEFAULT 'vocab'
    CHECK (content_type IN ('vocab', 'pronunciation', 'dialogue', 'reading', 'listening'));

CREATE TABLE IF NOT EXISTS user_progress (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  word_id    UUID REFERENCES words(id)       ON DELETE CASCADE NOT NULL,
  learned    BOOLEAN DEFAULT FALSE,
  learned_at TIMESTAMPTZ,
  bookmarked BOOLEAN DEFAULT FALSE,
  UNIQUE (user_id, word_id)
);

-- ── 2. RLS 활성화 ────────────────────────────────────────────

ALTER TABLE profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE words         ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- ── 3. RLS 정책 ──────────────────────────────────────────────

-- profiles: 본인 프로필만 읽기/수정 (role 변경은 아래 트리거로 차단)
CREATE POLICY "own profile select" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "own profile update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 일반 사용자가 본인 role을 student -> admin으로 바꾸는 것을 방지
CREATE OR REPLACE FUNCTION prevent_profile_role_self_update()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND auth.uid() = OLD.id THEN
    RAISE EXCEPTION 'profile role cannot be changed by the client';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_prevent_role_self_update ON profiles;
CREATE TRIGGER profiles_prevent_role_self_update
  BEFORE UPDATE OF role ON profiles
  FOR EACH ROW EXECUTE FUNCTION prevent_profile_role_self_update();

-- words: 로그인한 사용자 모두 읽기 / 관리자만 쓰기
CREATE POLICY "words read"   ON words FOR SELECT TO authenticated USING (true);
CREATE POLICY "words insert" ON words FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "words update" ON words FOR UPDATE TO authenticated
  USING      (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "words delete" ON words FOR DELETE TO authenticated
  USING      (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- user_progress: 본인 기록만
CREATE POLICY "progress all" ON user_progress FOR ALL USING (auth.uid() = user_id);

-- ── 4. 신규 가입 시 자동 프로필 생성 트리거 ────────────────

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    CASE WHEN NEW.email = 'dongyun522386@gmail.com' THEN 'admin' ELSE 'student' END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── 5. updated_at 자동 갱신 ────────────────────────────────

CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS words_updated_at ON words;
CREATE TRIGGER words_updated_at
  BEFORE UPDATE ON words
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ── 6. 초기 단어 데이터 (seed) ────────────────────────────

INSERT INTO words (korean, romanization, chinese, example_kr, example_zh, level, category, sort_order) VALUES
-- 명사 (Nouns)
('책',    'chaek',         '书',         '책을 읽어요.',              '我读书。',               '초급', 'nouns', 1),
('학교',  'hak-gyo',       '学校',       '학교에 가요.',              '我去学校。',             '초급', 'nouns', 2),
('친구',  'chin-gu',       '朋友',       '친구를 만나요.',            '我见朋友。',             '초급', 'nouns', 3),
('가족',  'ga-jok',        '家人/家族',  '가족과 여행해요.',          '和家人一起旅行。',        '초급', 'nouns', 4),
('집',    'jip',           '家/房子',    '집에 있어요.',              '我在家。',               '초급', 'nouns', 5),
('물',    'mul',           '水',         '물을 마셔요.',              '我喝水。',               '초급', 'nouns', 6),
('시간',  'si-gan',        '时间',       '시간이 없어요.',            '没有时间。',             '초급', 'nouns', 7),
('사람',  'sa-ram',        '人',         '사람이 많아요.',            '人很多。',               '초급', 'nouns', 8),
('나라',  'na-ra',         '国家',       '어느 나라 사람이에요?',     '你是哪个国家的人？',     '초급', 'nouns', 9),
('음식',  'eum-sik',       '食物',       '한국 음식을 좋아해요.',     '我喜欢韩国食物。',       '초급', 'nouns', 10),
('도시',  'do-si',         '城市',       '서울은 큰 도시예요.',       '首尔是大城市。',         '중급', 'nouns', 11),
('회사',  'hoe-sa',        '公司',       '회사에서 일해요.',          '我在公司工作。',         '중급', 'nouns', 12),
('휴대폰','hyu-dae-pon',   '手机',       '휴대폰을 잃어버렸어요.',    '我的手机丢了。',         '중급', 'nouns', 13),
('날씨',  'nal-ssi',       '天气',       '오늘 날씨가 좋아요.',       '今天天气很好。',         '중급', 'nouns', 14),
('꿈',    'kkum',          '梦/梦想',    '꿈을 꿨어요.',              '我做梦了。',             '중급', 'nouns', 15),
('경험',  'gyeong-heom',   '经验/经历',  '좋은 경험이었어요.',        '是很好的经历。',         '고급', 'nouns', 16),
('기회',  'gi-hoe',        '机会',       '기회를 놓쳤어요.',          '错过了机会。',           '고급', 'nouns', 17),
-- 동사 (Verbs)
('먹다',      'meok-da',         '吃',    '밥을 먹어요.',           '我吃饭。',            '초급', 'verbs', 1),
('마시다',    'ma-si-da',        '喝',    '커피를 마셔요.',         '我喝咖啡。',          '초급', 'verbs', 2),
('공부하다',  'gong-bu-ha-da',   '学习',  '한국어를 공부해요.',     '我学韩语。',          '초급', 'verbs', 3),
('자다',      'ja-da',           '睡觉',  '밤에 자요.',             '我晚上睡觉。',        '초급', 'verbs', 4),
('가다',      'ga-da',           '去',    '학교에 가요.',           '我去学校。',          '초급', 'verbs', 5),
('오다',      'o-da',            '来',    '친구가 왔어요.',         '朋友来了。',          '초급', 'verbs', 6),
('보다',      'bo-da',           '看/见', '영화를 봐요.',           '我看电影。',          '초급', 'verbs', 7),
('말하다',    'mal-ha-da',       '说/讲', '한국어로 말해요.',       '我用韩语说话。',      '초급', 'verbs', 8),
('듣다',      'deut-da',         '听',    '음악을 들어요.',         '我听音乐。',          '초급', 'verbs', 9),
('읽다',      'ik-da',           '读',    '책을 읽어요.',           '我读书。',            '초급', 'verbs', 10),
('쓰다',      'sseu-da',         '写/用', '편지를 써요.',           '我写信。',            '초급', 'verbs', 11),
('만나다',    'man-na-da',       '见面',  '친구를 만나요.',         '我见朋友。',          '초급', 'verbs', 12),
('사다',      'sa-da',           '买',    '옷을 샀어요.',           '我买了衣服。',        '초급', 'verbs', 13),
('일하다',    'il-ha-da',        '工作',  '매일 일해요.',           '我每天工作。',        '중급', 'verbs', 14),
('여행하다',  'yeo-haeng-ha-da', '旅行',  '한국을 여행했어요.',     '我去韩国旅行了。',    '중급', 'verbs', 15),
('사랑하다',  'sa-rang-ha-da',   '爱',    '가족을 사랑해요.',       '我爱家人。',          '중급', 'verbs', 16),
('노력하다',  'no-ryeok-ha-da',  '努力',  '열심히 노력해요.',       '我努力地加油。',      '고급', 'verbs', 17),
-- 형용사 (Adjectives)
('크다',      'keu-da',         '大',       '집이 커요.',               '房子很大。',         '초급', 'adjectives', 1),
('작다',      'jak-da',         '小',       '방이 작아요.',             '房间很小。',         '초급', 'adjectives', 2),
('예쁘다',    'ye-ppeu-da',     '漂亮',     '꽃이 예뻐요.',             '花很漂亮。',         '초급', 'adjectives', 3),
('좋다',      'jo-ta',          '好',       '날씨가 좋아요.',           '天气很好。',         '초급', 'adjectives', 4),
('맛있다',    'mas-it-da',      '好吃',     '밥이 맛있어요.',           '米饭很好吃。',       '초급', 'adjectives', 5),
('많다',      'man-ta',         '多',       '사람이 많아요.',           '人很多。',           '초급', 'adjectives', 6),
('적다',      'jeok-da',        '少',       '시간이 적어요.',           '时间很少。',         '초급', 'adjectives', 7),
('빠르다',    'ppa-reu-da',     '快',       '차가 빨라요.',             '车很快。',           '중급', 'adjectives', 8),
('느리다',    'neu-ri-da',      '慢',       '거북이가 느려요.',         '乌龟很慢。',         '중급', 'adjectives', 9),
('어렵다',    'eo-ryeop-da',    '难',       '한국어가 어려워요.',       '韩语很难。',         '중급', 'adjectives', 10),
('쉽다',      'swip-da',        '简单/容易','문제가 쉬워요.',           '问题很简单。',       '중급', 'adjectives', 11),
('재미있다',  'jae-mi-it-da',   '有趣',     '영화가 재미있어요.',       '电影很有趣。',       '중급', 'adjectives', 12),
('피곤하다',  'pi-gon-ha-da',   '疲惫/累',  '오늘 많이 피곤해요.',      '今天很累。',         '중급', 'adjectives', 13),
('바쁘다',    'ba-ppeu-da',     '忙',       '요즘 바빠요.',             '最近很忙。',         '중급', 'adjectives', 14),
('따뜻하다',  'tta-tteu-ta-da', '暖和/温暖','날씨가 따뜻해요.',         '天气很暖和。',       '중급', 'adjectives', 15),
('차갑다',    'cha-gap-da',     '冷/凉',    '물이 차가워요.',           '水很凉。',           '고급', 'adjectives', 16),
('그립다',    'geu-rip-da',     '想念/思念','가족이 그리워요.',         '我思念家人。',       '고급', 'adjectives', 17),
-- 고정표현 (Fixed Expressions)
('만나서 반갑습니다',          'man-na-seo ban-gap-seum-ni-da',          '很高兴认识你',           '처음 뵙겠습니다. 만나서 반갑습니다.', '初次见面。很高兴认识你。', '초급', 'fixed', 1),
('감사합니다',                 'gam-sa-ham-ni-da',                       '谢谢你',                 '도와주셔서 감사합니다.',              '谢谢你的帮助。',           '초급', 'fixed', 2),
('미안합니다',                 'mi-an-ham-ni-da',                        '对不起',                 '늦어서 미안합니다.',                  '对不起，我迟到了。',       '초급', 'fixed', 3),
('괜찮아요?',                  'gwaen-chan-a-yo',                        '你还好吗？/没关系',      '지금 괜찮아요?',                      '你现在还好吗？',           '초급', 'fixed', 4),
('얼마예요?',                  'eol-ma-ye-yo',                           '多少钱？',               '이거 얼마예요?',                      '这个多少钱？',             '초급', 'fixed', 5),
('잠깐만요',                   'jam-kkan-man-yo',                        '请稍等',                 '잠깐만요, 금방 올게요.',              '请稍等，我马上回来。',     '초급', 'fixed', 6),
('어디예요?',                  'eo-di-ye-yo',                            '在哪里？',               '화장실이 어디예요?',                  '洗手间在哪里？',           '초급', 'fixed', 7),
('도와주세요',                 'do-wa-ju-se-yo',                         '请帮帮我',               '길을 잃었어요. 도와주세요.',          '我迷路了，请帮帮我。',     '초급', 'fixed', 8),
('천천히 말씀해 주세요',       'cheon-cheon-hi mal-sseum-hae ju-se-yo',  '请说慢一点',             '잘 못 들었어요. 천천히 말씀해 주세요.','我没听清楚，请说慢一点。', '중급', 'fixed', 9),
('배고파요',                   'bae-go-pa-yo',                           '我饿了',                 '점심을 못 먹어서 배고파요.',          '我没吃午饭，很饿。',       '초급', 'fixed', 10),
('안녕히 가세요',              'an-nyeong-hi ga-se-yo',                  '再见（对离开的人说）',   '내일 봐요. 안녕히 가세요.',           '明天见。再见。',           '초급', 'fixed', 11),
('잘 부탁드립니다',            'jal bu-tak-deu-rim-ni-da',               '请多关照',               '앞으로 잘 부탁드립니다.',             '今后请多关照。',           '중급', 'fixed', 12),
('몰라요',                     'mol-la-yo',                              '不知道',                 '그건 저도 몰라요.',                   '那个我也不知道。',         '초급', 'fixed', 13),
('조심하세요',                 'jo-sim-ha-se-yo',                        '请小心/保重',            '날씨가 추우니까 조심하세요.',         '天气很冷，请保重。',       '중급', 'fixed', 14),
('어떻게 생각해요?',           'eo-tteo-ke saeng-gak-hae-yo',            '你怎么看？',             '이 문제에 대해 어떻게 생각해요?',    '你对这个问题怎么看？',     '고급', 'fixed', 15),
('잘 됐어요',                  'jal-dwae-sseo-yo',                       '太好了/顺利了',          '시험에 합격했어요? 잘 됐어요!',       '考试通过了？太好了！',     '중급', 'fixed', 16)
ON CONFLICT DO NOTHING;
