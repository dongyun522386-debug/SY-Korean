-- 감자도리 1권 > 단어 > 인사 및 기본 응답
-- 원본: REVIEW_DATA.vocab_1
-- 이미 같은 book/content_type/korean 값이 있으면 건너뜁니다.

WITH src(korean, chinese, src_order) AS (
  VALUES
    ('안녕하세요', '你好', 1),
    ('안녕히 가세요', '请慢走 / 再见（对离开的人说）', 2),
    ('안녕히 계세요', '请留步 / 再见（对留下的人说）', 3),
    ('반가워요', '很高兴见到你', 4),
    ('오랜만이에요', '好久不见', 5),
    ('여보세요', '喂', 6),
    ('실례합니다', '不好意思 / 打扰一下', 7),
    ('저기요', '那个…… / 请问 / 喂', 8),
    ('어서 오세요', '欢迎光临', 9),
    ('들어오세요', '请进', 10),
    ('네', '是 / 好 / 嗯', 11),
    ('아니요', '不 / 不是', 12),
    ('맞아요', '对 / 没错', 13),
    ('아니에요', '不是', 14),
    ('그래요', '是这样啊 / 好的', 15),
    ('정말이에요?', '真的吗？', 16),
    ('그럼요', '当然了', 17),
    ('알겠어요', '知道了 / 明白了', 18),
    ('좋아요', '好 / 可以 / 不错', 19),
    ('괜찮아요', '没关系 / 还可以 / 不错', 20),
    ('감사합니다', '谢谢', 21),
    ('고마워요', '谢谢', 22),
    ('고맙습니다', '谢谢', 23),
    ('미안해요', '对不起', 24),
    ('죄송합니다', '非常抱歉 / 对不起', 25),
    ('천만에요', '不客气', 26),
    ('잠깐만 기다리세요', '请稍等一下', 27),
    ('같이 가요', '一起去吧', 28),
    ('다음에 만나요', '下次见', 29),
    ('왜요?', '为什么？ / 怎么了？', 30)
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
)
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
  '',
  chinese,
  '',
  '',
  '초급',
  'daily',
  'book1',
  'vocab',
  next_order.max_sort_order + ROW_NUMBER() OVER (ORDER BY src_order)
FROM deduped, next_order
RETURNING korean;
