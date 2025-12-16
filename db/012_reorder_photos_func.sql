CREATE OR REPLACE FUNCTION reorder_photos(p_company_id uuid, p_photo_ids uuid[])
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_id uuid;
  v_idx integer;
BEGIN
  -- Pass 1: Set ordering to negative values to avoid collisions
  -- using -1000 - index to be safe and far from 0
  FOR v_idx IN 1 .. array_length(p_photo_ids, 1) LOOP
    v_id := p_photo_ids[v_idx];
    UPDATE photos 
    SET ordering = -1000 - v_idx
    WHERE id = v_id AND company_id = p_company_id;
  END LOOP;

  -- Pass 2: Set ordering to desired 0-based index
  FOR v_idx IN 1 .. array_length(p_photo_ids, 1) LOOP
    v_id := p_photo_ids[v_idx];
    UPDATE photos 
    SET ordering = v_idx - 1
    WHERE id = v_id AND company_id = p_company_id;
  END LOOP;
END;
$$;
