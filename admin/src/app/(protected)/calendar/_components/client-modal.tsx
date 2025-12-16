import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (clientData: { firstName: string; lastName: string; phone: string; email: string }) => void;
}

export function ClientModal({ isOpen, onClose, onCreate }: ClientModalProps) {
  const [draft, setDraft] = useState({ firstName: "", lastName: "", phone: "", email: "" });
  const [error, setError] = useState("");
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setDraft({ firstName: "", lastName: "", phone: "", email: "" });
      setError("");
      setTimeout(() => firstInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!draft.firstName.trim() && !draft.lastName.trim()) {
      setError("Zadajte aspoň meno alebo priezvisko.");
      return;
    }
    onCreate(draft);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="text-lg font-semibold text-foreground">Nový klient</p>
            <p className="text-sm text-muted-foreground">Vyplňte údaje klienta pre booking.</p>
          </div>
          <button
            type="button"
            className="text-sm text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            Zavrieť
          </button>
        </div>

        <div className="space-y-3">
          <Input
            ref={firstInputRef}
            placeholder="Meno"
            value={draft.firstName}
            onChange={(event) => setDraft((prev) => ({ ...prev, firstName: event.target.value }))}
          />

          <Input
            placeholder="Priezvisko"
            value={draft.lastName}
            onChange={(event) => setDraft((prev) => ({ ...prev, lastName: event.target.value }))}
          />
          <Input
            placeholder="Telefón"
            value={draft.phone}
            onChange={(event) => setDraft((prev) => ({ ...prev, phone: event.target.value }))}
          />
          <Input
            placeholder="Email"
            type="email"
            value={draft.email}
            onChange={(event) => setDraft((prev) => ({ ...prev, email: event.target.value }))}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Zrušiť
          </Button>
          <Button onClick={handleSubmit}>Vytvoriť klienta</Button>
        </div>
      </div>
    </div>
  );
}
