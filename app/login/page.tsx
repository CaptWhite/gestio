"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    
    const searchParams = new URLSearchParams(window.location.search)
    const callbackUrl = searchParams.get("callbackUrl") || "/"
    
    try {
      const result = await signIn("credentials", {
        email: username,
        password,
        redirect: false,
        callbackUrl
      })
      
      if (result?.error) {
        setError("Usuari o contrasenya incorrectes")
      } else {
        window.location.href = callbackUrl
      }
    } catch (err: any) {
      setError("Error de connexió")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-100 dark:bg-zinc-900">
      <div className="w-full max-w-md p-8 bg-white dark:bg-zinc-800 rounded-lg shadow-md border border-zinc-200 dark:border-zinc-700">
        <div className="text-center mb-8">
          <img 
            src="/logo ASTER.png" 
            alt="ASTER Logo" 
            className="w-20 h-20 mx-auto mb-4 object-contain"
          />
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            ASTER - Gestió
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
            Identifica't per accedir
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Correu electrònic
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-md focus:ring-2 focus:ring-accent focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Contrasenya
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-md focus:ring-2 focus:ring-accent focus:border-transparent"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-accent text-white rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Entrant..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  )
}