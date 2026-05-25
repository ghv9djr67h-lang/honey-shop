CREATE TABLE IF NOT EXISTS site_content (
  id text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

INSERT INTO site_content (id, value) VALUES
  ('hero_title', 'Байгалийн Цэвэр Сархинагтай Зөгийн Бал'),
  ('hero_subtitle', 'Байгаль эхийн бүтээсэн яг тэрхүү төгс хэлбэрээрээ таны гарт хүрч буй шим тэжээлийн охь'),
  ('hero_price', '39,000₮'),
  ('about_text', 'Өвөрмонголын уулсын олон төрлийн зэрлэг цэцгийн шүүснээс хураасан, 100% байгалийн гаралтай зөгийн бал'),
  ('delivery_text', 'Өнөөдөр захиалбал маргааш өдөртөө хүрнэ'),
  ('contact_phone', '9666-5040'),
  ('footer_text', '© 2026 Титэм. Бүх эрх хуулиар хамгаалагдсан.')
ON CONFLICT (id) DO NOTHING;
