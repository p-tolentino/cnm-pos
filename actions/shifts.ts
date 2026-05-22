"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type Shift = {
  id: string
  cashier_name: string
  start_time: string
  end_time: string | null
}

export async function getActiveShift(): Promise<Shift | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("shifts")
    .select("*")
    .is("end_time", null)
    .order("start_time", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error("Error fetching active shift:", error)
    return null
  }
  return data
}

export async function openShift(
  formData: FormData
): Promise<{ success: boolean; shift?: Shift }> {
  const supabase = await createClient()

  const cashierName = formData.get("cashierName") as string
  if (!cashierName) return { success: false }

  const { data, error } = await supabase
    .from("shifts")
    .insert({ cashier_name: cashierName, start_time: new Date().toISOString() })
    .select()
    .single()

  if (error) return { success: false }

  revalidatePath("/")
  return { success: true, shift: data }
}

export async function closeShift(
  shiftId: string
): Promise<{ success: boolean }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("shifts")
    .update({ end_time: new Date().toISOString() })
    .eq("id", shiftId)

  if (error) return { success: false }

  revalidatePath("/")
  return { success: true }
}
