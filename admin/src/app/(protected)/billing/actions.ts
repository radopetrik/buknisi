"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { 
  Invoice, 
  InvoiceItem, 
  UnpaidBooking, 
  ServiceOption, 
  ClientOption, 
  AddonOption,
  BookingServiceSelection
} from "./types";

export async function getBillingData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  // Get Company ID
  const { data: companyRow } = await supabase
    .from("company_users")
    .select("company_id")
    .eq("user_id", user.id)
    .single();

  if (!companyRow?.company_id) throw new Error("Company not found");
  const companyId = companyRow.company_id;

  // 1. Fetch Services & Addons
  const [servicesRes, addonsRes, serviceAddonsRes, clientsRes, unpaidBookingsRes, invoicesRes] = await Promise.all([
    supabase.from("services").select("id,name,price,duration").eq("company_id", companyId).order("name"),
    supabase.from("addons").select("id,name,price,duration").eq("company_id", companyId).order("name"),
    supabase.from("service_addons").select("service_id, addon_id"),
    supabase.from("clients").select("id,first_name,last_name,email,phone").eq("company_id", companyId).order("first_name"),
    supabase
      .from("bookings")
      .select(`
        id, client_id, date, time_from, time_to,
        clients(first_name, last_name),
        booking_services(
          id, service_id, 
          services(name, price),
          booking_service_addons(addon_id, count, addons(name, price))
        )
      `)
      .eq("company_id", companyId)
      .is("invoice_id", null)
      .order("date", { ascending: false }),
    supabase
      .from("invoices")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(50)
  ]);

  if (servicesRes.error) throw servicesRes.error;
  if (addonsRes.error) throw addonsRes.error;
  if (clientsRes.error) throw clientsRes.error;
  if (unpaidBookingsRes.error) throw unpaidBookingsRes.error;
  if (invoicesRes.error) throw invoicesRes.error;

  // Process Services
  const addonsMap = new Map<string, AddonOption>();
  addonsRes.data.forEach((a: any) => addonsMap.set(a.id, {
    id: a.id, name: a.name, price: Number(a.price), duration: a.duration
  }));

  const serviceAddonMap = new Map<string, string[]>();
  (serviceAddonsRes.data || []).forEach((row: any) => {
    const arr = serviceAddonMap.get(row.service_id) || [];
    arr.push(row.addon_id);
    serviceAddonMap.set(row.service_id, arr);
  });

  const services: ServiceOption[] = servicesRes.data.map((s: any) => ({
    id: s.id,
    name: s.name,
    price: Number(s.price),
    duration: s.duration,
    addons: (serviceAddonMap.get(s.id) || [])
      .map(aid => addonsMap.get(aid)!)
      .filter(Boolean)
  }));

  // Process Clients
  const clients: ClientOption[] = clientsRes.data.map((c: any) => ({
    id: c.id,
    firstName: c.first_name,
    lastName: c.last_name,
    email: c.email,
    phone: c.phone
  }));

  // Process Unpaid Bookings
  const unpaidBookings: UnpaidBooking[] = unpaidBookingsRes.data.map((b: any) => {
    let totalPrice = 0;
    const serviceSelections: BookingServiceSelection[] = [];
    
    b.booking_services.forEach((bs: any) => {
      let servicePrice = Number(bs.services?.price || 0);
      let addonsPrice = 0;
      
      const selectionAddons = bs.booking_service_addons.map((bsa: any) => {
        addonsPrice += Number(bsa.addons?.price || 0) * (bsa.count || 1);
        return { addonId: bsa.addon_id, count: bsa.count };
      });
      
      totalPrice += servicePrice + addonsPrice;
      
      serviceSelections.push({
        id: bs.id,
        serviceId: bs.service_id,
        addons: selectionAddons
      });
    });

    return {
      id: b.id,
      clientId: b.client_id,
      clientName: b.clients ? `${b.clients.first_name} ${b.clients.last_name}` : undefined,
      date: b.date,
      timeFrom: b.time_from,
      timeTo: b.time_to,
      serviceSelections,
      totalPrice
    };
  });

  // Process Invoices
  const invoices: Invoice[] = invoicesRes.data.map((inv: any) => ({
    id: inv.id,
    companyId: inv.company_id,
    clientId: inv.client_id,
    amount: Number(inv.amount),
    paymentMethod: inv.payment_method,
    items: inv.services_and_addons,
    createdAt: inv.created_at,
    bookingId: null // We'd need to fetch bookings separately to link them here or do a join, but schema update added invoice_id to bookings. 
    // To get bookingId here, we would need to query bookings table for this invoice_id. 
    // For now, let's skip back-populating bookingId unless necessary.
  }));

  return { services, clients, unpaidBookings, invoices };
}

export async function createInvoice(
  invoiceData: Omit<Invoice, "id" | "createdAt" | "companyId">,
  bookingId?: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: companyRow } = await supabase
    .from("company_users")
    .select("company_id")
    .eq("user_id", user.id)
    .single();

  if (!companyRow?.company_id) throw new Error("Company not found");

  // Insert Invoice
  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .insert({
      company_id: companyRow.company_id,
      client_id: invoiceData.clientId,
      amount: invoiceData.amount,
      payment_method: invoiceData.paymentMethod,
      services_and_addons: invoiceData.items
    })
    .select()
    .single();

  if (invoiceError) throw invoiceError;

  // If Linked Booking
  if (bookingId) {
    const { error: bookingError } = await supabase
      .from("bookings")
      .update({ invoice_id: invoice.id })
      .eq("id", bookingId)
      .eq("company_id", companyRow.company_id);

    if (bookingError) throw bookingError;
  }

  revalidatePath("/billing");
  return invoice;
}

export async function updateBookingAndPay(
  bookingId: string, 
  selections: BookingServiceSelection[], 
  paymentMethod: "cash" | "card",
  services: ServiceOption[],
  clientId?: string
) {
  const supabase = await createClient();
  
  // 1. Calculate new totals and generate invoice items
  let totalAmount = 0;
  const invoiceItems: InvoiceItem[] = [];

  for (const sel of selections) {
    const service = services.find(s => s.id === sel.serviceId);
    if (!service) continue;
    
    totalAmount += service.price;
    invoiceItems.push({
      type: "service",
      name: service.name,
      price: service.price,
      count: 1,
      id: service.id
    });

    for (const addonSel of sel.addons) {
      const addon = service.addons.find(a => a.id === addonSel.addonId);
      if (!addon) continue;
      
      totalAmount += addon.price * addonSel.count;
      invoiceItems.push({
        type: "addon",
        name: addon.name,
        price: addon.price,
        count: addonSel.count,
        serviceName: service.name,
        id: addon.id
      });
    }
  }

  // 2. Update booking services in DB
  // This is complex because we need to sync booking_services and booking_service_addons
  // A simpler approach for MVP: Delete existing services for this booking and re-insert.
  // BUT booking_services has CASCADE delete on booking? No.
  // booking_services CASCADE on delete booking.
  
  // Let's use a transaction or careful steps.
  
  // Step A: Delete old booking_services
  await supabase.from("booking_services").delete().eq("booking_id", bookingId);

  // Step B: Insert new
  for (const sel of selections) {
    const { data: bs, error: bsError } = await supabase
      .from("booking_services")
      .insert({ booking_id: bookingId, service_id: sel.serviceId })
      .select("id")
      .single();
    
    if (bsError) throw bsError;

    if (sel.addons.length > 0) {
      const addonInserts = sel.addons.map(a => ({
        booking_service_id: bs.id,
        addon_id: a.addonId,
        count: a.count
      }));
      await supabase.from("booking_service_addons").insert(addonInserts);
    }
  }
  
  // Step C: Update booking client if changed
  if (clientId) {
     await supabase.from("bookings").update({ client_id: clientId }).eq("id", bookingId);
  }

  // 3. Create Invoice
  const invoiceData = {
    clientId: clientId || null,
    amount: totalAmount,
    paymentMethod,
    items: invoiceItems
  };

  return createInvoice(invoiceData, bookingId);
}
