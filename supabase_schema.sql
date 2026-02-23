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

-- Add restaurant_id column if it doesn't exist
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'menu_items' and column_name = 'restaurant_id') then
    alter table menu_items add column restaurant_id uuid references restaurants;
  end if;
end $$;

-- 3. Orders Table
create table if not exists orders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  table_id text not null,
  status text default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone
);

-- Add restaurant_id column if it doesn't exist
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'orders' and column_name = 'restaurant_id') then
    alter table orders add column restaurant_id uuid references restaurants;
  end if;
end $$;

-- 4. Order Items Table
create table if not exists order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references orders on delete cascade not null,
  user_id uuid references auth.users not null, 
  menu_item_id uuid references menu_items,
  name text not null,
  price decimal(10,2) not null,
  quantity integer default 1,
  category text, -- Added for persistence after menu item deletion
  status text default 'pending', -- pending, preparing, ready, served
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add status column if it doesn't exist (for existing tables)
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'order_items' and column_name = 'status') then
    alter table order_items add column status text default 'pending';
  end if;
end $$;

-- Add category column if it doesn't exist
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'order_items' and column_name = 'category') then
    alter table order_items add column category text;
  end if;
end $$;

-- Modifica vincolo foreign key per permettere eliminazione menu items (SET NULL)
do $$
begin
  -- Controlla se esiste il vincolo (assumendo nome default)
  if exists (
    select 1 
    from information_schema.table_constraints 
    where constraint_name = 'order_items_menu_item_id_fkey' 
    and table_name = 'order_items'
  ) then
    alter table order_items drop constraint order_items_menu_item_id_fkey;
  end if;
  
  -- Aggiungi il nuovo vincolo
  alter table order_items 
  add constraint order_items_menu_item_id_fkey 
  foreign key (menu_item_id) 
  references menu_items(id) 
  on delete set null;
  
exception when others then
  raise notice 'Errore aggiornamento vincolo: %', SQLERRM;
end $$;

-- Rimuovi duplicati in order_items per preparare il vincolo unique
delete from order_items a using order_items b
where a.id < b.id and a.order_id = b.order_id and a.menu_item_id = b.menu_item_id;

-- Aggiungi vincolo UNIQUE su (order_id, menu_item_id)
do $$
begin
  if not exists (
    select 1 
    from information_schema.table_constraints 
    where constraint_name = 'order_items_order_id_menu_item_id_key' 
    and table_name = 'order_items'
  ) then
    alter table order_items add constraint order_items_order_id_menu_item_id_key unique (order_id, menu_item_id);
  end if;
end $$;

-- Funzione RPC per aggiungere item all'ordine (atomica)
create or replace function add_item_to_order(
  p_order_id uuid,
  p_menu_item_id uuid,
  p_name text,
  p_price decimal,
  p_category text
) returns void as $$
begin
  insert into order_items (order_id, menu_item_id, user_id, name, price, quantity, category, status)
  values (p_order_id, p_menu_item_id, auth.uid(), p_name, p_price, 1, p_category, 'pending')
  on conflict (order_id, menu_item_id)
  do update set 
    quantity = order_items.quantity + 1;
end;
$$ language plpgsql security invoker;


-- Enable Realtime
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime for all tables;
commit;

-- Enable Row Level Security (RLS)
alter table restaurants enable row level security;
alter table menu_items enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

-- Policies for Restaurants
drop policy if exists "Users can view their own restaurant" on restaurants;
create policy "Users can view their own restaurant" on restaurants for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own restaurant" on restaurants;
create policy "Users can insert their own restaurant" on restaurants for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own restaurant" on restaurants;
create policy "Users can update their own restaurant" on restaurants for update using (auth.uid() = user_id);

-- Policies for Menu Items
drop policy if exists "Users can view their own menu items" on menu_items;
create policy "Users can view their own menu items" on menu_items for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own menu items" on menu_items;
create policy "Users can insert their own menu items" on menu_items for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own menu items" on menu_items;
create policy "Users can update their own menu items" on menu_items for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own menu items" on menu_items;
create policy "Users can delete their own menu items" on menu_items for delete using (auth.uid() = user_id);

-- Policies for Orders
drop policy if exists "Users can view their own orders" on orders;
create policy "Users can view their own orders" on orders for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own orders" on orders;
create policy "Users can insert their own orders" on orders for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own orders" on orders;
create policy "Users can update their own orders" on orders for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own orders" on orders;
create policy "Users can delete their own orders" on orders for delete using (auth.uid() = user_id);

-- Policies for Order Items
drop policy if exists "Users can view their own order items" on order_items;
create policy "Users can view their own order items" on order_items for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own order items" on order_items;
create policy "Users can insert their own order items" on order_items for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own order items" on order_items;
create policy "Users can update their own order items" on order_items for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own order items" on order_items;
create policy "Users can delete their own order items" on order_items for delete using (auth.uid() = user_id);
