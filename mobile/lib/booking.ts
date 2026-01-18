import { getUserOrNull, supabase } from './supabase';
import { addMinutes, format, parse, isBefore, isAfter, isEqual } from 'date-fns';

export type BookingServiceAddonItem = {
    addonId: string;
    name: string;
    price: number;
    duration: number;
    count: number;
};

export type BookingServiceItem = {
    serviceId: string;
    name: string;
    price: number;
    duration: number;
    addons: BookingServiceAddonItem[];
};

export async function getServiceAddons(serviceId: string) {
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
        .eq('service_id', serviceId);

    if (error) {
        console.error('Error fetching addons:', error);
        return [];
    }

    return (data || []).map((item: any) => item.addon);
}

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

export async function createBooking(payload: {
    companyId: string;
    date: string;
    time: string;
    note?: string;
    services: BookingServiceItem[];
}) {
    const user = await getUserOrNull();

    if (!user) {
        return { error: 'Not authenticated' };
    }

    const { companyId, date, time, note, services } = payload;

    if (!services || services.length === 0) {
        return { error: 'No services selected' };
    }

    const normalizedServices = services.map((s) => {
        const addons = (s.addons || [])
            .map((a) => ({
                addonId: a.addonId,
                count: Math.max(0, Number(a.count) || 0),
                duration: Number(a.duration) || 0,
            }))
            .filter((a) => a.count > 0);

        return {
            serviceId: s.serviceId,
            duration: Number(s.duration) || 0,
            addons,
        };
    });

    // Calculate total duration
    const totalDuration = normalizedServices.reduce((acc, s) => {
        const addonsTime = s.addons.reduce((aacc, a) => aacc + a.duration * a.count, 0);
        return acc + s.duration + addonsTime;
    }, 0);

    if (totalDuration <= 0) {
        return { error: 'Invalid booking duration' };
    }

    const baseDate = new Date(`${date}T00:00:00`);
    const startTime = parse(time, 'HH:mm', baseDate);
    const endTime = addMinutes(startTime, totalDuration);
    const timeTo = format(endTime, 'HH:mm:ss');

    // Find a staff member (auto-assign)
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

    let assignedStaffId: string | null = null;

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
            client_id: null,
            user_id: user.id,
            service_id: normalizedServices[0].serviceId,
            staff_id: assignedStaffId,
            date: date,
            time_from: time,
            time_to: timeTo,
            client_note: note ?? null,
        })
        .select()
        .single();

    if (bookingError) {
        return { error: bookingError.message };
    }

    // Insert booking services and addons
    for (const s of normalizedServices) {
        const { data: bs, error: bsError } = await supabase
            .from('booking_services')
            .insert({
                booking_id: booking.id,
                service_id: s.serviceId,
            })
            .select()
            .single();

        if (bsError) {
            console.error('Error inserting booking service:', bsError);
            continue;
        }

        if (bs && s.addons.length > 0) {
            for (const addon of s.addons) {
                await supabase.from('booking_service_addons').insert({
                    booking_service_id: bs.id,
                    addon_id: addon.addonId,
                    count: addon.count,
                });
            }
        }
    }

    return { success: true, bookingId: booking.id };
}
