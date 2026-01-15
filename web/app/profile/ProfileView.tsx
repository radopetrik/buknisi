'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format, parseISO, startOfDay } from 'date-fns'
import { sk } from 'date-fns/locale'

type City = { id: string; name: string }

type ProfileViewProps = {
  user: any
  profile: any
  cities: City[]
  bookings: any[]
  updateProfileAction: (formData: FormData) => Promise<{ error?: string; success?: boolean }>
}

export default function ProfileView({ user, profile, cities, bookings, updateProfileAction }: ProfileViewProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'bookings' | 'invoices'>('bookings')
  const [isPending, setIsPending] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  const now = new Date()
  const today = startOfDay(now)

  const upcomingBookings = bookings?.filter(b => {
    const bDate = parseISO(b.date)
    if (bDate > today) return true
    if (bDate.getTime() === today.getTime()) {
        const [h, m] = b.time_from.split(':').map(Number)
        const bTime = new Date(today)
        bTime.setHours(h, m, 0)
        return bTime >= now
    }
    return false
  }) || []
  
  upcomingBookings.sort((a, b) => {
      const dateA = parseISO(a.date).getTime() + parseInt(a.time_from.split(':')[0])*3600000 + parseInt(a.time_from.split(':')[1])*60000
      const dateB = parseISO(b.date).getTime() + parseInt(b.time_from.split(':')[0])*3600000 + parseInt(b.time_from.split(':')[1])*60000
      return dateA - dateB
  })

  const pastBookings = bookings?.filter(b => !upcomingBookings.includes(b)) || []
  
  // Filter bookings that have invoices
  const invoices = bookings.filter(b => b.invoice).map(b => ({
      ...b.invoice,
      service_name: b.service?.name,
      date: b.date,
      booking_id: b.id
  }))

  async function handleUpdateProfile(formData: FormData) {
      setIsPending(true)
      setMessage(null)
      const res = await updateProfileAction(formData)
      setIsPending(false)
      if (res.error) {
          setMessage({ text: res.error, type: 'error' })
      } else {
          setMessage({ text: 'Údaje boli úspešne uložené', type: 'success' })
      }
  }

  return (
    <div className="profile-container">
        {/* Sidebar / Tabs */}
        <div className="profile-tabs">
            <button 
                className={`tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
                onClick={() => setActiveTab('bookings')}
            >
                Rezervácie
            </button>
            <button 
                className={`tab-btn ${activeTab === 'invoices' ? 'active' : ''}`}
                onClick={() => setActiveTab('invoices')}
            >
                Faktúry
            </button>
            <button 
                className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
                onClick={() => setActiveTab('info')}
            >
                Osobné údaje
            </button>
        </div>

        {/* Content Area */}
        <div className="profile-content">
            {activeTab === 'info' && (
                <div className="panel">
                    <h2 className="panel-title">Osobné údaje</h2>
                    <form action={handleUpdateProfile} className="register-form">
                        <div className="form-group">
                            <label>Meno</label>
                            <input name="first_name" defaultValue={profile?.first_name || ''} placeholder="Janko" required />
                        </div>
                        <div className="form-group">
                            <label>Priezvisko</label>
                            <input name="last_name" defaultValue={profile?.last_name || ''} placeholder="Hrasko" required />
                        </div>
                        <div className="form-group">
                            <label>Telefón</label>
                            <input name="phone" defaultValue={profile?.phone || ''} placeholder="+421 900 000 000" />
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input type="email" value={user.email} disabled className="input-disabled" />
                        </div>
                        <div className="form-group">
                            <label>Preferované mesto</label>
                            <select name="preferred_city_id" defaultValue={profile?.preferred_city_id || ''}>
                                <option value="">—</option>
                                {cities.map((city) => (
                                    <option key={city.id} value={city.id}>{city.name}</option>
                                ))}
                            </select>
                        </div>
                        {message && (
                            <div style={{ 
                                padding: '10px', 
                                marginBottom: '10px', 
                                borderRadius: '4px',
                                background: message.type === 'success' ? '#e6f4ea' : '#fce8e6',
                                color: message.type === 'success' ? '#1e7e34' : '#d93025'
                            }}>
                                {message.text}
                            </div>
                        )}
                        <button type="submit" className="btn-primary" disabled={isPending}>
                            {isPending ? 'Ukladám...' : 'Uložiť zmeny'}
                        </button>
                    </form>
                </div>
            )}

            {activeTab === 'bookings' && (
                <div className="bookings-section">
                    <section>
                        <h2 className="section-title-sm">Nadchádzajúce</h2>
                        {upcomingBookings.length === 0 ? (
                            <p className="empty-state">Nemáte žiadne nadchádzajúce rezervácie.</p>
                        ) : (
                            <div className="bookings-list">
                                {upcomingBookings.map(booking => (
                                    <BookingCard key={booking.id} booking={booking} isPast={false} />
                                ))}
                            </div>
                        )}
                    </section>

                    <section style={{ marginTop: '40px' }}>
                        <h2 className="section-title-sm text-muted">História</h2>
                        {pastBookings.length === 0 ? (
                            <p className="empty-state">História je prázdna.</p>
                        ) : (
                            <div className="bookings-list">
                                {pastBookings.map(booking => (
                                    <BookingCard key={booking.id} booking={booking} isPast={true} />
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            )}

            {activeTab === 'invoices' && (
                <div className="invoices-section">
                    <h2 className="section-title-sm">Faktúry</h2>
                    {invoices.length === 0 ? (
                        <p className="empty-state">Nemáte žiadne faktúry.</p>
                    ) : (
                        <div className="table-responsive">
                            <table className="invoices-table">
                                <thead>
                                    <tr>
                                        <th>Dátum</th>
                                        <th>Služba</th>
                                        <th>Suma</th>
                                        <th>Stav</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoices.map((inv: any) => (
                                        <tr key={inv.id}>
                                            <td>{format(parseISO(inv.created_at), 'd. M. yyyy', { locale: sk })}</td>
                                            <td>{inv.service_name}</td>
                                            <td className="font-bold">{Number(inv.amount).toFixed(2)} €</td>
                                            <td>
                                                <span className="badge-paid">Uhradené</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>

        <style jsx>{`
            .profile-container {
                display: grid;
                grid-template-columns: 250px 1fr;
                gap: 40px;
                align-items: start;
            }
            @media (max-width: 768px) {
                .profile-container {
                    grid-template-columns: 1fr;
                }
            }
            .profile-tabs {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            .tab-btn {
                text-align: left;
                padding: 12px 20px;
                background: transparent;
                border: 1px solid transparent;
                border-radius: 8px;
                font-size: 16px;
                cursor: pointer;
                transition: all 0.2s;
                color: #555;
            }
            .tab-btn:hover {
                background: #f5f5f5;
                color: #000;
            }
            .tab-btn.active {
                background: #fff;
                border-color: #eee;
                box-shadow: 0 2px 8px rgba(0,0,0,0.05);
                font-weight: 600;
                color: #000;
            }
            .section-title-sm {
                font-size: 20px;
                margin-bottom: 20px;
                font-family: 'Playfair Display', serif;
            }
            .text-muted {
                color: #999;
            }
            .empty-state {
                color: #777;
                font-style: italic;
            }
            .bookings-list {
                display: flex;
                flex-direction: column;
                gap: 15px;
            }
            .input-disabled {
                background: #f5f5f5;
                color: #888;
                border: 1px solid #ddd;
            }
            
            /* Invoices Table */
            .table-responsive {
                overflow-x: auto;
            }
            .invoices-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 14px;
            }
            .invoices-table th {
                text-align: left;
                padding: 12px;
                border-bottom: 2px solid #eee;
                color: #777;
                font-weight: 600;
            }
            .invoices-table td {
                padding: 12px;
                border-bottom: 1px solid #eee;
            }
            .invoices-table tr:last-child td {
                border-bottom: none;
            }
            .font-bold {
                font-weight: 700;
            }
            .badge-paid {
                display: inline-block;
                padding: 4px 8px;
                background: #e6f4ea;
                color: #1e7e34;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 600;
            }
        `}</style>
    </div>
  )
}

function BookingCard({ booking, isPast }: { booking: any, isPast: boolean }) {
    const date = parseISO(booking.date)
    const formattedDate = format(date, 'd. MMMM yyyy', { locale: sk })
    const time = booking.time_from.substring(0, 5)

    return (
        <div className="rec-card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: isPast ? 0.7 : 1, background: '#fff', border: '1px solid #eee', borderRadius: '8px' }}>
            <div>
                <div style={{ marginBottom: '4px', color: '#d4a373', fontWeight: '700', fontSize: '13px', textTransform: 'uppercase' }}>
                    {formattedDate} • {time}
                </div>
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '18px', marginBottom: '6px' }}>
                    {booking.service?.name || 'Neznáma služba'}
                </h3>
                <div style={{ fontSize: '14px', color: '#555' }}>
                    {booking.company?.name} • {booking.staff?.full_name || 'Pracovník'}
                </div>
                <div style={{ fontSize: '13px', color: '#999', marginTop: '4px' }}>
                    {booking.company?.address_text}
                </div>
            </div>
            <div style={{ textAlign: 'right' }}>
                 <div style={{ fontWeight: '700', fontSize: '18px', color: '#2c2c2c' }}>
                    {booking.service?.price} €
                 </div>
                 {/* Link to company detail */}
                 {booking.company?.slug && booking.company?.city?.slug && booking.company?.category?.slug && (
                    <Link href={`/${booking.company.city.slug}/${booking.company.category.slug}/c/${booking.company.slug}`} className="btn-ghost-sm" style={{ display: 'inline-block', marginTop: '10px', fontSize: '12px', padding: '6px 12px', background: '#f9f9f9', borderRadius: '4px', color: '#333', textDecoration: 'none' }}>
                        Detail
                    </Link>
                 )}
            </div>
        </div>
    )
}
