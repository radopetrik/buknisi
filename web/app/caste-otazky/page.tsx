import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import Header from "../components/Header";
import FaqContent from "./FaqContent";

export default async function FaqPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <>
      <Header user={user} />
      <main>
        <div className="breadcrumbs-container" style={{ paddingTop: "20px" }}>
          <div className="breadcrumbs">
            <Link href="/">🏠</Link> / <span>Časté otázky</span>
          </div>
        </div>

        <section className="section" style={{ paddingTop: "10px" }}>
          <h1 className="section-title" style={{ textAlign: "center", marginBottom: "40px" }}>
            Časté otázky
          </h1>
          <FaqContent />
        </section>
      </main>
    </>
  );
}
