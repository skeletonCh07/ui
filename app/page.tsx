'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Church,
  CalendarCheck,
  AlertCircle,
  Plus,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { membroService, missaService, escalaService } from '@/lib/services/data-service';
import { STATUS_LABELS } from '@/lib/types';
import type { Membro, Missa, Escala } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    membros: 0,
    missasProximas: 0,
    escalasPendentes: 0,
  });
  const [proximasMissas, setProximasMissas] = useState<(Missa & { escala?: Escala })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const membros = membroService.listar();
    const missasProximas = missaService.listarProximas();
    const escalas = escalaService.listar();

    const escalasPendentes = missasProximas.filter(
      (m) => !escalas.find((e) => e.missaId === m.id)
    ).length;

    setStats({
      membros: membros.filter((m) => m.ativo).length,
      missasProximas: missasProximas.length,
      escalasPendentes,
    });

    const proximas = missasProximas.slice(0, 5).map((m) => ({
      ...m,
      escala: escalas.find((e) => e.missaId === m.id),
    }));
    setProximasMissas(proximas);
    setLoading(false);
  }, []);

  const statCards = [
    {
      title: 'Membros Ativos',
      value: stats.membros,
      icon: Users,
      color: 'text-primary',
      href: '/membros',
    },
    {
      title: 'Proximas Missas',
      value: stats.missasProximas,
      icon: Church,
      color: 'text-chart-2',
      href: '/missas',
    },
    {
      title: 'Escalas Pendentes',
      value: stats.escalasPendentes,
      icon: AlertCircle,
      color: stats.escalasPendentes > 0 ? 'text-warning' : 'text-primary',
      href: '/escalas',
    },
  ];

  return (
    <AppShell>
      <Header
        title="Dashboard"
        description="Visao geral do sistema de escalas"
        action={
          <Link href="/escalas/nova">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Escala
            </Button>
          </Link>
        }
      />

      <div className="p-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          {statCards.map((stat) => (
            <Link key={stat.title} href={stat.href}>
              <Card className="cursor-pointer border-border bg-card transition-colors hover:bg-secondary">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className={`rounded-lg bg-secondary p-3 ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold text-card-foreground">{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Proximas Missas */}
        <Card className="mt-6 border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-card-foreground">Proximas Missas</CardTitle>
            <Link href="/missas">
              <Button variant="ghost" size="sm">
                Ver todas
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Carregando...</p>
            ) : proximasMissas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Church className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">Nenhuma missa cadastrada</p>
                <Link href="/missas">
                  <Button variant="outline" className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Cadastrar Missa
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {proximasMissas.map((missa) => (
                  <div
                    key={missa.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 flex-col items-center justify-center rounded-lg bg-primary/10">
                        <span className="text-xs text-muted-foreground">
                          {format(parseISO(missa.data), 'MMM', { locale: ptBR }).toUpperCase()}
                        </span>
                        <span className="text-lg font-bold text-primary">
                          {format(parseISO(missa.data), 'd')}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-card-foreground">
                          {missa.descricao || 'Missa'}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {missa.horario} - {missa.local}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {missa.escala ? (
                        <Badge
                          variant={
                            missa.escala.status === 'publicada'
                              ? 'default'
                              : missa.escala.status === 'concluida'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {STATUS_LABELS[missa.escala.status]}
                        </Badge>
                      ) : (
                        <Badge variant="destructive">Sem Escala</Badge>
                      )}
                      <Link href={missa.escala ? `/escalas/${missa.escala.id}` : `/escalas/nova?missaId=${missa.id}`}>
                        <Button variant="ghost" size="icon">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Acoes Rapidas */}
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link href="/membros">
            <Card className="cursor-pointer border-border bg-card transition-colors hover:bg-secondary">
              <CardContent className="flex items-center gap-3 p-4">
                <Users className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-card-foreground">Gerenciar Membros</span>
              </CardContent>
            </Card>
          </Link>
          <Link href="/missas">
            <Card className="cursor-pointer border-border bg-card transition-colors hover:bg-secondary">
              <CardContent className="flex items-center gap-3 p-4">
                <Church className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-card-foreground">Cadastrar Missa</span>
              </CardContent>
            </Card>
          </Link>
          <Link href="/escalas">
            <Card className="cursor-pointer border-border bg-card transition-colors hover:bg-secondary">
              <CardContent className="flex items-center gap-3 p-4">
                <CalendarCheck className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-card-foreground">Ver Escalas</span>
              </CardContent>
            </Card>
          </Link>
          <Link href="/disponibilidade">
            <Card className="cursor-pointer border-border bg-card transition-colors hover:bg-secondary">
              <CardContent className="flex items-center gap-3 p-4">
                <Clock className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-card-foreground">Disponibilidade</span>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
