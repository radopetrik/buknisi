'use client'

import { useBooking } from './BookingContext'

export function BookHeroBtn({ company }: { company: any }) {
    const { openBooking } = useBooking()
    
    return (
        <button 
            className="btn-primary" 
            onClick={(e) => {
                e.preventDefault()
                openBooking(company)
            }}
        >
            Rezervovať
        </button>
    )
}

export function ServiceRow({ service, company }: { service: any, company: any }) {
    const { openBooking } = useBooking()

    return (
        <div className="service-row" onClick={() => openBooking(company, service)} style={{cursor: 'pointer'}}>
            <div className="service-left">
                <span className="service-title">{service.name}</span>
                {service.description && <span className="service-desc">{service.description}</span>}
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                <div>
                    {service.price && <div className="price">{service.price}€</div>}
                    {service.duration && <div className="duration">{service.duration} min</div>}
                </div>
                <button className="btn-ghost-sm" style={{fontSize:'12px', padding:'4px 10px'}}>
                    Rezervovať
                </button>
            </div>
        </div>
    )
}
