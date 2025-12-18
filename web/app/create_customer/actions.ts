'use server'

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

function slugify(text: string) {
  return text.toString().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
    .replace(/\s+/g, '-')           
    .replace(/[^\w\-]+/g, '')       
    .replace(/\-\-+/g, '-')         
    .replace(/^-+/, '')             
    .replace(/-+$/, '');            
}

export async function registerCompany(formData: FormData) {
  const supabase = await createClient();

  const companyName = formData.get("companyName") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const categoryId = formData.get("category") as string;
  const cityId = formData.get("city") as string;
  const address = formData.get("address") as string;

  if (!companyName || !email || !password || !categoryId || !cityId) {
      return { error: "Prosím vyplňte všetky povinné polia." };
  }

  // 1. Sign up user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    return { error: authError.message };
  }

  if (!authData.user) {
    return { error: "Nepodarilo sa vytvoriť používateľa." };
  }

  // 2. Create Company
  const slug = slugify(companyName) + '-' + Math.random().toString(36).substring(2, 7); // Add random suffix to avoid collision

  const { data: companyData, error: companyError } = await supabase
    .from("companies")
    .insert({
      name: companyName,
      slug: slug,
      email: email,
      category_id: categoryId,
      city_id: cityId,
      address_text: address,
      is_mobile: false
    })
    .select()
    .single();

  if (companyError) {
    console.error("Company creation error:", companyError);
    // Cleanup user if company creation fails? ideally yes, but for now let's just error out.
    return { error: "Nepodarilo sa vytvoriť profil firmy: " + companyError.message };
  }

  // 3. Link User to Company
  const { error: linkError } = await supabase
    .from("company_users")
    .insert({
      company_id: companyData.id,
      user_id: authData.user.id
    });

  if (linkError) {
    console.error("Link error:", linkError);
    return { error: "Nepodarilo sa prepojiť používateľa s firmou." };
  }

  redirect("/?registered=true");
}
