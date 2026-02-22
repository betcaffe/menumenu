-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Restaurants Table (Stores layout)
create table if not exists restaurants (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null unique,
  name text,
  layout jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Menu Items Table
create table if not exists menu_items (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  category text not null,
  name text not null,
  description text,
  price decimal(10,2) not null,
  available boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Orders Table
create table if not exists orders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  table_id text not null,
  status text default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone
);

-- 4. Order Items Table
create table if not exists order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references orders on delete cascade not null,
  user_id uuid references auth.users not null, -- Added for easier RLS
  menu_item_id uuid references menu_items,
  name text not null,
  price decimal(10,2) not null,
  quantity integer default 1,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table restaurants enable row level security;
alter table menu_items enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

-- Policies for Restaurants
create policy "Users can view their own restaurant" on restaurants for select using (auth.uid() = user_id);
create policy "Users can insert their own restaurant" on restaurants for insert with check (auth.uid() = user_id);
create policy "Users can update their own restaurant" on restaurants for update using (auth.uid() = user_id);

-- Policies for Menu Items
create policy "Users can view their own menu items" on menu_items for select using (auth.uid() = user_id);
create policy "Users can insert their own menu items" on menu_items for insert with check (auth.uid() = user_id);
create policy "Users can update their own menu items" on menu_items for update using (auth.uid() = user_id);
create policy "Users can delete their own menu items" on menu_items for delete using (auth.uid() = user_id);

-- Policies for Orders
create policy "Users can view their own orders" on orders for select using (auth.uid() = user_id);
create policy "Users can insert their own orders" on orders for insert with check (auth.uid() = user_id);
create policy "Users can update their own orders" on orders for update using (auth.uid() = user_id);
create policy "Users can delete their own orders" on orders for delete using (auth.uid() = user_id);

-- Policies for Order Items
create policy "Users can view their own order items" on order_items for select using (auth.uid() = user_id);
create policy "Users can insert their own order items" on order_items for insert with check (auth.uid() = user_id);
create policy "Users can update their own order items" on order_items for update using (auth.uid() = user_id);
create policy "Users can delete their own order items" on order_items for delete using (auth.uid() = user_id);
