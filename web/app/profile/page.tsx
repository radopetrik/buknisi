import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { updateProfile } from './actions'
import Header from '../components/Header'
import ProfileView from './ProfileView'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: cities } = await supabase
    .from('cities')
    .select('id, name')
    .order('name')

  // Fetch bookings with invoices
  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      *,
      company:companies(name, slug, address_text, city:cities(slug), category:categories(slug)),
      service:services(name, price, duration, price_type),
      staff:staff(full_name),
      invoice:invoices(*)
    `)
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .order('time_from', { ascending: false })

  return (
    <>
    <Header user={user} />
    <main className="section">
      <h1 className="section-title">Môj profil</h1>
      <ProfileView 
        user={user} 
        profile={profile} 
        cities={cities || []}
        bookings={bookings || []} 
        updateProfileAction={updateProfile}
      />
    </main>
    </>
  )
}
