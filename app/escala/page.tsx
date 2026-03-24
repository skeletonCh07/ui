'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { Header } from '@/components/layout/header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  MoreVertical,
  Eye,
  Trash2,
  Clock,
  MapPin,
  CalendarCheck,
  CheckCircle,
  FileText,
} from 'lucide-react';
import { escalaService, missaService, voluntarioService } from '@/lib/services/data-service';
import { STATUS_LABELS, type Escala, type Missa, type StatusEscala } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface EscalaComMissa extends Escala {
  missa?: Missa;
}

export default function EscalasPage() {
  const [escalas, setEscalas] = useState<EscalaComMissa[]>([]);
  const [filtroStatus, setFiltroStatus] = useState<StatusEscala | 'todas'>('todas');

  const carregarEscalas = () => {
    const todasEscalas = escalaService.listar();
    const escalasComMissa = todasEscalas.map((e) => ({
      ...e,
      missa: missaService.buscarPorId(e.missaId),
    }));
    escalasComMissa.sort((a, b) => {
      if (!a.missa || !b.missa) return 0;
      return b.missa.data.localeCompare(a.missa.data);
    });
    setEscalas(escalasComMissa);
  };

  useEffect(() => {
    carregarEscalas();
  }, []);

  const escalasFiltradas = escalas.filter((e) => {
    if (filtroStatus === 'todas') return true;
    return e.status === filtroStatus;
  });

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta escala?')) {
      escalaService.excluir(id);
      carregarEscalas();
    }
  };

  const handlePublicar = (id: string) => {
    escalaService.atualizar(id, { status: 'publicada' });
    carregarEscalas();
  };

  const handleConcluir = (id: string) => {
    escalaService.atualizar(id, { status: 'concluida' });
    carregarEscalas();
  };

  const contarVoluntarios = (escala: Escala): number => {
    let count = 0;
    count += escala.leitura1.leitores.length;
    count += escala.leitura2.leitores.length;
    if (escala.salmista) count++;
    if (escala.ministroPalavra) count++;
    count += escala.ministrosComunhao.length;
    if (escala.comunicador) count++;
    return count;
  };

  const getStatusColor = (status: StatusEscala) => {
    switch (status) {
      case 'rascunho':
        return 'outline';
      case 'publicada':
        return 'default';
      case 'concluida':
        return 'secondary';
    }
  };

  return (
    <AppShell>
      <Header
        title="Escalas"
        description="Gerencie as escalas de missas"
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
        {/* Filtros */}
        <div className="mb-6 flex gap-2 flex-wrap">
          <Button
            variant={filtroStatus === 'todas' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFiltroStatus('todas')}
          >
            Todas
          </Button>
          <Button
            variant={filtroStatus === 'rascunho' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFiltroStatus('rascunho')}
          >
            Rascunhos
          </Button>
          <Button
            variant={filtroStatus === 'publicada' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFiltroStatus('publicada')}
          >
            Publicadas
          </Button>
          <Button
            variant={filtroStatus === 'concluida' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFiltroStatus('concluida')}
          >
            Concluidas
          </Button>
        </div>

        {/* Lista */}
        {escalasFiltradas.length === 0 ? (
          <Card className="border-border bg-card">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CalendarCheck className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">
                {escalas.length === 0
                  ? 'Nenhuma escala cadastrada'
                  : 'Nenhuma escala encontrada com este filtro'}
              </p>
              {escalas.length === 0 && (
                <Link href="/escalas/nova">
                  <Button className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Criar primeira escala
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {escalasFiltradas.map((escala) => (
              <Card key={escala.id} className="border-border bg-card">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    {escala.missa ? (
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 flex-col items-center justify-center rounded-lg bg-primary/10">
                          <span className="text-xs text-muted-foreground">
                            {format(parseISO(escala.missa.data), 'MMM', { locale: ptBR }).toUpperCase()}
                          </span>
                          <span className="text-xl font-bold text-primary">
                            {format(parseISO(escala.missa.data), 'd')}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-card-foreground">
                            {escala.missa.descricao || 'Missa'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(parseISO(escala.missa.data), "EEEE", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Missa nao encontrada</p>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <Link href={`/escalas/${escala.id}`}>
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            Visualizar
                          </DropdownMenuItem>
                        </Link>
                        {escala.status === 'rascunho' && (
                          <DropdownMenuItem onClick={() => handlePublicar(escala.id)}>
                            <FileText className="mr-2 h-4 w-4" />
                            Publicar
                          </DropdownMenuItem>
                        )}
                        {escala.status === 'publicada' && (
                          <DropdownMenuItem onClick={() => handleConcluir(escala.id)}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Marcar Concluida
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleDelete(escala.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {escala.missa && (
                    <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {escala.missa.horario}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {escala.missa.local}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusColor(escala.status)}>
                        {STATUS_LABELS[escala.status]}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {contarVoluntarios(escala)} voluntarios
                      </span>
                    </div>
                    <Link href={`/escalas/${escala.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
