-- Settings table for product & brand configuration
CREATE TABLE IF NOT EXISTS settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz DEFAULT now()
);

-- Storage bucket for product images (create via Supabase dashboard if not exists)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);

-- Default settings rows
INSERT INTO settings (key, value) VALUES
  ('product', '{"name":"Олон цэцгийн 100% цэвэр зөгийн бал","description":"Байгалийн цэвэр, химийн бодис агуулаагүй, шууд үйлдвэрлэгчээс","prices":{"1":39000,"2":78000,"3":117000},"images":[]}'::jsonb),
  ('brand', '{"name":"ТИТЭМ","tagline":"Premium Honey","logo_url":""}'::jsonb)
ON CONFLICT (key) DO NOTHING;
