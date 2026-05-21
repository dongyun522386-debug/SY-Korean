-- 감자도리 1권 > 대화 > 요일 / 시간 표현
-- 이미 같은 book/content_type/korean 값이 있으면 건너뜁니다.

WITH src(id, korean, romanization, chinese, example_kr, example_zh, src_order) AS (
  VALUES
    (
      '11111111-1111-4111-8111-111111111106'::uuid,
      '상황 6: 요일 대화',
      'yoil daehwa',
      '情境 6：星期对话',
      $$A: 월요일에 뭐 해요?
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
B: 네, 토요일에는 쉬어요.$$,
      $$A: 星期一做什么？
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
B: 是的，星期六休息。$$,
      6
    ),
    (
      '11111111-1111-4111-8111-111111111107'::uuid,
      '상황 7: 하루 시간 표현',
      'haru sigan pyohyeon',
      '情境 7：一天中的时间表达',
      $$A: 오늘 뭐 해요?
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
B: 한국어를 공부해요.$$,
      $$A: 今天做什么？
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
B: 学习韩语。$$,
      7
    ),
    (
      '11111111-1111-4111-8111-111111111108'::uuid,
      '상황 8: 평일과 주말',
      'pyeongilgwa jumal',
      '情境 8：平日和周末',
      $$A: 평일에 바빠요?
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
B: 네, 주말이 정말 좋아요.$$,
      $$A: 平日忙吗？
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
B: 是的，真的很喜欢周末。$$,
      8
    ),
    (
      '11111111-1111-4111-8111-111111111109'::uuid,
      '상황 9: 그제부터 모레까지',
      'geujebuteo morekkaji',
      '情境 9：从前天到后天',
      $$A: 그제 뭐 했어요?
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
B: 네, 조금 바빠요.$$,
      $$A: 前天做了什么？
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
B: 是的，有点忙。$$,
      9
    ),
    (
      '11111111-1111-4111-8111-111111111110'::uuid,
      '상황 10: 쉬운 수업용 요일 대화',
      'swiun sueobyong yoil daehwa',
      '情境 10：简单课堂星期对话',
      $$A: 오늘 무슨 요일이에요?
B: 오늘은 월요일이에요.
A: 월요일에 뭐 해요?
B: 학교에 가요.
A: 내일은 무슨 요일이에요?
B: 내일은 화요일이에요.
A: 화요일에도 학교에 가요?
B: 네, 학교에 가요.
A: 주말에는 뭐 해요?
B: 집에서 쉬어요.$$,
      $$A: 今天星期几？
B: 今天是星期一。
A: 星期一做什么？
B: 去学校。
A: 明天星期几？
B: 明天是星期二。
A: 星期二也去学校吗？
B: 是的，去学校。
A: 周末做什么？
B: 在家休息。$$,
      10
    ),
    (
      '11111111-1111-4111-8111-111111111111'::uuid,
      '상황 11: 시간 표현 자연스러운 대화',
      'sigan pyohyeon jayeonseureoun daehwa',
      '情境 11：自然使用时间表达的对话',
      $$A: 어제 뭐 했어요?
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
B: 주말에는 쉬어요.$$,
      $$A: 昨天做了什么？
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
B: 周末休息。$$,
      11
    )
),
next_order AS (
  SELECT COALESCE(MAX(sort_order), 0) AS max_sort_order
  FROM words
  WHERE book = 'book1' AND content_type = 'dialogue'
),
deduped AS (
  SELECT src.*
  FROM src
  WHERE NOT EXISTS (
    SELECT 1
    FROM words
    WHERE words.book = 'book1'
      AND words.content_type = 'dialogue'
      AND words.korean = src.korean
  )
)
INSERT INTO words (
  id,
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
  id,
  korean,
  romanization,
  chinese,
  example_kr,
  example_zh,
  '초급',
  'daily',
  'book1',
  'dialogue',
  next_order.max_sort_order + ROW_NUMBER() OVER (ORDER BY src_order)
FROM deduped, next_order
RETURNING korean;
