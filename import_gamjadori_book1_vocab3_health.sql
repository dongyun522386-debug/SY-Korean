-- 감자도리 1권 > 단어 > 건강 / 몸 상태
-- 원본: REVIEW_DATA.vocab_3
-- 이미 같은 book/content_type/korean 값이 있으면 건너뜁니다.

WITH src(korean, romanization, chinese, category, src_order) AS (
  VALUES
    ('머리', 'meo-ri', '头', 'nouns', 1),
    ('목', 'mok', '脖子 / 喉咙', 'nouns', 2),
    ('배', 'bae', '肚子', 'nouns', 3),
    ('눈', 'nun', '眼睛', 'nouns', 4),
    ('다리', 'da-ri', '腿', 'nouns', 5),
    ('이', 'i', '牙齿', 'nouns', 6),
    ('아프다', 'a-peu-da', '疼 / 生病', 'adjectives', 7),
    ('아프셨어요', 'a-peu-syeo-sseo-yo', '疼了 / 不舒服了（敬语过去）', 'adjectives', 8),
    ('몸이 안 좋아요', 'mo-mi an jo-a-yo', '身体不舒服', 'daily', 9),
    ('몸이 안 좋았어요', 'mo-mi an jo-a-sseo-yo', '身体之前不舒服', 'daily', 10),
    ('안 좋다', 'an jo-ta', '不好 / 不舒服', 'adjectives', 11),
    ('감기', 'gam-gi', '感冒', 'nouns', 12),
    ('감기가 심하다', 'gam-gi-ga sim-ha-da', '感冒很严重', 'daily', 13),
    ('낫다', 'nat-da', '痊愈 / 好起来', 'verbs', 14),
    ('나았어요', 'na-a-sseo-yo', '好了 / 康复了', 'verbs', 15),
    ('썩다', 'sseok-da', '腐烂 / 蛀掉', 'verbs', 16),
    ('이가 썩다', 'i-ga sseok-da', '蛀牙', 'daily', 17),
    ('배가 불러요', 'bae-ga bul-leo-yo', '肚子饱了', 'daily', 18),
    ('배고파요', 'bae-go-pa-yo', '肚子饿', 'adjectives', 19),
    ('편찮으세요', 'pyeon-cha-neu-se-yo', '身体不适（敬语）', 'adjectives', 20),
    ('시장하세요', 'si-jang-ha-se-yo', '饿了（敬语）', 'adjectives', 21),
    ('살이 찌다', 'sa-ri jji-da', '长胖', 'daily', 22),
    ('살이 빠지다', 'sa-ri ppa-ji-da', '变瘦', 'daily', 23),
    ('살이 쪘어요', 'sa-ri jjyeo-sseo-yo', '长胖了', 'daily', 24),
    ('살이 빠졌어요', 'sa-ri ppa-jyeo-sseo-yo', '瘦了', 'daily', 25),
    ('약', 'yak', '药', 'nouns', 26),
    ('의사', 'ui-sa', '医生', 'nouns', 27),
    ('치과', 'chi-gwa', '牙科', 'nouns', 28),
    ('치료', 'chi-ryo', '治疗', 'nouns', 29),
    ('입원하다', 'i-bwon-ha-da', '住院', 'verbs', 30),
    ('퇴원하다', 'toe-won-ha-da', '出院', 'verbs', 31),
    ('주사', 'ju-sa', '注射', 'nouns', 32),
    ('약을 먹다', 'ya-geul meok-da', '吃药', 'daily', 33),
    ('약을 드시다', 'ya-geul deu-si-da', '吃药（敬语）', 'daily', 34),
    ('물을 많이 마시다', 'mu-reul ma-ni ma-si-da', '多喝水', 'daily', 35),
    ('이를 닦다', 'i-reul dak-da', '刷牙', 'daily', 36),
    ('쉬다', 'swi-da', '休息', 'verbs', 37),
    ('푹 쉬다', 'puk swi-da', '好好休息', 'daily', 38),
    ('조심하다', 'jo-sim-ha-da', '注意 / 小心', 'verbs', 39),
    ('운동하다', 'un-dong-ha-da', '运动', 'verbs', 40),
    ('수영하다', 'su-yeong-ha-da', '游泳', 'verbs', 41),
    ('요가를 배우다', 'yo-ga-reul bae-u-da', '学瑜伽', 'daily', 42),
    ('다이어트하다', 'da-i-eo-teu-ha-da', '减肥', 'verbs', 43),
    ('규칙적으로 식사하다', 'gyu-chik-jeo-geu-ro sik-sa-ha-da', '规律吃饭', 'daily', 44),
    ('야식을 먹다', 'ya-si-geul meok-da', '吃夜宵', 'daily', 45),
    ('피곤하다', 'pi-gon-ha-da', '累', 'adjectives', 46),
    ('피곤해요', 'pi-gon-hae-yo', '很累', 'adjectives', 47),
    ('바쁘다', 'ba-ppeu-da', '忙', 'adjectives', 48),
    ('바빠요', 'ba-ppa-yo', '忙', 'adjectives', 49),
    ('스트레스', 'seu-teu-re-seu', '压力', 'nouns', 50),
    ('스트레스를 받다', 'seu-teu-re-seu-reul bat-da', '受压力 / 有压力', 'daily', 51),
    ('스트레스를 풀다', 'seu-teu-re-seu-reul pul-da', '缓解压力', 'daily', 52),
    ('걱정', 'geok-jeong', '担心', 'nouns', 53),
    ('건강하다', 'geon-gang-ha-da', '健康', 'adjectives', 54),
    ('건강에 안 좋다', 'geon-gang-e an jo-ta', '对健康不好', 'daily', 55),
    ('괜찮아요', 'gwaen-cha-na-yo', '没关系 / 还好', 'adjectives', 56),
    ('심심해요', 'sim-sim-hae-yo', '无聊', 'adjectives', 57),
    ('행복해요', 'haeng-bok-hae-yo', '幸福', 'adjectives', 58),
    ('편하다', 'pyeon-ha-da', '舒服 / 方便', 'adjectives', 59),
    ('불편하다', 'bul-pyeon-ha-da', '不方便 / 不舒服', 'adjectives', 60),
    ('안전하다', 'an-jeon-ha-da', '安全', 'adjectives', 61),
    ('위험하다', 'wi-heom-ha-da', '危险', 'adjectives', 62),
    ('간단하다', 'gan-dan-ha-da', '简单', 'adjectives', 63),
    ('필요하다', 'pi-ryo-ha-da', '需要', 'adjectives', 64)
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
