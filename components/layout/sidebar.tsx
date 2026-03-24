'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Church,
  CalendarCheck,
  CalendarDays,
  History,
  LogOut,
  Menu,
  X,
  UserPlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/contexts/auth-context';
import { useState } from 'react';

const navigationAdmin = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Membros', href: '/membros', icon: Users },
  { name: 'Missas', href: '/missas', icon: Church },
  { name: 'Escalas', href: '/escalas', icon: CalendarCheck },
  { name: 'Disponibilidade', href: '/disponibilidade', icon: CalendarDays },
  { name: 'Historico', href: '/historico', icon: History },
];

const navigationMembro = [
  { name: 'Minha Disponibilidade', href: '/minha-disponibilidade', icon: CalendarDays },
  { name: 'Minhas Escalas', href: '/minhas-escalas', icon: CalendarCheck },
];

export function Sidebar() {
  const pathname = usePathname();
  const { usuario, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isMembro = usuario?.role === 'membro';
  const navigation = isMembro ? navigationMembro : navigationAdmin;

  const NavContent = () => (
    <>
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6 bg-gradient-to-r from-primary/10 to-transparent">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 border border-primary/30">
          <Church className="h-6 w-6 text-primary" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-sidebar-foreground">Escala Missa</span>
          <span className="text-xs text-muted-foreground">Gestão Litúrgica</span>
        </div>
      </div>

      <nav className="flex-1 space-y-2 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-gradient-to-r from-primary/30 to-primary/10 text-primary border border-primary/20 shadow-sm'
                  : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span>{item.name}</span>
              {isActive && <div className="ml-auto h-2 w-2 rounded-full bg-primary" />}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 px-3 py-3 border border-primary/20">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-semibold flex-shrink-0">
            {usuario?.nome?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-semibold text-sidebar-foreground">
              {usuario?.nome || 'Usuário'}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {isMembro ? 'Membro' : usuario?.role === 'admin' ? 'Administrador' : 'Coordenador'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            className="h-8 w-8 text-muted-foreground hover:text-destructive flex-shrink-0"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-4 z-50 lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar transition-transform lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <NavContent />
      </aside>
    </>
  );
}
