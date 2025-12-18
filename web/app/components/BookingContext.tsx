'use client'

import React, { createContext, useContext, useState } from 'react'

export type BookingServiceItem = {
    serviceId: string
    name: string
    price: number
    duration: number
    addons: {
        addonId: string
        name: string
        price: number
        duration: number
        count: number
    }[]
}

type BookingState = {
    isOpen: boolean
    company: any | null
    services: BookingServiceItem[]
    date: Date | undefined
    time: string | null
    note: string
    isAuthModalOpen: boolean
}

type BookingContextType = {
    state: BookingState
    openBooking: (company: any, initialService?: any) => void
    closeBooking: () => void
    addService: (service: any) => void
    removeService: (serviceId: string) => void
    updateServiceAddon: (serviceId: string, addon: any, change: number) => void
    setDate: (date: Date | undefined) => void
    setTime: (time: string | null) => void
    setNote: (note: string) => void
    setAuthModalOpen: (isOpen: boolean) => void
    reset: () => void
}

const BookingContext = createContext<BookingContextType | undefined>(undefined)

export function BookingProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<BookingState>({
        isOpen: false,
        company: null,
        services: [],
        date: undefined,
        time: null,
        note: '',
        isAuthModalOpen: false
    })

    const openBooking = (company: any, initialService?: any) => {
        setState(prev => {
            // If opening for a different company, reset
            if (prev.company?.id !== company.id) {
                const services = initialService ? [{
                    serviceId: initialService.id,
                    name: initialService.name,
                    price: initialService.price,
                    duration: initialService.duration,
                    addons: []
                }] : []
                return {
                    ...prev,
                    isOpen: true,
                    company,
                    services,
                    date: undefined,
                    time: null,
                    note: ''
                }
            }
            
            // If same company, just open (and maybe add service)
            let newServices = [...prev.services]
            if (initialService) {
                const exists = newServices.find(s => s.serviceId === initialService.id)
                if (!exists) {
                    newServices.push({
                        serviceId: initialService.id,
                        name: initialService.name,
                        price: initialService.price,
                        duration: initialService.duration,
                        addons: []
                    })
                }
            }

            return {
                ...prev,
                isOpen: true,
                services: newServices
            }
        })
    }

    const closeBooking = () => {
        setState(prev => ({ ...prev, isOpen: false }))
    }

    const reset = () => {
        setState({
            isOpen: false,
            company: null,
            services: [],
            date: undefined,
            time: null,
            note: '',
            isAuthModalOpen: false
        })
    }

    const addService = (service: any) => {
        setState(prev => {
            const exists = prev.services.find(s => s.serviceId === service.id)
            if (exists) return prev // already added

            return {
                ...prev,
                services: [...prev.services, {
                    serviceId: service.id,
                    name: service.name,
                    price: service.price,
                    duration: service.duration,
                    addons: []
                }]
            }
        })
    }

    const removeService = (serviceId: string) => {
        setState(prev => ({
            ...prev,
            services: prev.services.filter(s => s.serviceId !== serviceId)
        }))
    }

    const updateServiceAddon = (serviceId: string, addon: any, change: number) => {
        setState(prev => {
            const newServices = prev.services.map(s => {
                if (s.serviceId !== serviceId) return s

                const existingAddonIndex = s.addons.findIndex(a => a.addonId === addon.id)
                let newAddons = [...s.addons]

                if (existingAddonIndex >= 0) {
                    const currentCount = newAddons[existingAddonIndex].count
                    const newCount = currentCount + change
                    if (newCount <= 0) {
                        newAddons.splice(existingAddonIndex, 1)
                    } else {
                        newAddons[existingAddonIndex] = { ...newAddons[existingAddonIndex], count: newCount }
                    }
                } else if (change > 0) {
                    newAddons.push({
                        addonId: addon.id,
                        name: addon.name,
                        price: addon.price,
                        duration: addon.duration,
                        count: change
                    })
                }

                return { ...s, addons: newAddons }
            })

            return { ...prev, services: newServices }
        })
    }

    const setDate = (date: Date | undefined) => setState(prev => ({ ...prev, date }))
    const setTime = (time: string | null) => setState(prev => ({ ...prev, time }))
    const setNote = (note: string) => setState(prev => ({ ...prev, note }))
    const setAuthModalOpen = (isOpen: boolean) => setState(prev => ({ ...prev, isAuthModalOpen: isOpen }))

    return (
        <BookingContext.Provider value={{
            state,
            openBooking,
            closeBooking,
            addService,
            removeService,
            updateServiceAddon,
            setDate,
            setTime,
            setNote,
            setAuthModalOpen,
            reset
        }}>
            {children}
        </BookingContext.Provider>
    )
}

export function useBooking() {
    const context = useContext(BookingContext)
    if (context === undefined) {
        throw new Error('useBooking must be used within a BookingProvider')
    }
    return context
}
