-- 감자도리 권수/학습 유형 분류 추가
-- Supabase SQL Editor에서 한 번 실행하세요.

ALTER TABLE words
  ADD COLUMN IF NOT EXISTS book TEXT NOT NULL DEFAULT 'book1'
    CHECK (book IN ('book1', 'book2', 'book3', 'book4', 'book5'));

ALTER TABLE words
  ADD COLUMN IF NOT EXISTS content_type TEXT NOT NULL DEFAULT 'vocab'
    CHECK (content_type IN ('vocab', 'pronunciation', 'dialogue', 'reading', 'listening'));

UPDATE words
SET
  book = COALESCE(book, 'book1'),
  content_type = COALESCE(content_type, 'vocab');
