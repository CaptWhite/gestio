"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { 
  LayoutDashboard, 
  Users, 
  CheckSquare, 
  Settings,
  UserPlus,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: 'Dashboard', href: '/gestio', icon: LayoutDashboard },
  { name: 'Socis', href: '/gestio/customers', icon: Users },
  { name: 'Tasques', href: '/gestio/tasks', icon: CheckSquare },
  { name: 'Inscripcions', href: '/gestio/inscriptions', icon: UserPlus },
  { name: 'Configuració', href: '/gestio/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  return (
    <div className="flex flex-col w-64 border-r border-border bg-background">
      <div className="flex flex-col items-center py-8 px-6 gap-3">
        <img 
          src="/gestio/logo ASTER.png" 
          alt="ASTER Logo"
          className="w-24 h-24 object-contain"
        />
        <span className="font-semibold text-sm tracking-tight text-center uppercase text-zinc-600 dark:text-zinc-400">
          {session?.user?.email ? `ASTER - ${session.user.email}` : "ASTER - Gestió administrativa"}
        </span>
      </div>
      
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive 
                  ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100" 
                  : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
              )}
            >
              <item.icon className={cn("w-4 h-4", isActive ? "text-accent" : "text-zinc-400")} />
              {item.name}
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-border">
        {session?.user ? (
          <div className="flex items-center justify-between gap-3 px-3 py-2">
            <div className="flex items-center gap-3">
               <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-white text-xs font-medium">
                {session.user.name?.[0]?.toUpperCase() || "U"}
              </div> 
              <div className="flex flex-col items-center">
                <span className="text-lg font-medium">ASTER</span>
                <span className="text-[12px] text-zinc-400">{session.user.email}</span>
                <span className="text-[11px] font-medium">Powered by Captwhite</span>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/gestio/login" })}
              className="p-2 text-zinc-400 hover:text-zinc-600 transition-colors"
              title="Tancar sessió - Autenticat"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800" />
            <div className="flex flex-col items-center">
              <span className="text-lg font-medium">ASTER</span>
              <span className="text-[11px] text-zinc-300">Powered by Captwhite</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}