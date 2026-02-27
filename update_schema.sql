-- Aggiornamento del database per supportare ordini separati dello stesso prodotto in orari diversi

-- 1. Rimuovi il vincolo di unicità che impediva di avere più righe per lo stesso prodotto nello stesso ordine
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_order_id_menu_item_id_key;

-- 2. Elimina la vecchia funzione se esiste, per poter cambiare il tipo di ritorno
DROP FUNCTION IF EXISTS add_item_to_order(uuid, uuid, text, decimal, text);
DROP FUNCTION IF EXISTS add_item_to_order(uuid, uuid, text, numeric, text); -- Per sicurezza, se è stata definita come numeric

-- 3. Crea la nuova funzione RPC che inserisce sempre una nuova riga invece di aggiornare la quantità
-- E RITORNA l'ID della nuova riga creata
create or replace function add_item_to_order(
  p_order_id uuid,
  p_menu_item_id uuid,
  p_name text,
  p_price decimal,
  p_category text
) returns uuid as $$
declare
  v_new_id uuid;
begin
  insert into order_items (order_id, menu_item_id, user_id, name, price, quantity, category, status)
  values (p_order_id, p_menu_item_id, auth.uid(), p_name, p_price, 1, p_category, 'pending')
  returning id into v_new_id;
  
  return v_new_id;
end;
$$ language plpgsql security invoker;

-- 4. Tabelle per bozze di portate (order_drafts)
create table if not exists order_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  restaurant_id uuid not null,
  table_id text not null,
  course_number smallint not null check (course_number in (1,2,3)),
  items jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table order_drafts enable row level security;

drop policy if exists "Users can view their own order drafts" on order_drafts;
create policy "Users can view their own order drafts" on order_drafts for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own order drafts" on order_drafts;
create policy "Users can insert their own order drafts" on order_drafts for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own order drafts" on order_drafts;
create policy "Users can update their own order drafts" on order_drafts for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own order drafts" on order_drafts;
create policy "Users can delete their own order drafts" on order_drafts for delete using (auth.uid() = user_id);

-- Unique constraint required for upsert on (user_id, restaurant_id, table_id, course_number)
do $$
begin
  if not exists (
    select 1 
    from pg_indexes 
    where schemaname = 'public' 
      and indexname = 'order_drafts_unique_idx'
  ) then
    create unique index order_drafts_unique_idx 
      on public.order_drafts (user_id, restaurant_id, table_id, course_number);
  end if;
end $$;
