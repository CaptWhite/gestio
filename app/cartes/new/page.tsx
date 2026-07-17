"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewCartaPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    _to: "",
    _cc: "",
    _cco: "",
    subject: "",
    body: "",
    bodyFem: "",
  });

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setIsSubmitting(true);
    
    const bodyWithEscapedBreaks = formData.body.replace(/\n/g, '\\n');
    const bodyFemWithEscapedBreaks = formData.bodyFem.replace(/\n/g, '\\n');
    
    try {
      const res = await fetch('/api/cartes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...formData, 
          body: bodyWithEscapedBreaks,
          bodyFem: bodyFemWithEscapedBreaks
        })
      });
      
      if (res.ok) {
        router.push('/cartes');
      } else {
        const data = await res.json();
        alert(data.error || "Error al crear la carta");
      }
    } catch (error) {
      console.error("Error creating carta:", error);
      alert("Error al crear la carta");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link 
          href="/cartes" 
          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Nova Carta</h1>
          <p className="text-zinc-500 text-sm">Crear una nova carta.</p>
        </div>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-500">Titol</label>
              <input 
                type="text" 
                className="input w-full"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
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

          <div className="flex justify-end gap-3 pt-6 border-t border-border">
            <Link href="/cartes" className="btn-secondary">Cancelar</Link>
            <button 
              type="submit" 
              disabled={isSubmitting} 
              className="btn-primary"
            >
              {isSubmitting ? "Creant..." : "Crear Carta"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}