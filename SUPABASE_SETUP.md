# Supabase Setup

Run the following SQL in your Supabase SQL Editor to create the necessary tables and indexes.

## Enable Extensions
```sql
create extension if not exists "uuid-ossp";
```

## Users Table
```sql
create table public.users (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  username text unique not null,
  password text not null, -- Will store hashed password if using custom auth
  role text not null default 'reader' check (role in ('writer', 'reader')),
  name text,
  profile text,
  bio text,
  avatar text,
  location text,
  socials jsonb,
  is_verified boolean default false,
  verification_token text,
  verification_expires timestamptz,
  reset_token text,
  reset_expires timestamptz,
  refresh_tokens jsonb default '[]'::jsonb,
  stripe_account_id text,
  stripe_onboarding_complete boolean default false,
  payout_settings jsonb,
  notification_preferences jsonb,
  deletion_requested_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index users_email_idx on public.users (email);
create index users_username_idx on public.users (username);
create index users_verification_token_idx on public.users (verification_token);
create index users_reset_token_idx on public.users (reset_token);
```

## Books Table
```sql
create table public.books (
  id uuid primary key default uuid_generate_v4(),
  author_id uuid references public.users(id) not null,
  title text not null,
  slug text unique not null,
  description text,
  cover_url text,
  price_cents integer default 0,
  currency text default 'USD' check (currency in ('USD', 'EUR', 'GBP')),
  is_draft boolean default true,
  visibility text default 'private' check (visibility in ('public', 'private', 'unlisted')),
  tags text[],
  files jsonb default '[]'::jsonb,
  stats jsonb default '{"views": 0, "sales": 0}'::jsonb,
  -- Legacy fields
  cover_image text,
  category text,
  status text default 'draft' check (status in ('draft', 'published')),
  genres text[],
  language text default 'English',
  pages integer,
  average_rating numeric default 0,
  review_count integer default 0,
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index books_author_id_idx on public.books (author_id);
create index books_slug_idx on public.books (slug);
create index books_tags_idx on public.books using gin (tags);
create index books_is_draft_visibility_idx on public.books (is_draft, visibility);
```

## Orders Table
```sql
create table public.orders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) not null,
  book_id uuid references public.books(id) not null,
  writer_id uuid references public.users(id) not null,
  price numeric not null,
  amount_cents integer not null,
  currency text default 'USD',
  stripe_payment_intent_id text unique,
  status text default 'pending' check (status in ('pending', 'paid', 'failed', 'refunded')),
  platform_fee_cents integer,
  seller_proceeds_cents integer,
  download_url text,
  download_url_expires timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index orders_user_id_idx on public.orders (user_id);
create index orders_writer_id_idx on public.orders (writer_id);
create unique index orders_user_book_idx on public.orders (user_id, book_id);
```

## Reviews Table
```sql
create table public.reviews (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) not null,
  book_id uuid references public.books(id) not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  review_text text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create unique index reviews_user_book_idx on public.reviews (user_id, book_id);
create index reviews_book_id_idx on public.reviews (book_id);
```

## Other Tables (Drafts, Follows, etc.)
You should create similar tables for other models found in `packages/db/src/models`.
