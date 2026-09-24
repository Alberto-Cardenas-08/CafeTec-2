-- Desactiva el cooldown de 2 horas para pruebas.
-- SQL Editor → New query → Run

create or replace function public.create_cafetec_order(
  p_customer_name text,
  p_note text,
  p_items jsonb,
  p_device_id text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id text;
  v_total numeric := 0;
  v_item jsonb;
  v_product public.products%rowtype;
  v_qty integer;
  v_qty_total integer := 0;
  v_open boolean;
  v_result jsonb;
begin
  select is_open into v_open from public.cafe_settings where id = 1;
  if coalesce(v_open, true) is false then
    raise exception 'La cafetería no está recibiendo pedidos en este momento.';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'El pedido necesita al menos un producto.';
  end if;
  if jsonb_array_length(p_items) > 3 then
    raise exception 'El pedido no puede tener más de 3 líneas.';
  end if;

  v_id := 'ord-' || lpad(nextval('public.order_id_seq')::text, 4, '0');

  insert into public.orders (id, customer_name, note, status, total, device_id)
  values (
    v_id,
    coalesce(trim(p_customer_name), ''),
    coalesce(trim(p_note), ''),
    'recibido',
    0,
    coalesce(trim(p_device_id), '')
  );

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_qty := coalesce((v_item->>'quantity')::integer, 0);
    if v_qty < 1 then
      raise exception 'Cada producto necesita quantity entera mayor a 0.';
    end if;
    select * into v_product from public.products where id = v_item->>'productId';
    if not found then
      raise exception 'Uno de los productos de tu carrito ya no está disponible.';
    end if;
    if v_product.available is false then
      raise exception 'Uno de los productos de tu carrito ya no está disponible.';
    end if;
    v_qty_total := v_qty_total + v_qty;
    if v_qty_total > 3 then
      raise exception 'Máximo 3 productos por pedido.';
    end if;
    insert into public.order_items (order_id, product_id, name, quantity, unit_price, line_total, image_url)
    values (
      v_id,
      v_product.id,
      v_product.name,
      v_qty,
      v_product.price,
      v_product.price * v_qty,
      v_product.image_url
    );
    v_total := v_total + v_product.price * v_qty;
  end loop;

  update public.orders set total = v_total where id = v_id;

  select jsonb_build_object(
    'id', o.id,
    'createdAt', o.created_at,
    'customerName', o.customer_name,
    'note', o.note,
    'status', o.status,
    'total', o.total,
    'deviceId', o.device_id,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'productId', i.product_id,
        'name', i.name,
        'quantity', i.quantity,
        'unitPrice', i.unit_price,
        'lineTotal', i.line_total,
        'imageUrl', i.image_url
      ))
      from public.order_items i
      where i.order_id = o.id
    ), '[]'::jsonb)
  )
  into v_result
  from public.orders o
  where o.id = v_id;

  return v_result;
end;
$$;

grant execute on function public.create_cafetec_order(text, text, jsonb, text) to anon, authenticated;
