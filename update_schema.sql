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
