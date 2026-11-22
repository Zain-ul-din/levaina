/** Returns a Supabase result's data, or throws its error with a label saying where it came from. */
export function unwrap<T>({ data, error }: { data: T; error: { message: string } | null }, label = "Database"): T {
  if (error) throw new Error(`${label}: ${error.message}`);
  return data;
}
