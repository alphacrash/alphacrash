import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabase: SupabaseClient | null = null

function getSupabase(): SupabaseClient {
  if (!supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ''
    if (!url || !key) {
      throw new Error('Supabase credentials not configured')
    }
    supabase = createClient(url, key)
  }
  return supabase
}

export interface SyncResult {
  success: boolean
  error?: string
  data?: unknown
}

/** Push tasks JSON to Supabase (password-protected via RPC) */
export async function syncPush(password: string, data: unknown): Promise<SyncResult> {
  try {
    const client = getSupabase()
    const { data: result, error } = await client.rpc('sync_push', {
      p_password: password,
      p_data: data,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    // result is boolean: true = success, false = wrong password
    if (result === true) {
      return { success: true }
    }

    return { success: false, error: 'Wrong password' }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Network error',
    }
  }
}

/** Pull tasks JSON from Supabase (password-protected via RPC) */
export async function syncPull(password: string): Promise<SyncResult> {
  try {
    const client = getSupabase()
    const { data: result, error } = await client.rpc('sync_pull', {
      p_password: password,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    // result is null when password is wrong or no data
    if (result === null) {
      return { success: false, error: 'Wrong password' }
    }

    return { success: true, data: result }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Network error',
    }
  }
}
