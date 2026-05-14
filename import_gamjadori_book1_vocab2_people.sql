-- 감자도리 1권 > 단어 > 사람 정보 / 관계 / 호칭
-- 원본: REVIEW_DATA.vocab_2
-- 이미 같은 book/content_type/korean 값이 있으면 건너뜁니다.

WITH src(korean, romanization, chinese, category, src_order) AS (
  VALUES
    ('이름', 'i-reum', '名字', 'nouns', 1),
    ('성함', 'seong-ham', '姓名（敬语）', 'nouns', 2),
    ('사람', 'sa-ram', '人', 'nouns', 3),
    ('한국 사람', 'han-guk sa-ram', '韩国人', 'nouns', 4),
    ('중국 사람', 'jung-guk sa-ram', '中国人', 'nouns', 5),
    ('일본 사람', 'il-bon sa-ram', '日本人', 'nouns', 6),
    ('외국 사람', 'oe-guk sa-ram', '外国人', 'nouns', 7),
    ('이분', 'i-bun', '这位', 'nouns', 8),
    ('손님', 'son-nim', '客人', 'nouns', 9),
    ('학생', 'hak-saeng', '学生', 'nouns', 10),
    ('대학생', 'dae-hak-saeng', '大学生', 'nouns', 11),
    ('유학생', 'yu-hak-saeng', '留学生', 'nouns', 12),
    ('회사원', 'hoe-sa-won', '公司职员', 'nouns', 13),
    ('선생님', 'seon-saeng-nim', '老师', 'nouns', 14),
    ('한국어 선생님', 'han-gu-geo seon-saeng-nim', '韩语老师', 'nouns', 15),
    ('의사', 'ui-sa', '医生', 'nouns', 16),
    ('경찰', 'gyeong-chal', '警察', 'nouns', 17),
    ('변호사', 'byeon-ho-sa', '律师', 'nouns', 18),
    ('직원', 'ji-gwon', '职员', 'nouns', 19),
    ('종업원', 'jong-eop-won', '店员 / 服务员', 'nouns', 20),
    ('사장님', 'sa-jang-nim', '老板 / 社长', 'nouns', 21),
    ('가족', 'ga-jok', '家人 / 家庭', 'nouns', 22),
    ('친구', 'chin-gu', '朋友', 'nouns', 23),
    ('남자친구', 'nam-ja-chin-gu', '男朋友', 'nouns', 24),
    ('여자친구', 'yeo-ja-chin-gu', '女朋友', 'nouns', 25),
    ('동생', 'dong-saeng', '弟弟 / 妹妹', 'nouns', 26),
    ('남동생', 'nam-dong-saeng', '弟弟', 'nouns', 27),
    ('언니', 'eon-ni', '姐姐（女生称）', 'nouns', 28),
    ('누나', 'nu-na', '姐姐（男生称）', 'nouns', 29),
    ('오빠', 'o-ppa', '哥哥（女生称）', 'nouns', 30),
    ('아버지', 'a-beo-ji', '父亲', 'nouns', 31),
    ('어머니', 'eo-meo-ni', '母亲', 'nouns', 32),
    ('할아버지', 'hal-a-beo-ji', '爷爷 / 祖父', 'nouns', 33),
    ('할머니', 'hal-meo-ni', '奶奶 / 祖母', 'nouns', 34),
    ('아기', 'a-gi', '婴儿 / 宝宝', 'nouns', 35),
    ('분', 'bun', '位（敬语量词）', 'daily', 36),
    ('명', 'myeong', '名（人数单位）', 'daily', 37),
    ('사람들', 'sa-ram-deul', '人们', 'nouns', 38),
    ('학생들', 'hak-saeng-deul', '学生们', 'nouns', 39),
    ('친구들', 'chin-gu-deul', '朋友们', 'nouns', 40),
    ('우리 반 학생', 'u-ri ban hak-saeng', '我们班学生', 'nouns', 41),
    ('동료', 'dong-nyo', '同事', 'nouns', 42),
    ('씨', 'ssi', '先生 / 女士 / …氏', 'daily', 43),
    ('께', 'kke', '给 / 向（敬语助词）', 'daily', 44),
    ('댁', 'daek', '府上 / 您家', 'nouns', 45),
    ('말씀', 'mal-sseum', '话（''말''的敬语）', 'nouns', 46),
    ('연세', 'yeon-se', '年纪 / 年龄（敬语）', 'nouns', 47),
    ('생신', 'saeng-sin', '生日（敬语）', 'nouns', 48),
    ('계시다', 'gye-si-da', '在 / 在场（''있다''의 敬语）', 'verbs', 49),
    ('드시다', 'deu-si-da', '吃 / 喝（敬语）', 'verbs', 50),
    ('주무시다', 'ju-mu-si-da', '睡觉（敬语）', 'verbs', 51),
    ('말씀하시다', 'mal-sseum-ha-si-da', '说话（''말하다''의 敬语）', 'verbs', 52),
    ('여쭤보다', 'yeo-jjwo-bo-da', '请教 / 询问（敬语）', 'verbs', 53),
    ('드리다', 'deu-ri-da', '给 / 献上（''주다''의 谦语）', 'verbs', 54)
),
next_order AS (
  SELECT COALESCE(MAX(sort_order), 0) AS max_sort_order
  FROM words
  WHERE book = 'book1' AND content_type = 'vocab'
),
deduped AS (
  SELECT src.*
  FROM src
  WHERE NOT EXISTS (
    SELECT 1
    FROM words
    WHERE words.book = 'book1'
      AND words.content_type = 'vocab'
      AND words.korean = src.korean
  )
),
inserted AS (
  INSERT INTO words (
    korean,
    romanization,
    chinese,
    example_kr,
    example_zh,
    level,
    category,
    book,
    content_type,
    sort_order
  )
  SELECT
    korean,
    romanization,
    chinese,
    '',
    '',
    '초급',
    category,
    'book1',
    'vocab',
    next_order.max_sort_order + ROW_NUMBER() OVER (ORDER BY src_order)
  FROM deduped, next_order
  RETURNING korean
)
SELECT COUNT(*)::int AS inserted_count FROM inserted;
