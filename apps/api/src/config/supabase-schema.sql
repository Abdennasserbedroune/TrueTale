-- TrueTale Supabase Schema
-- Run this in your Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- USERS / PROFILES TABLE
-- =============================================
-- This links to Supabase Auth users and stores profile information
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('reader', 'writer')) DEFAULT 'reader',
  
  -- Profile fields
  name TEXT,
  profile TEXT, -- Display name / tagline
  bio TEXT,
  avatar TEXT, -- Avatar URL
  location TEXT,
  
  -- Social links (JSONB for flexibility)
  socials JSONB DEFAULT '{}'::jsonb,
  
  -- Verification & Auth
  is_verified BOOLEAN NOT NULL DEFAULT false,
  
  -- Stripe integration
  stripe_account_id TEXT,
  stripe_onboarding_complete BOOLEAN DEFAULT false,
  
  -- Payout settings (JSONB)
  payout_settings JSONB DEFAULT '{"frequency": "weekly", "minimumThreshold": 5000}'::jsonb,
  
  -- Notification preferences (JSONB)
  notification_preferences JSONB DEFAULT '{"emailUpdates": true, "newFollowers": true, "bookReviews": true, "orderNotifications": true}'::jsonb,
  
  -- Account management
  deletion_requested_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_verified ON public.users(is_verified);

-- Updated_at trigger for users
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- BOOKS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.books (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Core fields
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  
  -- Media
  cover_url TEXT,
  
  -- Pricing
  price_cents INTEGER NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'EUR', 'GBP')),
  
  -- Status & visibility
  is_draft BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('public', 'private', 'unlisted')),
  
  -- Categorization
  tags TEXT[] DEFAULT '{}',
  category TEXT,
  
  -- Legacy/optional fields
  language TEXT DEFAULT 'English',
  pages INTEGER,
  
  -- Stats
  average_rating DECIMAL(3,2) DEFAULT 0.0 CHECK (average_rating >= 0 AND average_rating <= 5),
  review_count INTEGER DEFAULT 0 CHECK (review_count >= 0),
  views INTEGER DEFAULT 0 CHECK (views >= 0),
  sales INTEGER DEFAULT 0 CHECK (sales >= 0),
  
  -- Publishing
  published_at TIMESTAMPTZ,
  
  -- Metadata (JSONB for flexible additional data)
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for books table
CREATE INDEX IF NOT EXISTS idx_books_author_id ON public.books(author_id);
CREATE INDEX IF NOT EXISTS idx_books_slug ON public.books(slug);
CREATE INDEX IF NOT EXISTS idx_books_is_draft ON public.books(is_draft);
CREATE INDEX IF NOT EXISTS idx_books_status ON public.books(status);
CREATE INDEX IF NOT EXISTS idx_books_visibility ON public.books(visibility);
CREATE INDEX IF NOT EXISTS idx_books_published_at ON public.books(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_books_author_created ON public.books(author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_books_tags ON public.books USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_books_price ON public.books(price_cents);
CREATE INDEX IF NOT EXISTS idx_books_rating ON public.books(status, average_rating DESC);
CREATE INDEX IF NOT EXISTS idx_books_reviews ON public.books(status, review_count DESC);
CREATE INDEX IF NOT EXISTS idx_books_category ON public.books(status, category, published_at DESC);

-- Full text search index
CREATE INDEX IF NOT EXISTS idx_books_search ON public.books USING gin(to_tsvector('english', title || ' ' || description));

-- Updated_at trigger for books
CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON public.books
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to sync status with is_draft and set published_at
CREATE OR REPLACE FUNCTION sync_book_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Sync status with is_draft
  IF NEW.is_draft != OLD.is_draft THEN
    NEW.status = CASE WHEN NEW.is_draft THEN 'draft' ELSE 'published' END;
  END IF;
  
  IF NEW.status != OLD.status THEN
    NEW.is_draft = (NEW.status = 'draft');
  END IF;
  
  -- Set published_at when publishing
  IF NEW.status = 'published' AND OLD.status = 'draft' AND NEW.published_at IS NULL THEN
    NEW.published_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER sync_book_status_trigger BEFORE UPDATE ON public.books
  FOR EACH ROW EXECUTE FUNCTION sync_book_status();

-- =============================================
-- BOOK FILES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.book_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'epub', 'mobi', 'sample')),
  url TEXT NOT NULL,
  size BIGINT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_book_files_book_id ON public.book_files(book_id);
CREATE INDEX IF NOT EXISTS idx_book_files_type ON public.book_files(book_id, file_type);

-- =============================================
-- ORDERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE RESTRICT,
  writer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Stripe integration
  stripe_payment_intent_id TEXT UNIQUE,
  
  -- Amounts
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  platform_fee_cents INTEGER NOT NULL DEFAULT 0 CHECK (platform_fee_cents >= 0),
  seller_proceeds_cents INTEGER NOT NULL CHECK (seller_proceeds_cents >= 0),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  
  -- Download
  download_url TEXT,
  download_url_expires TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for orders
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_book_id ON public.orders(book_id);
CREATE INDEX IF NOT EXISTS idx_orders_writer_id ON public.orders(writer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_id ON public.orders(stripe_payment_intent_id);

-- Unique constraint to prevent duplicate purchases
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_user_book_unique ON public.orders(user_id, book_id) WHERE status = 'paid';

-- Updated_at trigger for orders
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- REVIEWS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for reviews
CREATE INDEX IF NOT EXISTS idx_reviews_book_id ON public.reviews(book_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_user_book_unique ON public.reviews(user_id, book_id);

-- Updated_at trigger for reviews
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update book rating stats on review changes
CREATE OR REPLACE FUNCTION update_book_rating_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculate average rating and review count
  UPDATE public.books
  SET
    average_rating = COALESCE((
      SELECT AVG(rating)::DECIMAL(3,2)
      FROM public.reviews
      WHERE book_id = COALESCE(NEW.book_id, OLD.book_id)
    ), 0),
    review_count = (
      SELECT COUNT(*)
      FROM public.reviews
      WHERE book_id = COALESCE(NEW.book_id, OLD.book_id)
    )
  WHERE id = COALESCE(NEW.book_id, OLD.book_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

CREATE TRIGGER update_book_rating_on_review_insert
  AFTER INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION update_book_rating_stats();

CREATE TRIGGER update_book_rating_on_review_update
  AFTER UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION update_book_rating_stats();

CREATE TRIGGER update_book_rating_on_review_delete
  AFTER DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION update_book_rating_stats();

-- =============================================
-- FOLLOWS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for follows
CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows(following_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_follows_unique ON public.follows(follower_id, following_id);

-- Prevent self-follows
ALTER TABLE public.follows ADD CONSTRAINT no_self_follow CHECK (follower_id != following_id);

-- =============================================
-- FEED ACTIVITIES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.feed_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('book_published', 'story_published', 'review_created', 'follow_created', 'follow_removed')),
  
  -- Metadata (JSONB for flexible activity data)
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for feed activities
CREATE INDEX IF NOT EXISTS idx_feed_activities_user ON public.feed_activities(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_activities_type ON public.feed_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_feed_activities_created ON public.feed_activities(created_at DESC);

-- =============================================
-- DRAFTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  writer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for drafts
CREATE INDEX IF NOT EXISTS idx_drafts_writer ON public.drafts(writer_id, created_at DESC);

-- Updated_at trigger for drafts
CREATE TRIGGER update_drafts_updated_at BEFORE UPDATE ON public.drafts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- STORIES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  writer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  is_published BOOLEAN NOT NULL DEFAULT false,
  
  -- Stats
  views INTEGER DEFAULT 0 CHECK (views >= 0),
  likes INTEGER DEFAULT 0 CHECK (likes >= 0),
  
  -- Timestamps
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for stories
CREATE INDEX IF NOT EXISTS idx_stories_writer ON public.stories(writer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_published ON public.stories(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_tags ON public.stories USING GIN(tags);

-- Updated_at trigger for stories
CREATE TRIGGER update_stories_updated_at BEFORE UPDATE ON public.stories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- PAYOUTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  
  -- Stripe payout tracking
  stripe_payout_id TEXT,
  
  -- Related orders (array of order IDs)
  order_ids UUID[] DEFAULT '{}',
  
  -- Failure reason
  failure_reason TEXT,
  
  -- Timestamps
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for payouts
CREATE INDEX IF NOT EXISTS idx_payouts_seller ON public.payouts(seller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON public.payouts(status);
CREATE INDEX IF NOT EXISTS idx_payouts_stripe ON public.payouts(stripe_payout_id);

-- Updated_at trigger for payouts
CREATE TRIGGER update_payouts_updated_at BEFORE UPDATE ON public.payouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================
-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all profiles" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Books policies
CREATE POLICY "Anyone can view published books" ON public.books FOR SELECT USING (status = 'published' AND visibility = 'public');
CREATE POLICY "Authors can view own books" ON public.books FOR SELECT USING (auth.uid() = author_id);
CREATE POLICY "Authors can insert own books" ON public.books FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update own books" ON public.books FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Authors can delete own books" ON public.books FOR DELETE USING (auth.uid() = author_id);

-- Book files policies
CREATE POLICY "Buyers can view book files" ON public.book_files FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.book_id = book_files.book_id
    AND orders.user_id = auth.uid()
    AND orders.status = 'paid'
  )
  OR
  EXISTS (
    SELECT 1 FROM public.books
    WHERE books.id = book_files.book_id
    AND books.author_id = auth.uid()
  )
);

-- Orders policies
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id OR auth.uid() = writer_id);
CREATE POLICY "Users can create own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Reviews policies
CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users can create own reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reviews" ON public.reviews FOR DELETE USING (auth.uid() = user_id);

-- Follows policies
CREATE POLICY "Anyone can view follows" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Users can create own follows" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can delete own follows" ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- Feed activities policies
CREATE POLICY "Anyone can view feed activities" ON public.feed_activities FOR SELECT USING (true);
CREATE POLICY "Users can create own activities" ON public.feed_activities FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Drafts policies
CREATE POLICY "Writers can view own drafts" ON public.drafts FOR SELECT USING (auth.uid() = writer_id);
CREATE POLICY "Writers can create own drafts" ON public.drafts FOR INSERT WITH CHECK (auth.uid() = writer_id);
CREATE POLICY "Writers can update own drafts" ON public.drafts FOR UPDATE USING (auth.uid() = writer_id);
CREATE POLICY "Writers can delete own drafts" ON public.drafts FOR DELETE USING (auth.uid() = writer_id);

-- Stories policies
CREATE POLICY "Anyone can view published stories" ON public.stories FOR SELECT USING (is_published = true);
CREATE POLICY "Writers can view own stories" ON public.stories FOR SELECT USING (auth.uid() = writer_id);
CREATE POLICY "Writers can create own stories" ON public.stories FOR INSERT WITH CHECK (auth.uid() = writer_id);
CREATE POLICY "Writers can update own stories" ON public.stories FOR UPDATE USING (auth.uid() = writer_id);
CREATE POLICY "Writers can delete own stories" ON public.stories FOR DELETE USING (auth.uid() = writer_id);

-- Payouts policies
CREATE POLICY "Sellers can view own payouts" ON public.payouts FOR SELECT USING (auth.uid() = seller_id);

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to get trending books (for feed)
CREATE OR REPLACE FUNCTION get_trending_books(days_back INTEGER DEFAULT 7, result_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  title TEXT,
  author_id UUID,
  cover_url TEXT,
  price_cents INTEGER,
  currency TEXT,
  score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    b.title,
    b.author_id,
    b.cover_url,
    b.price_cents,
    b.currency,
    (
      (b.sales * 0.5) +
      (b.views * 0.1) +
      (COALESCE((
        SELECT COUNT(*)
        FROM public.reviews r
        WHERE r.book_id = b.id
        AND r.created_at >= NOW() - (days_back || ' days')::INTERVAL
      ), 0) * 1.0)
    )::NUMERIC AS score
  FROM public.books b
  WHERE b.status = 'published' AND b.visibility = 'public'
  ORDER BY score DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql STABLE;
