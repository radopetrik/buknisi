import { createClient } from "@/utils/supabase/server";
import Header from "../components/Header";


export default async function Contact() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <>
      <Header user={user} />
      <main>
        <section className="hero" style={{ minHeight: "300px", paddingBottom: "40px" }}>
           <div className="hero-content">
             <h1>Kontakt</h1>
             <p>Máte otázky? Neváhajte nás kontaktovať.</p>
           </div>
        </section>

        <section className="section">
          <div style={{ maxWidth: "800px", margin: "0 auto", display: "grid", gap: "40px" }}>
            
            {/* Contact Info */}
            <div style={{ textAlign: "center" }}>
                <h2 style={{ fontFamily: "var(--font-heading)", marginBottom: "20px" }}>Naše kontaktné údaje</h2>
                <div style={{ fontSize: "1.1rem", display: "flex", flexDirection: "column", gap: "10px" }}>
                    <p><strong>Email:</strong> info@buknisi.sk</p>
                    <p><strong>Telefón:</strong> +421 900 123 456</p>
                </div>
            </div>

            {/* Department Contacts */}
             <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div style={{ padding: "24px", background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", border: "1px solid var(--border-color)", textAlign: "center" }}>
                    <h3 style={{ marginBottom: "12px", fontFamily: "var(--font-heading)", fontSize: "18px" }}>Zákaznícka podpora</h3>
                    <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "8px" }}>Pre užívateľov a rezervácie</p>
                    <p style={{ fontWeight: "bold" }}>+421 900 111 222</p>
                    <p style={{ color: "var(--primary-color)" }}>podpora@buknisi.sk</p>
                </div>
                <div style={{ padding: "24px", background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", border: "1px solid var(--border-color)", textAlign: "center" }}>
                    <h3 style={{ marginBottom: "12px", fontFamily: "var(--font-heading)", fontSize: "18px" }}>Technická podpora</h3>
                    <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "8px" }}>Pre partnerov a problémy s appkou</p>
                    <p style={{ fontWeight: "bold" }}>+421 900 333 444</p>
                    <p style={{ color: "var(--primary-color)" }}>tech@buknisi.sk</p>
                </div>
            </div>

            {/* Billing Info */}
            <div style={{ padding: "30px", background: "#f9f9f9", borderRadius: "var(--radius)", border: "1px dashed var(--border-color)", textAlign: "center" }}>
                <h3 style={{ marginBottom: "15px", fontFamily: "var(--font-heading)", fontSize: "20px" }}>Fakturačné údaje</h3>
                <div style={{ lineHeight: "1.6", color: "#555" }}>
                    <p><strong>Bukni Si s.r.o.</strong></p>
                    <p>Prievozská 12, 821 09 Bratislava</p>
                    <p>Slovenská republika</p>
                    <div style={{ marginTop: "10px", display: "flex", gap: "20px", justifyContent: "center" }}>
                        <span><strong>IČO:</strong> 12 345 678</span>
                        <span><strong>DIČ:</strong> 2021234567</span>
                        <span><strong>IČ DPH:</strong> SK2021234567</span>
                    </div>
                </div>
            </div>

            {/* Form */}
            <div style={{ padding: "40px", background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", border: "1px solid var(--border-color)" }}>
                <h3 style={{ marginBottom: "20px", fontFamily: "var(--font-heading)", fontSize: "24px" }}>Napíšte nám</h3>
                
                {user && (
                    <div style={{ marginBottom: "20px", padding: "12px", background: "var(--accent-pink)", borderRadius: "8px", color: "#8a5a66", fontSize: "14px" }}>
                        Prihlásený užívateľ: <strong>{user.email}</strong>
                    </div>
                )}

                <form className="register-form">
                    <div className="form-group">
                        <label htmlFor="name">Meno</label>
                        <input 
                            id="name"
                            type="text" 
                            defaultValue={user?.user_metadata?.full_name || ""}
                            placeholder="Vaše meno"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input 
                            id="email"
                            type="email" 
                            defaultValue={user?.email || ""}
                            placeholder="Váš email"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="message">Správa</label>
                        <textarea 
                            id="message"
                            rows={5}
                            placeholder="Napíšte nám správu..."
                        />
                    </div>
                    <button 
                        type="button" 
                        className="btn-primary"
                        style={{ width: "100%", marginTop: "10px" }}
                    >
                        Odoslať správu
                    </button>
                </form>
            </div>

          </div>
        </section>
      </main>

    </>
  );
}
