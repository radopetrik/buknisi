import { supabase } from './supabase';
import { addMinutes, format, parse, isBefore, isAfter, isEqual } from 'date-fns';

export async function getAvailableSlots(companyId: string, date: string, duration: number) {
    // 1. Get company business hours
    const dateObj = new Date(date);
    const dayName = format(dateObj, 'eeee').toLowerCase();
    
    const { data: businessHours } = await supabase
        .from('company_business_hours')
        .select('*')
        .eq('company_id', companyId)
        .eq('day_in_week', dayName)
        .single();
        
    const { data: extras } = await supabase
        .from('company_business_hours_extras')
        .select('*')
        .eq('company_id', companyId)
        .eq('date', date)
        .single();

    let openFromStr = businessHours?.from_time;
    let openToStr = businessHours?.to_time;
    
    if (extras) {
        if (extras.from_hour) openFromStr = extras.from_hour;
        if (extras.to_hour) openToStr = extras.to_hour;
    }

    if (!openFromStr || !openToStr) {
        return [];
    }

    // 2. Get all staff
    const { data: staffMembers } = await supabase
        .from('staff')
        .select('id')
        .eq('company_id', companyId)
        .eq('available_for_booking', true);

    if (!staffMembers || staffMembers.length === 0) return [];

    const staffIds = staffMembers.map((s: any) => s.id);

    // 3. Get existing bookings for this day
    const { data: bookings } = await supabase
        .from('bookings')
        .select('staff_id, time_from, time_to')
        .eq('company_id', companyId)
        .eq('date', date)
        .in('staff_id', staffIds);

    // 4. Generate slots (every 15 min)
    const slots: string[] = [];
    // dateObj is just the date (00:00:00). We need to parse time against it to get full Date objects.
    // NOTE: 'date' param should be yyyy-MM-dd.
    // 'openFromStr' is HH:mm:ss.
    
    const openFrom = parse(openFromStr, 'HH:mm:ss', dateObj);
    const openTo = parse(openToStr, 'HH:mm:ss', dateObj);
    
    let currentSlot = openFrom;
    const lastPossibleStart = addMinutes(openTo, -duration);

    while (isBefore(currentSlot, lastPossibleStart) || isEqual(currentSlot, lastPossibleStart)) {
        const slotEnd = addMinutes(currentSlot, duration);
        
        let isSlotAvailable = false;
        
        for (const staffId of staffIds) {
            const staffBookings = bookings?.filter((b: any) => b.staff_id === staffId) || [];
            
            const hasConflict = staffBookings.some((b: any) => {
                const bStart = parse(b.time_from, 'HH:mm:ss', dateObj);
                const bEnd = parse(b.time_to, 'HH:mm:ss', dateObj);
                
                return isBefore(currentSlot, bEnd) && isAfter(slotEnd, bStart);
            });
            
            if (!hasConflict) {
                isSlotAvailable = true;
                break;
            }
        }

        if (isSlotAvailable) {
            slots.push(format(currentSlot, 'HH:mm'));
        }

        currentSlot = addMinutes(currentSlot, 15);
    }

    return slots;
}

export async function createBooking(payload: any) {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
        return { error: 'Not authenticated' };
    }

    const { companyId, date, time, note, services } = payload;
    
    // Calculate total duration
    const totalDuration = services.reduce((acc: number, s: any) => {
        // Simple version for now, addons handling can be added
        return acc + parseInt(s.duration);
    }, 0);

    const baseDate = new Date(`${date}T00:00:00`);
    const startTime = parse(time, 'HH:mm', baseDate);
    const endTime = addMinutes(startTime, totalDuration);
    const timeTo = format(endTime, 'HH:mm:ss');

    // Find staff
    const { data: staffMembers } = await supabase
        .from('staff')
        .select('id')
        .eq('company_id', companyId)
        .eq('available_for_booking', true);

    if (!staffMembers || staffMembers.length === 0) return { error: 'No staff available' };

    const { data: bookings } = await supabase
        .from('bookings')
        .select('staff_id, time_from, time_to')
        .eq('company_id', companyId)
        .eq('date', date);
    
    let assignedStaffId = null;
    
    for (const staff of staffMembers) {
        const staffBookings = bookings?.filter((b: any) => b.staff_id === staff.id) || [];
        const hasConflict = staffBookings.some((b: any) => {
             const bStart = parse(b.time_from, 'HH:mm:ss', baseDate);
             const bEnd = parse(b.time_to, 'HH:mm:ss', baseDate);
             return isBefore(startTime, bEnd) && isAfter(endTime, bStart);
        });
        
        if (!hasConflict) {
            assignedStaffId = staff.id;
            break;
        }
    }

    if (!assignedStaffId) {
        return { error: 'No staff available for selected time' };
    }

    const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
            company_id: companyId,
            user_id: user.id,
            service_id: services[0].serviceId,
            staff_id: assignedStaffId,
            date: date,
            time_from: time,
            time_to: timeTo,
            client_note: note
        })
        .select()
        .single();

    if (bookingError) {
        return { error: bookingError.message };
    }

    // Link service
    await supabase.from('booking_services').insert({
        booking_id: booking.id,
        service_id: services[0].serviceId
    });

    return { success: true, bookingId: booking.id };
}
