"use server"

import { createClient } from "@/lib/supabase/server"

export async function validateEmployeePin(
  pin: string
): Promise<{ valid: boolean; employee?: { id: string; name: string } }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("employees")
    .select("id, first_name")
    .eq("pin", pin)
    .maybeSingle()

  if (error || !data) return { valid: false }
  return { valid: true, employee: { id: data.id, name: data.first_name } }
}
