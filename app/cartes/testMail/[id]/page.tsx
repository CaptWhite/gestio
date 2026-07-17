"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import Link from "next/link";

interface Carta {
  id: number;
  title: string;
  _to: string;
  _cc: string;
  _cco: string;
  subject: string;
  body: string;
  bodyFem: string;
}

export default function TestMailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [carta, setCarta] = useState<Carta | null>(null);
  const [formData, setFormData] = useState({
    _to: "",
    _cc: "",
    _cco: "",
    sexe: "H",
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const fetchCarta = async () => {
      try {
        const res = await fetch('/api/cartes');
        const data = await res.json();
        const found = data.find((c: Carta) => c.id === parseInt(params.id));
        if (found) {
          setCarta(found);
          setFormData({
            _to: found._to || "",
            _cc: found._cc || "",
            _cco: found._cco || "",
            sexe: "H",
          });
        }
      } catch (error) {
        console.error("Error fetching carta:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCarta();
  }, [params.id]);

  const handleSend = async () => {
    setSending(true);
    setMessage(null);
    
    try {
      const res = await fetch('/api/cartes/testMail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartaId: carta?.id,
          cartaTitle: carta?.title,
          to: formData._to,
          cc: formData._cc,
          cco: formData._cco,
          sexe: formData.sexe,
        })
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        setMessage({ type: 'success', text: `Correu enviat correctament! Message ID: ${data.messageId}` });
      } else {
        setMessage({ type: 'error', text: data.error || "Error al enviar el correu" });
      }
    } catch (error) {
      console.error("Error sending mail:", error);
      setMessage({ type: 'error', text: "Error al enviar el correu" });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-zinc-500">Carregant carta...</div>
      </div>
    );
  }

  if (!carta) {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/cartes" className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Prova de Correu</h1>
          </div>
        </div>
        <div className="card p-6 text-center text-zinc-500">Carta no trobada</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/cartes" className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Prova de Correu</h1>
          <p className="text-zinc-500 text-sm">Enviar carta de prova: {carta.title}</p>
        </div>
      </div>

      <div className="card p-6 space-y-6">
        {message && (
          <div className={`p-3 text-sm rounded-md border ${
            message.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
              : 'bg-rose-50 border-rose-200 text-rose-600'
          }`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-500">Per a (To)</label>
            <input 
              type="text" 
              className="input w-full"
              value={formData._to}
              onChange={(e) => setFormData({ ...formData, _to: e.target.value })}
              placeholder="correu@exemple.com"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-500">CC</label>
            <input 
              type="text" 
              className="input w-full"
              value={formData._cc}
              onChange={(e) => setFormData({ ...formData, _cc: e.target.value })}
              placeholder="cc@exemple.com"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-500">CCO</label>
            <input 
              type="text" 
              className="input w-full"
              value={formData._cco}
              onChange={(e) => setFormData({ ...formData, _cco: e.target.value })}
              placeholder="cco@exemple.com"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-500">Sexe</label>
            <select 
              className="input w-full"
              value={formData.sexe}
              onChange={(e) => setFormData({ ...formData, sexe: e.target.value })}
            >
              <option value="H">H - Home</option>
              <option value="D">D - Dona</option>
              <option value="A">A - Altre</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-border">
          <Link href="/cartes" className="btn-secondary">Tornar</Link>
          <button 
            onClick={handleSend}
            disabled={sending || !formData._to}
            className="btn-primary flex items-center gap-2"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {sending ? "Enviant..." : "Enviar"}
          </button>
        </div>
      </div>
    </div>
  );
}