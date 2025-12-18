import { createClient } from "@/utils/supabase/server";
import RegistrationForm from "./RegistrationForm";
import "./style.css";

export default async function CreateCustomerPage() {
  const supabase = await createClient();
  const { data: cities } = await supabase.from("cities").select("*").order('name');
  const { data: categories } = await supabase.from("categories").select("*").order('name');

  return (
    <main className="create-customer-page">
      <a href="/" className="auth-logo" aria-label="Späť na úvodnú stránku">
        <img src="/logo_buknisi.png" alt="Bukni Si Logo" />
      </a>
      <div className="auth-wrapper">
        <RegistrationForm cities={cities || []} categories={categories || []} />
      </div>
    </main>
  );
}
