import { supabase } from '@/lib/supabase';

type TableName = keyof import('@/lib/supabase').Database['public']['Tables'];
type RowOf<T extends TableName> = import('@/lib/supabase').Database['public']['Tables'][T]['Row'];

export async function listRows<T extends TableName>(table: T): Promise<RowOf<T>[]> {
  const { data, error } = await supabase.from(table).select('*');
  if (error) throw error;
  return data as RowOf<T>[];
}

export async function getRowById<T extends TableName>(table: T, id: string | number): Promise<RowOf<T> | null> {
  const { data, error } = await supabase.from(table).select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? (data as RowOf<T>) : null;
}

export async function insertRow<T extends TableName>(table: T, payload: Partial<RowOf<T>>): Promise<RowOf<T>> {
  const { data, error } = await supabase.from(table).insert(payload as Record<string, unknown>).select('*').single();
  if (error) throw error;
  return data as RowOf<T>;
}

export async function updateRow<T extends TableName>(table: T, id: string | number, payload: Partial<RowOf<T>>): Promise<RowOf<T>> {
  const { data, error } = await supabase.from(table).update(payload as Record<string, unknown>).eq('id', id).select('*').single();
  if (error) throw error;
  return data as RowOf<T>;
}

export async function deleteRow<T extends TableName>(table: T, id: string | number): Promise<void> {
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw error;
}

const crud = {
  listRows,
  getRowById,
  insertRow,
  updateRow,
  deleteRow,
};

export default crud;