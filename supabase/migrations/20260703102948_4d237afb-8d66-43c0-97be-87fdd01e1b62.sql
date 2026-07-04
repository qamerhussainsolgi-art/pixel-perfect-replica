
-- Enums
CREATE TYPE public.app_role AS ENUM ('client', 'developer');
CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'shipped', 'delivered');
CREATE TYPE public.product_collection AS ENUM ('summer', 'winter', 'luxury');
CREATE TYPE public.stock_status AS ENUM ('in_stock', 'out_of_stock');

-- Helper: updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Helper: slugify
CREATE OR REPLACE FUNCTION public.slugify(txt text)
RETURNS text AS $$
  SELECT trim(both '-' from regexp_replace(lower(coalesce(txt,'')), '[^a-z0-9]+', '-', 'g'));
$$ LANGUAGE sql IMMUTABLE;

-- =========================
-- admin_users
-- =========================
CREATE TABLE public.admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  role public.app_role NOT NULL DEFAULT 'client',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.admin_users TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_users TO authenticated;
GRANT ALL ON public.admin_users TO service_role;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Security definer: check admin role by email
CREATE OR REPLACE FUNCTION public.is_admin(_email text, _role public.app_role DEFAULT NULL)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE lower(email) = lower(coalesce(_email,''))
      AND (_role IS NULL OR role = _role OR role = 'developer')
  );
$$;

-- Security definer: check admin role for currently authenticated auth user via jwt email
CREATE OR REPLACE FUNCTION public.current_is_admin(_role public.app_role DEFAULT NULL)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.is_admin((auth.jwt() ->> 'email')::text, _role);
$$;

-- RLS for admin_users
CREATE POLICY "Developers manage admin users"
  ON public.admin_users FOR ALL
  TO authenticated
  USING (public.current_is_admin('developer'))
  WITH CHECK (public.current_is_admin('developer'));

CREATE POLICY "Anyone can lookup admin by email+phone"
  ON public.admin_users FOR SELECT
  TO anon, authenticated
  USING (true);

-- =========================
-- customers (profile mirror of auth.users)
-- =========================
CREATE TABLE public.customers (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text UNIQUE,
  email text UNIQUE NOT NULL,
  address text,
  age integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers manage own record"
  ON public.customers FOR ALL
  TO authenticated
  USING (auth.uid() = id OR public.current_is_admin('developer'))
  WITH CHECK (auth.uid() = id OR public.current_is_admin('developer'));

CREATE TRIGGER customers_updated BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create customer profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_customer()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.customers (id, name, email, phone, age)
  VALUES (
    NEW.id,
    coalesce(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    NULLIF(NEW.raw_user_meta_data->>'age','')::integer
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_customer();

-- =========================
-- products
-- =========================
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  collection public.product_collection NOT NULL,
  images text[] NOT NULL DEFAULT '{}',
  stock_status public.stock_status NOT NULL DEFAULT 'in_stock',
  seo_slug text UNIQUE NOT NULL,
  seo_title text,
  seo_description text,
  fabric text,
  care text,
  sizing text,
  featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read products"
  ON public.products FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins manage products"
  ON public.products FOR ALL
  TO authenticated
  USING (public.current_is_admin())
  WITH CHECK (public.current_is_admin());

CREATE TRIGGER products_updated BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-slug trigger
CREATE OR REPLACE FUNCTION public.products_autoslug()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.seo_slug IS NULL OR NEW.seo_slug = '' THEN
    NEW.seo_slug := public.slugify(NEW.name) || '-' || substr(gen_random_uuid()::text,1,6);
  END IF;
  RETURN NEW;
END;$$;
CREATE TRIGGER products_slug BEFORE INSERT ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.products_autoslug();

-- =========================
-- orders
-- =========================
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  items jsonb NOT NULL,
  total_price numeric(10,2) NOT NULL CHECK (total_price >= 0),
  status public.order_status NOT NULL DEFAULT 'pending',
  order_notes text,
  shipping_name text NOT NULL,
  shipping_phone text NOT NULL,
  shipping_address text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers see own orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid() OR public.current_is_admin());

CREATE POLICY "Customers create own orders"
  ON public.orders FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Admins update orders"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (public.current_is_admin())
  WITH CHECK (public.current_is_admin());

CREATE POLICY "Admins delete orders"
  ON public.orders FOR DELETE
  TO authenticated
  USING (public.current_is_admin());

CREATE TRIGGER orders_updated BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================
-- blog_posts
-- =========================
CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  excerpt text,
  content text NOT NULL,
  featured_image text,
  author text NOT NULL DEFAULT 'Tazeen Faisal',
  category text,
  seo_slug text UNIQUE NOT NULL,
  seo_title text,
  seo_description text,
  published_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.blog_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_posts TO authenticated;
GRANT ALL ON public.blog_posts TO service_role;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read published posts"
  ON public.blog_posts FOR SELECT
  TO anon, authenticated
  USING (published_date IS NOT NULL OR public.current_is_admin());

CREATE POLICY "Admins manage posts"
  ON public.blog_posts FOR ALL
  TO authenticated
  USING (public.current_is_admin())
  WITH CHECK (public.current_is_admin());

CREATE TRIGGER posts_updated BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.posts_autoslug()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.seo_slug IS NULL OR NEW.seo_slug = '' THEN
    NEW.seo_slug := public.slugify(NEW.title) || '-' || substr(gen_random_uuid()::text,1,6);
  END IF;
  RETURN NEW;
END;$$;
CREATE TRIGGER posts_slug BEFORE INSERT ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.posts_autoslug();
