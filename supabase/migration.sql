-- ============================================================
-- Supabase Migration: عين سبأ للعقارات والمقاولات العامة
-- Run this in the Supabase SQL Editor to set up your database
-- ============================================================

-- 1. Properties Table
CREATE TABLE IF NOT EXISTS properties (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    property_type TEXT NOT NULL CHECK (property_type IN ('apartment', 'villa', 'land', 'commercial')),
    status TEXT NOT NULL CHECK (status IN ('sale', 'rent')),
    price NUMERIC NOT NULL CHECK (price >= 0),
    area NUMERIC,
    location TEXT DEFAULT '',
    images TEXT[] DEFAULT '{}',
    featured BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read properties"
    ON properties FOR SELECT
    TO public
    USING (true);

-- Allow authenticated users to insert
CREATE POLICY "Allow authenticated insert properties"
    ON properties FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow authenticated users to update
CREATE POLICY "Allow authenticated update properties"
    ON properties FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Allow authenticated users to delete
CREATE POLICY "Allow authenticated delete properties"
    ON properties FOR DELETE
    TO authenticated
    USING (true);

-- 2. Inquiries Table
CREATE TABLE IF NOT EXISTS inquiries (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    property_id BIGINT REFERENCES properties(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- Allow public insert (contact form)
CREATE POLICY "Allow public insert inquiries"
    ON inquiries FOR INSERT
    TO public
    WITH CHECK (true);

-- Allow authenticated users to read inquiries
CREATE POLICY "Allow authenticated read inquiries"
    ON inquiries FOR SELECT
    TO authenticated
    USING (true);

-- 3. Users Table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT DEFAULT '',
    email TEXT DEFAULT '',
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'agent')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Allow users read own data"
    ON users FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Allow users update own data"
    ON users FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Only admins can read all users
CREATE POLICY "Allow admin read all users"
    ON users FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 4. Property Categories Table
CREATE TABLE IF NOT EXISTS property_categories (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE property_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read categories"
    ON property_categories FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Allow authenticated insert categories"
    ON property_categories FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Insert default categories
INSERT INTO property_categories (name) VALUES
    ('شقة'),
    ('فيلا'),
    ('أرض'),
    ('تجاري')
ON CONFLICT (name) DO NOTHING;

-- Insert sample properties (optional)
INSERT INTO properties (title, description, property_type, status, price, area, location, images, featured) VALUES
    ('فيلا مودرن فاخرة - حي المطار', 'فيلا مودرن فاخرة تقع في حي المطار الراقي. تتميز بتصميم عصري ومساحات واسعة مع تشطيب فاخر.', 'villa', 'sale', 80000000, 450, 'مأرب، حي المطار', ARRAY['https://picsum.photos/seed/villa1/600/400', 'https://picsum.photos/seed/villa1b/600/400'], true),
    ('شقة مميزة بإطلالة - وسط المدينة', 'شقة سكنية مميزة في وسط مدينة مأرب مع إطلالة رائعة. مناسبة للعائلات الصغيرة.', 'apartment', 'rent', 1200000, 180, 'مأرب، وسط المدينة', ARRAY['https://picsum.photos/seed/apartment1/600/400', 'https://picsum.photos/seed/apartment1b/600/400'], true),
    ('أرض سكنية واسعة - حي السفير', 'أرض سكنية واسعة بموقع ممتاز في حي السفير. مناسبة لبناء فيلا أو عمارة سكنية.', 'land', 'sale', 15000000, 800, 'مأرب، حي السفير', ARRAY['https://picsum.photos/seed/land1/600/400'], true),
    ('فيلا دوبلكس فاخرة - حي السفير', 'فيلا دوبلكس فاخرة بتصميم عصري في أفخم أحياء مأرب. تشمل حديقة خاصة ومسبح.', 'villa', 'sale', 120000000, 600, 'مأرب، حي السفير', ARRAY['https://picsum.photos/seed/villa2/600/400'], false),
    ('شقة مفروشة للإيجار', 'شقة مفروشة بالكامل جاهزة للسكن في وسط المدينة. مناسبة للعزاب والعائلات الصغيرة.', 'apartment', 'rent', 3000000, 120, 'مأرب، وسط المدينة', ARRAY['https://picsum.photos/seed/apartment2/600/400'], false),
    ('أرض تجارية - شارع رئيسي', 'أرض تجارية على شارع رئيسي في حي المطار. موقع ممتاز للمشاريع التجارية.', 'commercial', 'sale', 25000000, 1200, 'مأرب، حي المطار', ARRAY['https://picsum.photos/seed/land2/600/400'], false)
ON CONFLICT (id) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_properties_featured ON properties(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON properties(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries(created_at DESC);

-- Function to automatically create a user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.users (id, full_name, email, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
        COALESCE(NEW.email, ''),
        'user'
    );
    RETURN NEW;
END;
$$;

-- Trigger to create user profile on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
