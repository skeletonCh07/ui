'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Clock,
  MapPin,
  CheckCircle,
  FileText,
  Download,
  Pencil,
  Users,
  BookOpen,
  Music,
  MessageSquare,
  HandHeart,
} from 'lucide-react';
import { escalaService, missaService, voluntarioService } from '@/lib/services/data-service';
import { STATUS_LABELS, type Escala, type Missa, type Voluntario } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface EscalaDetalheProps {
  params: Promise<{ id: string }>;
}

export default function EscalaDetalhePage({ params }: EscalaDetalheProps) {
  const { id } = use(params);
  const router = useRouter();
  const [escala, setEscala] = useState<Escala | null>(null);
  const [missa, setMissa] = useState<Missa | null>(null);
  const [voluntariosMap, setVoluntariosMap] = useState<Map<string, Voluntario>>(new Map());

  useEffect(() => {
    const escalaData = escalaService.buscarPorId(id);
    if (escalaData) {
      setEscala(escalaData);
      const missaData = missaService.buscarPorId(escalaData.missaId);
      setMissa(missaData || null);

      const voluntarios = voluntarioService.listar();
      const map = new Map<string, Voluntario>();
      voluntarios.forEach((v) => map.set(v.id, v));
      setVoluntariosMap(map);
    }
  }, [id]);

  const getNomeVoluntario = (voluntarioId: string | null) => {
    if (!voluntarioId) return 'Nao definido';
    return voluntariosMap.get(voluntarioId)?.nome || 'Desconhecido';
  };

  const handlePublicar = () => {
    if (escala) {
      escalaService.atualizar(escala.id, { status: 'publicada' });
      setEscala({ ...escala, status: 'publicada' });
    }
  };

  const handleConcluir = () => {
    if (escala) {
      escalaService.atualizar(escala.id, { status: 'concluida' });
      setEscala({ ...escala, status: 'concluida' });
    }
  };

  const getStatusColor = (status: Escala['status']) => {
    switch (status) {
      case 'rascunho':
        return 'outline';
      case 'publicada':
        return 'default';
      case 'concluida':
        return 'secondary';
    }
  };

  const handleExportPDF = () => {
    if (!escala || !missa) return;

    const content = `
ESCALA DE MISSA
================

Data: ${format(parseISO(missa.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
Horario: ${missa.horario}
Local: ${missa.local}
${missa.descricao ? `Celebracao: ${missa.descricao}` : ''}

MINISTERIOS
-----------

1a LEITURA:
${escala.leitura1.leitores.map((id) => `  - ${getNomeVoluntario(id)}`).join('\n') || '  Nao definido'}

2a LEITURA:
${escala.leitura2.leitores.map((id) => `  - ${getNomeVoluntario(id)}`).join('\n') || '  Nao definido'}

SALMO:
  - ${getNomeVoluntario(escala.salmista)}

MINISTRO DA PALAVRA:
  - ${getNomeVoluntario(escala.ministroPalavra)}

MINISTROS DA COMUNHAO:
${escala.ministrosComunhao.map((id) => `  - ${getNomeVoluntario(id)}`).join('\n') || '  Nao definido'}

COMUNICADOR:
  - ${getNomeVoluntario(escala.comunicador)}

================
Gerado em ${format(new Date(), "dd/MM/yyyy 'as' HH:mm")}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `escala-${format(parseISO(missa.data), 'yyyy-MM-dd')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!escala || !missa) {
    return (
      <AppShell>
        <Header title="Carregando..." />
        <div className="flex h-64 items-center justify-center">
          <p className="text-muted-foreground">Carregando escala...</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Header
        title="Detalhes da Escala"
        action={
          <div className="flex gap-2">
            {escala.status === 'rascunho' && (
              <Button onClick={handlePublicar}>
                <FileText className="mr-2 h-4 w-4" />
                Publicar
              </Button>
            )}
            {escala.status === 'publicada' && (
              <Button onClick={handleConcluir}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Concluir
              </Button>
            )}
            <Button variant="outline" onClick={handleExportPDF}>
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
        }
      />

      <div className="p-6">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Info da Missa */}
          <Card className="border-border bg-card lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-card-foreground">Informacoes da Missa</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center text-center">
                <div className="flex h-20 w-20 flex-col items-center justify-center rounded-xl bg-primary/10">
                  <span className="text-sm text-muted-foreground">
                    {format(parseISO(missa.data), 'MMM', { locale: ptBR }).toUpperCase()}
                  </span>
                  <span className="text-3xl font-bold text-primary">
                    {format(parseISO(missa.data), 'd')}
                  </span>
                </div>
                <p className="mt-4 text-lg font-medium text-card-foreground">
                  {missa.descricao || 'Missa'}
                </p>
                <p className="text-muted-foreground">
                  {format(parseISO(missa.data), "EEEE", { locale: ptBR })}
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {missa.horario}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {missa.local}
                  </div>
                </div>
                <Badge className="mt-4" variant={getStatusColor(escala.status)}>
                  {STATUS_LABELS[escala.status]}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Ministerios */}
          <Card className="border-border bg-card lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-card-foreground">Ministerios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Leitura 1 */}
                <div className="rounded-lg border border-border bg-secondary/50 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <BookOpen className="h-4 w-4" />
                    1a Leitura
                  </div>
                  <div className="mt-2 space-y-1">
                    {escala.leitura1.leitores.length > 0 ? (
                      escala.leitura1.leitores.map((id) => (
                        <p key={id} className="text-card-foreground">
                          {getNomeVoluntario(id)}
                        </p>
                      ))
                    ) : (
                      <p className="text-muted-foreground italic">Nao definido</p>
                    )}
                  </div>
                </div>

                {/* Leitura 2 */}
                <div className="rounded-lg border border-border bg-secondary/50 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <BookOpen className="h-4 w-4" />
                    2a Leitura
                  </div>
                  <div className="mt-2 space-y-1">
                    {escala.leitura2.leitores.length > 0 ? (
                      escala.leitura2.leitores.map((id) => (
                        <p key={id} className="text-card-foreground">
                          {getNomeVoluntario(id)}
                        </p>
                      ))
                    ) : (
                      <p className="text-muted-foreground italic">Nao definido</p>
                    )}
                  </div>
                </div>

                {/* Salmista */}
                <div className="rounded-lg border border-border bg-secondary/50 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Music className="h-4 w-4" />
                    Salmista
                  </div>
                  <p className="mt-2 text-card-foreground">
                    {getNomeVoluntario(escala.salmista)}
                  </p>
                </div>

                {/* Ministro da Palavra */}
                <div className="rounded-lg border border-border bg-secondary/50 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Users className="h-4 w-4" />
                    Ministro da Palavra
                  </div>
                  <p className="mt-2 text-card-foreground">
                    {getNomeVoluntario(escala.ministroPalavra)}
                  </p>
                </div>

                {/* Ministros da Comunhao */}
                <div className="rounded-lg border border-border bg-secondary/50 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <HandHeart className="h-4 w-4" />
                    Ministros da Comunhao
                  </div>
                  <div className="mt-2 space-y-1">
                    {escala.ministrosComunhao.length > 0 ? (
                      escala.ministrosComunhao.map((id) => (
                        <p key={id} className="text-card-foreground">
                          {getNomeVoluntario(id)}
                        </p>
                      ))
                    ) : (
                      <p className="text-muted-foreground italic">Nao definido</p>
                    )}
                  </div>
                </div>

                {/* Comunicador */}
                <div className="rounded-lg border border-border bg-secondary/50 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <MessageSquare className="h-4 w-4" />
                    Comunicador
                  </div>
                  <p className="mt-2 text-card-foreground">
                    {getNomeVoluntario(escala.comunicador)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
