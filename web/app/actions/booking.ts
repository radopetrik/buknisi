'use server'

import { createClient } from '@/utils/supabase/server'
import { addMinutes, format, parse, isBefore, isAfter, isEqual } from 'date-fns'

export async function getServiceAddons(serviceId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('service_addons')
        .select(`
            addon:addons (
                id,
                name,
                price,
                duration,
                description
            )
        `)
        .eq('service_id', serviceId)

    if (error) {
        console.error('Error fetching addons:', error)
        return []
    }

    return data.map((item: any) => item.addon)
}

export async function getAvailableSlots(companyId: string, date: string, duration: number) {
    const supabase = await createClient()

    // 1. Get company business hours
    const dateObj = new Date(date)
    const dayName = format(dateObj, 'eeee').toLowerCase()
    
    const { data: businessHours } = await supabase
        .from('company_business_hours')
        .select('*')
        .eq('company_id', companyId)
        .eq('day_in_week', dayName)
        .single()
        
    const { data: extras } = await supabase
        .from('company_business_hours_extras')
        .select('*')
        .eq('company_id', companyId)
        .eq('date', date)
        .single()

    let openFromStr = businessHours?.from_time
    let openToStr = businessHours?.to_time
    
    if (extras) {
        if (extras.from_hour) openFromStr = extras.from_hour
        if (extras.to_hour) openToStr = extras.to_hour
    }

    if (!openFromStr || !openToStr) {
        return []
    }

    // 2. Get all staff
    const { data: staffMembers } = await supabase
        .from('staff')
        .select('id')
        .eq('company_id', companyId)
        .eq('available_for_booking', true)

    if (!staffMembers || staffMembers.length === 0) return []

    const staffIds = staffMembers.map(s => s.id)

    // 3. Get existing bookings for this day
    const { data: bookings } = await supabase
        .from('bookings')
        .select('staff_id, time_from, time_to')
        .eq('company_id', companyId)
        .eq('date', date)
        .in('staff_id', staffIds)

    // 4. Generate slots (every 15 min)
    const slots = []
    const openFrom = parse(openFromStr, 'HH:mm:ss', dateObj)
    const openTo = parse(openToStr, 'HH:mm:ss', dateObj)
    
    // Start iterating
    let currentSlot = openFrom
    // We stop when currentSlot + duration > openTo
    const lastPossibleStart = addMinutes(openTo, -duration)

    while (isBefore(currentSlot, lastPossibleStart) || isEqual(currentSlot, lastPossibleStart)) {
        const slotEnd = addMinutes(currentSlot, duration)
        
        // Check availability
        // A slot is available if THERE EXISTS at least one staff member who is free
        // Free means no booking overlaps with [currentSlot, slotEnd]
        
        let isSlotAvailable = false
        
        for (const staffId of staffIds) {
            const staffBookings = bookings?.filter(b => b.staff_id === staffId) || []
            
            const hasConflict = staffBookings.some(b => {
                const bStart = parse(b.time_from, 'HH:mm:ss', dateObj)
                const bEnd = parse(b.time_to, 'HH:mm:ss', dateObj)
                
                // Overlap check
                // (StartA <= EndB) and (EndA >= StartB)
                // But simplified: 
                // Slot starts before booking ends AND slot ends after booking starts
                return isBefore(currentSlot, bEnd) && isAfter(slotEnd, bStart)
            })
            
            if (!hasConflict) {
                isSlotAvailable = true
                break // Found a free staff member
            }
        }

        if (isSlotAvailable) {
            slots.push(format(currentSlot, 'HH:mm'))
        }

        currentSlot = addMinutes(currentSlot, 15) // 15 min step
    }

    return slots
}


export async function checkAvailability(companyId: string, date: string, timeFromStr?: string, timeToStr?: string) {
    // Default duration 30 mins to be lenient
    const duration = 30;
    const slots = await getAvailableSlots(companyId, date, duration);
    
    if (slots.length === 0) return false;

    if (!timeFromStr) return true; // If no time specified, return true if any slot exists

    // If time specified, check if we have a slot that starts >= timeFrom and < timeTo
    // Parse times
    const dummyDate = new Date();
    const searchFrom = parse(timeFromStr, 'HH:mm', dummyDate);
    const searchTo = timeToStr ? parse(timeToStr, 'HH:mm', dummyDate) : addMinutes(searchFrom, 120); // Default 2h window if no end time

    return slots.some(slotTime => {
        const slotDate = parse(slotTime, 'HH:mm', dummyDate);
        // Check if slot is within the window [searchFrom, searchTo]
        // Allow slot to start exactly at searchFrom
        // But slot must start before searchTo
        return (isAfter(slotDate, searchFrom) || isEqual(slotDate, searchFrom)) && isBefore(slotDate, searchTo);
    });
}

export async function createBooking(payload: any) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
        return { error: 'Not authenticated' }
    }

    const { companyId, date, time, note, services } = payload
    
    // Calculate total duration
    const totalDuration = services.reduce((acc: number, s: any) => {
        return acc + s.duration + s.addons.reduce((aacc: number, a: any) => aacc + (a.duration * a.count), 0)
    }, 0)

    // Calculate end time
    // Use an arbitrary date for parsing time strings to Date objects
    const baseDate = new Date()
    const startTime = parse(time, 'HH:mm', baseDate)
    const endTime = addMinutes(startTime, totalDuration)
    const timeTo = format(endTime, 'HH:mm:ss')

    // Find a staff member (Auto-assign)
    // We need to find the staff member who is FREE at this time.
    // Re-run similar logic to getAvailableSlots but specific to this slot
    
    const { data: staffMembers } = await supabase
        .from('staff')
        .select('id')
        .eq('company_id', companyId)
        .eq('available_for_booking', true)

    if (!staffMembers || staffMembers.length === 0) return { error: 'No staff available' }

    // Check bookings for this time
    const { data: bookings } = await supabase
        .from('bookings')
        .select('staff_id, time_from, time_to')
        .eq('company_id', companyId)
        .eq('date', date)
    
    let assignedStaffId = null
    
    for (const staff of staffMembers) {
        const staffBookings = bookings?.filter((b: any) => b.staff_id === staff.id) || []
        const hasConflict = staffBookings.some((b: any) => {
             const bStart = parse(b.time_from, 'HH:mm:ss', baseDate)
             const bEnd = parse(b.time_to, 'HH:mm:ss', baseDate)
             // Overlap check
             return isBefore(startTime, bEnd) && isAfter(endTime, bStart)
        })
        
        if (!hasConflict) {
            assignedStaffId = staff.id
            break
        }
    }

    if (!assignedStaffId) {
        return { error: 'No staff available for selected time' }
    }

    // Create booking
    const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
            company_id: companyId,
            client_id: null, // Still null for now, or link to user profile table if exists
            user_id: user.id,
            service_id: services[0].serviceId,
            staff_id: assignedStaffId,
            date: date,
            time_from: time,
            time_to: timeTo,
            client_note: note
        })
        .select()
        .single()

    if (bookingError) {
        console.error('Booking Error:', bookingError)
        return { error: bookingError.message }
    }

    // Insert booking services and addons
    for (const s of services) {
        const { data: bs, error: bsError } = await supabase
            .from('booking_services')
            .insert({
                booking_id: booking.id,
                service_id: s.serviceId
            })
            .select()
            .single()
            
        if (bsError) console.error('BS Error:', bsError)

        if (bs && s.addons.length > 0) {
            for (const addon of s.addons) {
                await supabase.from('booking_service_addons').insert({
                    booking_service_id: bs.id,
                    addon_id: addon.addonId,
                    count: addon.count
                })
            }
        }
    }

    return { success: true, bookingId: booking.id }
}
