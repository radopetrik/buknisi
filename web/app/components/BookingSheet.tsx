'use client'

import { useState, useEffect, useCallback } from 'react'
import { useBooking } from './BookingContext'
import { createBooking, getServiceAddons, getAvailableSlots } from '../actions/booking'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'
import { format } from 'date-fns'
import { sk } from 'date-fns/locale'

export default function BookingSheet() {
    const { state, closeBooking, addService, removeService, updateServiceAddon, setDate, setTime, setNote, setAuthModalOpen } = useBooking()
    const [step, setStep] = useState(1) // 1: Services, 2: Date/Time, 3: Confirm
    const [availableSlots, setAvailableSlots] = useState<string[]>([])
    const [loadingSlots, setLoadingSlots] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [expandedService, setExpandedService] = useState<string | null>(null)
    const [addonsMap, setAddonsMap] = useState<Record<string, any[]>>({})
    const [showAddService, setShowAddService] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)

    // Reset step when opening
    useEffect(() => {
        if (state.isOpen) {
            setStep(1)
            setShowAddService(false)
            setIsSuccess(false)
        }
    }, [state.isOpen])

    // Load addons when services change or expand
    useEffect(() => {
        state.services.forEach(async (s) => {
            if (!addonsMap[s.serviceId]) {
                const addons = await getServiceAddons(s.serviceId)
                setAddonsMap(prev => ({ ...prev, [s.serviceId]: addons }))
            }
        })
    }, [state.services, addonsMap])

    const calculateDuration = useCallback(() => {
        return state.services.reduce((acc, s) => {
            const addonsTime = s.addons.reduce((sum, a) => sum + (a.duration * a.count), 0)
            return acc + s.duration + addonsTime
        }, 0)
    }, [state.services])

    // Fetch slots
    useEffect(() => {
        if (state.date && state.company && step === 2) {
            setLoadingSlots(true)
            const duration = calculateDuration()
            getAvailableSlots(state.company.id, format(state.date, 'yyyy-MM-dd'), duration)
                .then(slots => {
                    setAvailableSlots(slots)
                    setLoadingSlots(false)
                })
        }
    }, [state.date, state.company, step, calculateDuration])

    const calculateTotal = () => {
        return state.services.reduce((acc, s) => {
            const addonsCost = s.addons.reduce((sum, a) => sum + (a.price * a.count), 0)
            return acc + s.price + addonsCost
        }, 0)
    }

    const handleBooking = async () => {
        setIsSubmitting(true)
        const result = await createBooking({
            companyId: state.company.id,
            date: format(state.date!, 'yyyy-MM-dd'),
            time: state.time,
            note: state.note,
            services: state.services
        })

        setIsSubmitting(false)

        if (result.error === 'Not authenticated') {
            setAuthModalOpen(true)
        } else if (result.success) {
            setIsSuccess(true)
        } else {
            alert('Chyba pri rezervácii: ' + result.error)
        }
    }

    // Filter available services that are not yet selected
    const availableServices = state.company?.services?.filter(
        (s: any) => !state.services.find(sel => sel.serviceId === s.id)
    ) || []

    if (!state.isOpen) return null

    if (isSuccess) {
        return (
            <>
                <div className="sheet-overlay" onClick={closeBooking}></div>
                <div className="sheet-content">
                    <div className="sheet-header">
                        <h2>Hotovo</h2>
                        <button className="close-btn" onClick={closeBooking}>×</button>
                    </div>
                    <div className="sheet-body" style={{display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', height:'100%'}}>
                        <div style={{
                            width: '80px', height: '80px', borderRadius: '50%', background: '#4cd964', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px',
                            boxShadow: '0 4px 15px rgba(76, 217, 100, 0.3)'
                        }}>
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </div>
                        <h3 style={{marginBottom:'10px'}}>Rezervácia úspešná!</h3>
                        <p style={{color:'#777', marginBottom:'30px', maxWidth:'80%'}}>
                            Vaša rezervácia bola úspešne vytvorená. Potvrdenie vám príde čoskoro na email.
                        </p>
                        <button className="btn-primary full-width" onClick={closeBooking}>
                            Zavrieť
                        </button>
                    </div>
                </div>
                <style jsx>{`
                .sheet-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.3);
                    z-index: 1000;
                    backdrop-filter: blur(2px);
                }
                .sheet-content {
                    position: fixed;
                    top: 0;
                    right: 0;
                    bottom: 0;
                    width: 100%;
                    max-width: 450px;
                    background: white;
                    z-index: 1001;
                    box-shadow: -5px 0 30px rgba(0,0,0,0.1);
                    display: flex;
                    flex-direction: column;
                    animation: slideIn 0.3s ease-out;
                }
                .sheet-header {
                    padding: 20px;
                    border-bottom: 1px solid #eee;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .sheet-body {
                    flex: 1;
                    overflow-y: auto;
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                }
                .close-btn {
                    background: none;
                    border: none;
                    font-size: 28px;
                    cursor: pointer;
                    color: #999;
                }
                .full-width { width: 100%; }
                .btn-primary { background: var(--primary-color); color: white; border: none; padding: 12px 22px; border-radius: 28px; font-weight: 700; cursor: pointer; text-decoration: none; }
                @keyframes slideIn {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
            `}</style>
            </>
        )
    }

    return (
        <>
            <div className="sheet-overlay" onClick={closeBooking}></div>
            <div className="sheet-content">
                <div className="sheet-header">
                    <h2>Rezervácia</h2>
                    <button className="close-btn" onClick={closeBooking}>×</button>
                </div>

                <div className="sheet-body">
                    {/* Progress Steps */}
                    <div className="steps">
                        <div className={`step ${step >= 1 ? 'active' : ''}`} onClick={() => setStep(1)}>1. Služby</div>
                        <div className={`step ${step >= 2 ? 'active' : ''}`} onClick={() => step > 1 && setStep(2)}>2. Termín</div>
                        <div className={`step ${step >= 3 ? 'active' : ''}`} onClick={() => step > 2 && setStep(3)}>3. Potvrdenie</div>
                    </div>

                    {step === 1 && (
                        <div className="step-content">
                            <h3>Vybrané služby</h3>
                            {state.services.length === 0 ? (
                                <p className="empty-msg">Zatiaľ ste nevybrali žiadne služby.</p>
                            ) : (
                                <div className="selected-services">
                                    {state.services.map((s, idx) => {
                                        const hasAddons = addonsMap[s.serviceId] && addonsMap[s.serviceId].length > 0
                                        return (
                                        <div key={idx} className="service-card">
                                            <div className="service-header">
                                                <div className="s-info">
                                                    <h4>{s.name}</h4>
                                                    <span>{s.duration} min • {s.price}€</span>
                                                </div>
                                                <button className="remove-btn" onClick={() => removeService(s.serviceId)}>Odstrániť</button>
                                            </div>
                                            
                                            {/* Addons Section */}
                                            {hasAddons && (
                                                <div className="addons-section">
                                                    <button className="toggle-addons" onClick={() => setExpandedService(expandedService === s.serviceId ? null : s.serviceId)}>
                                                        {expandedService === s.serviceId ? 'Skryť doplnkové služby' : 'Pridať doplnkové služby'}
                                                    </button>
                                                    
                                                    {expandedService === s.serviceId && (
                                                        <div className="addons-list">
                                                            {addonsMap[s.serviceId].map(addon => {
                                                                const current = s.addons.find(a => a.addonId === addon.id)?.count || 0
                                                                return (
                                                                    <div key={addon.id} className="addon-row">
                                                                        <span>{addon.name} (+{addon.price}€)</span>
                                                                        <div className="counter">
                                                                            <button onClick={() => updateServiceAddon(s.serviceId, addon, -1)} disabled={current === 0}>-</button>
                                                                            <span>{current}</span>
                                                                            <button onClick={() => updateServiceAddon(s.serviceId, addon, 1)}>+</button>
                                                                        </div>
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )})}
                                </div>
                            )}

                            {/* Add More Services Section */}
                            <div className="add-more-section">
                                {!showAddService ? (
                                    <button className="btn-secondary full-width" onClick={() => setShowAddService(true)}>
                                        + Pridať ďalšiu službu
                                    </button>
                                ) : (
                                    <div className="available-services-list">
                                        <h4>Dostupné služby</h4>
                                        {availableServices.length === 0 ? (
                                            <p className="small-msg">Žiadne ďalšie služby na výber.</p>
                                        ) : (
                                            availableServices.map((s: any) => (
                                                <div key={s.id} className="avail-service-row" onClick={() => {
                                                    addService(s)
                                                    setShowAddService(false)
                                                }}>
                                                    <div className="as-info">
                                                        <span className="as-name">{s.name}</span>
                                                        <span className="as-meta">{s.duration} min • {s.price}€</span>
                                                    </div>
                                                    <button className="add-btn-small">+</button>
                                                </div>
                                            ))
                                        )}
                                        <button className="cancel-add-btn" onClick={() => setShowAddService(false)}>Zrušiť výber</button>
                                    </div>
                                )}
                            </div>

                            <button className="btn-primary full-width" style={{marginTop: '20px'}} disabled={state.services.length === 0} onClick={() => setStep(2)}>Pokračovať na výber termínu</button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="step-content">
                            <h3>Vyberte dátum a čas</h3>
                            <div className="calendar-wrapper">
                                <DayPicker
                                    mode="single"
                                    selected={state.date}
                                    onSelect={setDate}
                                    locale={sk}
                                    disabled={{ before: new Date() }}
                                    className="rdp-custom"
                                />
                            </div>

                            {state.date && (
                                <div className="time-slots">
                                    <h4>Voľné termíny pre {format(state.date, 'd. MMMM', { locale: sk })}</h4>
                                    {loadingSlots ? (
                                        <div className="loader">Načítavam termíny...</div>
                                    ) : availableSlots.length > 0 ? (
                                        <div className="slots-grid">
                                            {availableSlots.map(slot => (
                                                <button 
                                                    key={slot} 
                                                    className={`slot-btn ${state.time === slot ? 'active' : ''}`}
                                                    onClick={() => setTime(slot)}
                                                >
                                                    {slot}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="empty-msg">Žiadne voľné termíny na tento deň.</div>
                                    )}
                                </div>
                            )}
                            <button className="btn-primary full-width" disabled={!state.date || !state.time} onClick={() => setStep(3)}>Pokračovať</button>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="step-content">
                            <h3>Zhrnutie rezervácie</h3>
                            <div className="summary-card">
                                <div className="summary-row">
                                    <span>Salón:</span>
                                    <strong>{state.company.name}</strong>
                                </div>
                                <div className="summary-row">
                                    <span>Dátum:</span>
                                    <strong>{state.date && format(state.date, 'dd.MM.yyyy')} {state.time}</strong>
                                </div>
                                <div className="summary-row">
                                    <span>Služby:</span>
                                    <div style={{textAlign:'right'}}>
                                        {state.services.map(s => (
                                            <div key={s.serviceId}>{s.name}</div>
                                        ))}
                                    </div>
                                </div>
                                <div className="total-row">
                                    <span>Spolu:</span>
                                    <span>{calculateTotal()}€ ({calculateDuration()} min)</span>
                                </div>
                            </div>

                            <div className="note-section">
                                <label>Poznámka pre salón (nepovinné)</label>
                                <textarea 
                                    value={state.note} 
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="Mám alergiu na..."
                                ></textarea>
                            </div>

                            <button className="btn-primary full-width" onClick={handleBooking} disabled={isSubmitting}>
                                {isSubmitting ? 'Odosielam...' : `Rezervovať termín`}
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <style jsx>{`
                .sheet-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.3);
                    z-index: 1000;
                    backdrop-filter: blur(2px);
                }
                .sheet-content {
                    position: fixed;
                    top: 0;
                    right: 0;
                    bottom: 0;
                    width: 100%;
                    max-width: 450px;
                    background: white;
                    z-index: 1001;
                    box-shadow: -5px 0 30px rgba(0,0,0,0.1);
                    display: flex;
                    flex-direction: column;
                    animation: slideIn 0.3s ease-out;
                }
                .sheet-header {
                    padding: 20px;
                    border-bottom: 1px solid #eee;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .sheet-body {
                    flex: 1;
                    overflow-y: auto;
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                }
                .close-btn {
                    background: none;
                    border: none;
                    font-size: 28px;
                    cursor: pointer;
                    color: #999;
                }
                .steps {
                    display: flex;
                    margin-bottom: 24px;
                    border-bottom: 2px solid #f0f0f0;
                }
                .step {
                    flex: 1;
                    text-align: center;
                    padding: 10px;
                    font-size: 14px;
                    font-weight: 600;
                    color: #ccc;
                    cursor: pointer;
                    position: relative;
                }
                .step.active {
                    color: var(--primary-color);
                }
                .step.active::after {
                    content: '';
                    position: absolute;
                    bottom: -2px;
                    left: 0;
                    right: 0;
                    height: 2px;
                    background: var(--primary-color);
                }
                .service-card {
                    border: 1px solid #eee;
                    border-radius: 8px;
                    padding: 12px;
                    margin-bottom: 12px;
                }
                .service-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                }
                .s-info h4 { margin: 0 0 4px; font-size: 15px; }
                .s-info span { font-size: 13px; color: #888; }
                .remove-btn { color: #ff4444; background: none; border: none; font-size: 12px; cursor: pointer; text-decoration: underline; }
                .toggle-addons {
                    margin-top: 8px;
                    background: none;
                    border: none;
                    color: var(--primary-color);
                    font-size: 13px;
                    cursor: pointer;
                    font-weight: 600;
                }
                .addons-list {
                    background: #f9f9f9;
                    padding: 10px;
                    border-radius: 6px;
                    margin-top: 8px;
                }
                .addon-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 13px;
                    margin-bottom: 6px;
                }
                .counter {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: white;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                }
                .counter button { width: 24px; height: 24px; border: none; background: none; cursor: pointer; font-weight: bold; }
                .slots-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 10px;
                    margin-top: 12px;
                    margin-bottom: 24px;
                }
                .slot-btn {
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    background: white;
                    cursor: pointer;
                }
                .slot-btn.active {
                    background: var(--primary-color);
                    color: white;
                    border-color: var(--primary-color);
                }
                .summary-card {
                    background: #f9f9f9;
                    padding: 16px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                }
                .summary-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 10px;
                    font-size: 14px;
                }
                .total-row {
                    display: flex;
                    justify-content: space-between;
                    border-top: 1px dashed #ccc;
                    padding-top: 10px;
                    margin-top: 10px;
                    font-weight: bold;
                    font-size: 16px;
                }
                .note-section textarea {
                    width: 100%;
                    height: 80px;
                    margin-top: 6px;
                    margin-bottom: 20px;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                }
                .full-width { width: 100%; }
                
                .add-more-section { margin-top: 10px; margin-bottom: 10px; }
                .btn-secondary { background: white; color: var(--primary-color); border: 1px dashed var(--primary-color); padding: 10px; border-radius: 8px; cursor: pointer; font-weight: 600; }
                .available-services-list { background: #fdfdfd; border: 1px solid #eee; border-radius: 8px; padding: 10px; margin-top: 10px; }
                .avail-service-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px dashed #eee; cursor: pointer; }
                .avail-service-row:last-child { border-bottom: none; }
                .as-info { display: flex; flex-direction: column; }
                .as-name { font-weight: 600; font-size: 14px; }
                .as-meta { font-size: 12px; color: #888; }
                .add-btn-small { background: var(--primary-color); color: white; border: none; width: 24px; height: 24px; border-radius: 50%; font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
                .cancel-add-btn { background: none; border: none; color: #999; font-size: 12px; margin-top: 8px; cursor: pointer; width: 100%; text-align: center; }
                .small-msg { color: #999; font-size: 13px; text-align: center; padding: 10px; }

                @keyframes slideIn {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
            `}</style>
        </>
    )
}
