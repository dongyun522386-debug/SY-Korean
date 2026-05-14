-- 감자도리 1권 > 단어 > 인사 및 기본 응답 로마자 보강

WITH src(korean, romanization) AS (
  VALUES
    ('안녕하세요', 'an-nyeong-ha-se-yo'),
    ('안녕히 가세요', 'an-nyeong-hi ga-se-yo'),
    ('안녕히 계세요', 'an-nyeong-hi gye-se-yo'),
    ('반가워요', 'ban-ga-wo-yo'),
    ('오랜만이에요', 'o-raen-man-i-e-yo'),
    ('여보세요', 'yeo-bo-se-yo'),
    ('실례합니다', 'sil-lye-ham-ni-da'),
    ('저기요', 'jeo-gi-yo'),
    ('어서 오세요', 'eo-seo o-se-yo'),
    ('들어오세요', 'deu-reo-o-se-yo'),
    ('네', 'ne'),
    ('아니요', 'a-ni-yo'),
    ('맞아요', 'ma-ja-yo'),
    ('아니에요', 'a-ni-e-yo'),
    ('그래요', 'geu-rae-yo'),
    ('정말이에요?', 'jeong-mal-i-e-yo'),
    ('그럼요', 'geu-reom-yo'),
    ('알겠어요', 'al-ge-sseo-yo'),
    ('좋아요', 'jo-a-yo'),
    ('괜찮아요', 'gwaen-cha-na-yo'),
    ('감사합니다', 'gam-sa-ham-ni-da'),
    ('고마워요', 'go-ma-wo-yo'),
    ('고맙습니다', 'go-map-seum-ni-da'),
    ('미안해요', 'mi-an-hae-yo'),
    ('죄송합니다', 'joe-song-ham-ni-da'),
    ('천만에요', 'cheon-man-e-yo'),
    ('잠깐만 기다리세요', 'jam-kkan-man gi-da-ri-se-yo'),
    ('같이 가요', 'ga-chi ga-yo'),
    ('다음에 만나요', 'da-eum-e man-na-yo'),
    ('왜요?', 'wae-yo')
)
UPDATE words
SET romanization = src.romanization
FROM src
WHERE words.book = 'book1'
  AND words.content_type = 'vocab'
  AND words.korean = src.korean
RETURNING words.korean, words.romanization;
