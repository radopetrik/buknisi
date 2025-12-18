"use client";

import { useState } from "react";

type Question = {
  q: string;
  a: string;
};

export default function FaqContent() {
  const [activeTab, setActiveTab] = useState<"user" | "company">("user");

  const userQuestions: Question[] = [
    {
      q: "Ako si vytvorím rezerváciu?",
      a: "Vyhľadajte službu alebo salón, ktorý vás zaujíma, vyberte si termín a čas, ktorý vám vyhovuje, a potvrďte rezerváciu. Je to rýchle a jednoduché.",
    },
    {
      q: "Musím sa registrovať?",
      a: "Pre vytvorenie rezervácie nie je registrácia povinná, ale odporúčame ju pre lepší prehľad o vašich termínoch a jednoduchšiu správu rezervácií v budúcnosti.",
    },
    {
      q: "Ako zruším rezerváciu?",
      a: "Rezerváciu môžete zrušiť priamo vo svojom profile v sekcii 'Moje rezervácie' alebo cez odkaz v potvrdzujúcom e-maile, ak to salón umožňuje.",
    },
    {
      q: "Je rezervácia záväzná?",
      a: "Áno, rezervácia je záväzná. Ak sa nemôžete dostaviť, prosíme, aby ste termín zrušili čo najskôr, aby sa uvoľnil pre iných zákazníkov.",
    },
    {
      q: "Môžem zaplatiť online?",
      a: "Možnosť online platby závisí od konkrétneho salónu. Niektoré vyžadujú platbu na mieste, iné umožňujú platbu vopred kartou.",
    },
  ];

  const companyQuestions: Question[] = [
    {
      q: "Ako pridám svoj podnik?",
      a: "Kliknite na odkaz 'Pre firmy' v menu a zaregistrujte sa. Po vyplnení základných údajov vás budeme kontaktovať a pomôžeme vám s nastavením profilu.",
    },
    {
      q: "Koľko to stojí?",
      a: "Ponúkame rôzne balíčky pre malé aj veľké prevádzky. Pre konkrétnu cenovú ponuku nás prosím kontaktujte alebo sa pozrite na sekciu Cenník po registrácii.",
    },
    {
      q: "Môžem spravovať viac prevádzok?",
      a: "Áno, náš systém podporuje správu viacerých pobočiek pod jedným účtom, čo vám uľahčí manažment celého podnikania.",
    },
    {
      q: "Ako fungujú hodnotenia?",
      a: "Zákazníci môžu hodnotiť vaše služby po absolvovaní termínu. Hodnotenia pomáhajú budovať dôveru a prilákať nových klientov.",
    },
    {
      q: "Kde uvidím svoje rezervácie?",
      a: "Všetky rezervácie uvidíte v prehľadnom kalendári vo vašej admin zóne. Môžete ich tam aj upravovať, rušiť alebo pridávať nové manuálne.",
    },
  ];

  const questions = activeTab === "user" ? userQuestions : companyQuestions;

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <div className="auth-tabs" style={{ justifyContent: "center", marginBottom: "40px" }}>
        <button
          className={`auth-tab ${activeTab === "user" ? "active" : ""}`}
          onClick={() => setActiveTab("user")}
          style={{ maxWidth: "200px", fontSize: "18px" }}
        >
          Pre zákazníkov
        </button>
        <button
          className={`auth-tab ${activeTab === "company" ? "active" : ""}`}
          onClick={() => setActiveTab("company")}
          style={{ maxWidth: "200px", fontSize: "18px" }}
        >
          Pre firmy
        </button>
      </div>

      <div className="faq-list">
        {questions.map((item, index) => (
          <div key={index} className="panel" style={{ marginBottom: "20px" }}>
            <h3 style={{ marginBottom: "10px", color: "var(--text-main)" }}>
              {item.q}
            </h3>
            <p style={{ color: "var(--text-muted)", lineHeight: "1.6" }}>
              {item.a}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
