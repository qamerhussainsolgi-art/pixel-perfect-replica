-- Step 3: schema updates for catalog, categories, contact + custom orders

-- (a) products.collection nullable
ALTER TABLE public.products ALTER COLUMN collection DROP NOT NULL;

-- (b) seasonal_categories
CREATE TABLE IF NOT EXISTS public.seasonal_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);
GRANT SELECT ON public.seasonal_categories TO anon, authenticated;
GRANT ALL ON public.seasonal_categories TO service_role;
ALTER TABLE public.seasonal_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "seasonal_categories public read" ON public.seasonal_categories;
CREATE POLICY "seasonal_categories public read" ON public.seasonal_categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "seasonal_categories admin write" ON public.seasonal_categories;
CREATE POLICY "seasonal_categories admin write" ON public.seasonal_categories
  FOR ALL TO authenticated USING (public.current_is_admin()) WITH CHECK (public.current_is_admin());

-- product_type_categories
CREATE TABLE IF NOT EXISTS public.product_type_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);
GRANT SELECT ON public.product_type_categories TO anon, authenticated;
GRANT ALL ON public.product_type_categories TO service_role;
ALTER TABLE public.product_type_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "product_type_categories public read" ON public.product_type_categories;
CREATE POLICY "product_type_categories public read" ON public.product_type_categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "product_type_categories admin write" ON public.product_type_categories;
CREATE POLICY "product_type_categories admin write" ON public.product_type_categories
  FOR ALL TO authenticated USING (public.current_is_admin()) WITH CHECK (public.current_is_admin());

-- (c) products extra columns
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS seasonal_category_id uuid REFERENCES public.seasonal_categories(id),
  ADD COLUMN IF NOT EXISTS product_type_category_id uuid REFERENCES public.product_type_categories(id),
  ADD COLUMN IF NOT EXISTS image_url_1 text,
  ADD COLUMN IF NOT EXISTS image_url_2 text,
  ADD COLUMN IF NOT EXISTS image_url_3 text,
  ADD COLUMN IF NOT EXISTS image_url_4 text,
  ADD COLUMN IF NOT EXISTS discount_percentage numeric DEFAULT 0
    CHECK (discount_percentage >= 0 AND discount_percentage <= 100);

-- (d) contact_submissions
CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now(),
  read boolean DEFAULT false
);
GRANT INSERT ON public.contact_submissions TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.contact_submissions TO authenticated;
GRANT ALL ON public.contact_submissions TO service_role;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "contact_submissions public insert" ON public.contact_submissions;
CREATE POLICY "contact_submissions public insert" ON public.contact_submissions
  FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "contact_submissions admin read" ON public.contact_submissions;
CREATE POLICY "contact_submissions admin read" ON public.contact_submissions
  FOR SELECT TO authenticated USING (public.current_is_admin());
DROP POLICY IF EXISTS "contact_submissions admin update" ON public.contact_submissions;
CREATE POLICY "contact_submissions admin update" ON public.contact_submissions
  FOR UPDATE TO authenticated USING (public.current_is_admin()) WITH CHECK (public.current_is_admin());
DROP POLICY IF EXISTS "contact_submissions admin delete" ON public.contact_submissions;
CREATE POLICY "contact_submissions admin delete" ON public.contact_submissions
  FOR DELETE TO authenticated USING (public.current_is_admin());

-- (e) custom_order_requests
CREATE TABLE IF NOT EXISTS public.custom_order_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  garment_type text,
  fabric_preference text,
  budget_range text,
  reference_image_url text,
  details text,
  created_at timestamptz DEFAULT now()
);
GRANT INSERT ON public.custom_order_requests TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.custom_order_requests TO authenticated;
GRANT ALL ON public.custom_order_requests TO service_role;
ALTER TABLE public.custom_order_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "custom_order_requests public insert" ON public.custom_order_requests;
CREATE POLICY "custom_order_requests public insert" ON public.custom_order_requests
  FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "custom_order_requests admin read" ON public.custom_order_requests;
CREATE POLICY "custom_order_requests admin read" ON public.custom_order_requests
  FOR SELECT TO authenticated USING (public.current_is_admin());
DROP POLICY IF EXISTS "custom_order_requests admin update" ON public.custom_order_requests;
CREATE POLICY "custom_order_requests admin update" ON public.custom_order_requests
  FOR UPDATE TO authenticated USING (public.current_is_admin()) WITH CHECK (public.current_is_admin());
DROP POLICY IF EXISTS "custom_order_requests admin delete" ON public.custom_order_requests;
CREATE POLICY "custom_order_requests admin delete" ON public.custom_order_requests
  FOR DELETE TO authenticated USING (public.current_is_admin());

-- Storage bucket for custom order reference images
INSERT INTO storage.buckets (id, name, public)
VALUES ('custom-order-references', 'custom-order-references', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "custom-order-references public read" ON storage.objects;
CREATE POLICY "custom-order-references public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'custom-order-references');
DROP POLICY IF EXISTS "custom-order-references public upload" ON storage.objects;
CREATE POLICY "custom-order-references public upload" ON storage.objects
  FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'custom-order-references');

-- (g) clear placeholder data
DELETE FROM public.orders;
DELETE FROM public.products;
