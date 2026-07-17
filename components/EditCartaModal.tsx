"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface EditCartaModalProps {
  carta: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditCartaModal({ carta, onClose, onSuccess }: EditCartaModalProps) {
  const [formData, setFormData] = useState({
    id: carta.id,
    title: carta.title || "",
    _to: carta._to || "",
    _cc: carta._cc || "",
    _cco: carta._cco || "",
    subject: carta.subject || "",
    body: carta.body || "",
    bodyFem: carta.bodyFem || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const bodyWithBreaks = (carta.body || "").replace(/\\n/g, '\n');
    const bodyFemWithBreaks = (carta.bodyFem || "").replace(/\\n/g, '\n');
    setFormData({
      id: carta.id,
      title: carta.title || "",
      _to: carta._to || "",
      _cc: carta._cc || "",
      _cco: carta._cco || "",
      subject: carta.subject || "",
      body: bodyWithBreaks,
      bodyFem: bodyFemWithBreaks,
    });
  }, [carta]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    const bodyWithEscapedBreaks = formData.body.replace(/\n/g, '\\n');
    const bodyFemWithEscapedBreaks = formData.bodyFem.replace(/\n/g, '\\n');
    try {
      const res = await fetch('/api/cartes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, body: bodyWithEscapedBreaks, bodyFem: bodyFemWithEscapedBreaks })
      });
      if (res.ok) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error updating carta:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-background w-full max-w-4xl rounded-lg shadow-xl border border-border flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-border bg-zinc-50/50 dark:bg-zinc-900/50">
          <h2 className="text-lg font-semibold">
            Editar Carta: {formData.title}
          </h2>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-500">Titol</label>
              <input 
                type="text" 
                className="input w-full"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-500">Per a</label>
              <input 
                type="text" 
                className="input w-full"
                value={formData._to}
                onChange={(e) => setFormData({ ...formData, _to: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-500">CC</label>
              <input 
                type="text" 
                className="input w-full"
                value={formData._cc}
                onChange={(e) => setFormData({ ...formData, _cc: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-500">CCO</label>
              <input 
                type="text" 
                className="input w-full"
                value={formData._cco}
                onChange={(e) => setFormData({ ...formData, _cco: e.target.value })}
              />
            </div>

            <div className="md:col-span-2 flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-500">Subject</label>
              <input 
                type="text" 
                className="input w-full"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
            </div>

            <div className="md:col-span-2 flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-500">Cos de la carta (Home)</label>
              <textarea 
                className="input w-full min-h-[200px] resize-y"
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              />
            </div>

            <div className="md:col-span-2 flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-500">Cos de la carta (Dona)</label>
              <textarea 
                className="input w-full min-h-[200px] resize-y"
                value={formData.bodyFem}
                onChange={(e) => setFormData({ ...formData, bodyFem: e.target.value })}
              />
            </div>
          </div>
        </form>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-border bg-zinc-50/50 dark:bg-zinc-900/50">
          <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
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