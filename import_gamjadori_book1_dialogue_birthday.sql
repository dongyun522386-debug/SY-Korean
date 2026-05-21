-- 감자도리 1권 > 대화 > 생일 / 주문 / 예약
-- 이미 같은 book/content_type/korean 값이 있으면 건너뜁니다.

WITH src(id, korean, romanization, chinese, example_kr, example_zh, src_order) AS (
  VALUES
    (
      '11111111-1111-4111-8111-111111111101'::uuid,
      '상황 1: 생일 케이크 주문하기',
      'saengil keikeu jumunhagi',
      '情境 1：订生日蛋糕',
      $$A: 여보세요? 빵집이에요.
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
B: 010-1234-5678이에요.$$,
      $$A: 喂？这里是面包店。
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
B: 是010-1234-5678。$$,
      1
    ),
    (
      '11111111-1111-4111-8111-111111111102'::uuid,
      '상황 2: 꽃집에서 꽃 사기',
      'kkotjibeseo kkot sagi',
      '情境 2：在花店买花',
      $$A: 어서 오세요.
B: 안녕하세요. 꽃 있어요?
A: 네, 있어요.
B: 이 꽃은 얼마예요?
A: 만 오천 원이에요.
B: 좋아요. 이거 주세요.
A: 선물이에요?
B: 네, 오늘 제 어머니 생일이에요.
A: 아, 생일 축하드려요.
B: 감사합니다.$$,
      $$A: 欢迎光临。
B: 你好。有花吗？
A: 有的。
B: 这束花多少钱？
A: 一万五千韩元。
B: 好的。请给我这个。
A: 是礼物吗？
B: 是的，今天是我妈妈的生日。
A: 啊，祝生日快乐。
B: 谢谢。$$,
      2
    ),
    (
      '11111111-1111-4111-8111-111111111103'::uuid,
      '상황 3: 식당 예약 전화하기',
      'sikdang yeyak jeonhwahagi',
      '情境 3：打电话预约餐厅',
      $$A: 여보세요? 감자식당이에요.
B: 안녕하세요. 오늘 자리 있어요?
A: 네, 있어요.
B: 몇 시에 가능해요?
A: 7시에 가능해요.
B: 좋아요. 7시에 갈게요.
A: 이름이 뭐예요?
B: 린단이에요.
A: 전화번호가 뭐예요?
B: 010-2222-3333이에요.
A: 네, 예약됐어요.$$,
      $$A: 喂？这里是土豆餐厅。
B: 你好。今天有座位吗？
A: 有的。
B: 几点可以？
A: 7点可以。
B: 好的。我7点去。
A: 名字是什么？
B: 是琳丹。
A: 电话号码是多少？
B: 是010-2222-3333。
A: 好的，预约好了。$$,
      3
    ),
    (
      '11111111-1111-4111-8111-111111111104'::uuid,
      '상황 4: 선물 가격 묻기',
      'seonmul gagyeok mutgi',
      '情境 4：询问礼物价格',
      $$A: 어서 오세요.
B: 안녕하세요. 이 시계 얼마예요?
A: 삼만 원이에요.
B: 조금 비싸요. 저 가방은 얼마예요?
A: 이만 원이에요.
B: 좋아요. 이 가방 주세요.
A: 선물이에요?
B: 네, 친구 생일 선물이에요.
A: 친구 생일이 언제예요?
B: 6월 19일이에요.$$,
      $$A: 欢迎光临。
B: 你好。这块手表多少钱？
A: 三万韩元。
B: 有点贵。那个包多少钱？
A: 两万韩元。
B: 好的。请给我这个包。
A: 是礼物吗？
B: 是的，是朋友的生日礼物。
A: 朋友的生日是什么时候？
B: 6月19日。$$,
      4
    ),
    (
      '11111111-1111-4111-8111-111111111105'::uuid,
      '상황 5: 친구에게 생일 전화하기',
      'chinguege saengil jeonhwahagi',
      '情境 5：给朋友打生日电话',
      $$A: 여보세요?
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
A: 좋아요!$$,
      $$A: 喂？
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
A: 好啊！$$,
      5
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
