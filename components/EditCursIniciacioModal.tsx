"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface EditModalProps {
  item: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditCursIniciacioModal({ item, onClose, onSuccess }: EditModalProps) {
  const [payload, setPayload] = useState<Record<string, any>>({ ...item.payload });
  const [title, setTitle] = useState(item.title);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/curs-iniciacio', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, title, payload })
      });
      if (res.ok) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error updating:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fields = [
    { name: "nom", label: "NOM" },
    { name: "cognoms", label: "COGNOMS" },
    { name: "dni-nif", label: "DNI/NIF" },
    { name: "email", label: "CORREU" },
    { name: "telefon", label: "TELÈFON" },
//    { name: "telefonmobil", label: "MÒBIL" },
    { name: "datanaixement", label: "DATA NAIXEMENT" },
    { name: "adreca", label: "ADREÇA" },
    { name: "localitat", label: "LOCALITAT" },
    { name: "provincia", label: "PROVÍNCIA" },
    { name: "codipostal", label: "Codi Postal" },
    { name: "professio", label: "PROFESSIÓ" },
    { name: "estudis", label: "ESTUDIS" },
    { name: "quota", label: "QUOTA" },
//    { name: "iban", label: "IBAN" },
//    { name: "comentaris", label: "COMENTARIS" },
//    { name: "nousoci", label: "Nou Soci" },
//    { name: "onconegut", label: "Conegut per" },
//    { name: "coneixements", label: "Nivell coneixements" },
//    { name: "instrumentobservacio", label: "Instrument" },
//    { name: "descripcio", label: "Descripció" },
//    { name: "espera", label: "Que espera trobar" },
//    { name: "aporta", label: "Que aporta" },
    { name: "instruments", label: "INSTRUMENTS" },
    { name: "models", label: "MODELS" },
    { name: "motiu", label: "MOTIU" },
    { name: "com_coneixer_aster", label: "CONEIXER ASTER" },
    { name: "com_coneixer_curs", label: "CONEIXER CURS" },  
    { name: "pagat", label: "PAGAT", type: "select", options: ["no", "si"] },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-background w-full max-w-2xl rounded-lg shadow-xl border border-border flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-border bg-zinc-50/50 dark:bg-zinc-900/50">
          <h2 className="text-lg font-semibold">
            Editar Inscripció #{item.id}
          </h2>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {fields.map((field) => (
              <div key={field.name} className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-500">{field.label}</label>
                {field.type === 'select' ? (
                  <select
                    className="input w-full"
                    value={payload[field.name] || 'no'}
                    onChange={(e) => setPayload({ ...payload, [field.name]: e.target.value })}
                  >
                    {field.options!.map((opt) => (
                      <option key={opt} value={opt}>{opt === 'si' ? 'Sí' : 'No'}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    className="input w-full"
                    value={payload[field.name] || ''}
                    onChange={(e) => setPayload({ ...payload, [field.name]: e.target.value })}
                  />
                )}
              </div>
            ))}
          </div>
        </form>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-border bg-zinc-50/50 dark:bg-zinc-900/50">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel·lar</button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="btn-primary"
          >
            {isSubmitting ? "Actualitzant..." : "Actualitzar"}
          </button>
        </div>
      </div>
    </div>
  );
}
