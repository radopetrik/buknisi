'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const first_name = formData.get('first_name') as string
  const last_name = formData.get('last_name') as string
  const phone = formData.get('phone') as string
  const preferred_city_id_raw = formData.get('preferred_city_id')
  const preferred_city_id = preferred_city_id_raw ? String(preferred_city_id_raw) : null
  
  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      first_name,
      last_name,
      phone,
      email: user.email,
      preferred_city_id: preferred_city_id === '' ? null : preferred_city_id,
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/profile')
  return { success: true }
}
