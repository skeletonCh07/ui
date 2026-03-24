import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  History,
  Eye,
  Download,
  Search,
  Users,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { escalaService, missaService, voluntarioService } from '@/lib/services/data-service';
import { STATUS_LABELS, type Escala, type Missa, type Voluntario } from '@/lib/types';
import { format, parseISO, subMonths, isAfter, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface EscalaComMissa extends Escala {
  missa?: Missa;
}

interface EstatisticaVoluntario {
  voluntario: Voluntario;
  totalEscalas: number;
}

export default function HistoricoPage() {
  const [escalas, setEscalas] = useState<EscalaComMissa[]>([]);
  const [voluntarios, setVoluntarios] = useState<Voluntario[]>([]);
  const [filtroMeses, setFiltroMeses] = useState<string>('3');
  const [busca, setBusca] = useState('');
  const [estatisticas, setEstatisticas] = useState<EstatisticaVoluntario[]>([]);

  useEffect(() => {
    const todasEscalas = escalaService.listar();
    const vols = voluntarioService.listar();
    setVoluntarios(vols);

    const escalasComMissa = todasEscalas.map((e) => ({
      ...e,
      missa: missaService.buscarPorId(e.missaId),
    }));

    // Ordenar por data decrescente
    escalasComMissa.sort((a, b) => {
      if (!a.missa || !b.missa) return 0;
      return b.missa.data.localeCompare(a.missa.data);
    });

    setEscalas(escalasComMissa);

    // Calcular estatisticas
    const stats = new Map<string, number>();
    todasEscalas.forEach((escala) => {
      const ids = [
        ...escala.leitura1.leitores,
        ...escala.leitura2.leitores,
        escala.salmista,
        escala.ministroPalavra,
        ...escala.ministrosComunhao,
        escala.comunicador,
      ].filter(Boolean) as string[];

      ids.forEach((id) => {
        stats.set(id, (stats.get(id) || 0) + 1);
      });
    });

    const estatisticasArray: EstatisticaVoluntario[] = [];
    vols.forEach((v) => {
      estatisticasArray.push({
        voluntario: v,
        totalEscalas: stats.get(v.id) || 0,
      });
    });

    estatisticasArray.sort((a, b) => b.totalEscalas - a.totalEscalas);
    setEstatisticas(estatisticasArray);
  }, []);

  // Filtrar escalas
  const dataLimite = subMonths(new Date(), parseInt(filtroMeses));
  const escalasFiltradas = escalas.filter((e) => {
    if (!e.missa) return false;
    const dataMissa = parseISO(e.missa.data);
    const dentroDoPerido = isAfter(dataMissa, dataLimite);
    const matchBusca =
      busca === '' ||
      (e.missa.descricao?.toLowerCase().includes(busca.toLowerCase()) ?? false) ||
      e.missa.local.toLowerCase().includes(busca.toLowerCase());
    return dentroDoPerido && matchBusca;
  });

  const exportarHistorico = () => {
    const linhas = [
      'Data,Horario,Local,Descricao,Status,Leitores 1a,Leitores 2a,Salmista,Min. Palavra,Min. Comunhao,Comunicador',
    ];

    escalasFiltradas.forEach((e) => {
      if (!e.missa) return;
      const getNome = (id: string | null) => {
        if (!id) return '';
        return voluntarios.find((v) => v.id === id)?.nome || '';
      };

      linhas.push(
        [
          e.missa.data,
          e.missa.horario,
          e.missa.local,
          e.missa.descricao || '',
          STATUS_LABELS[e.status],
          e.leitura1.leitores.map(getNome).join('; '),
          e.leitura2.leitores.map(getNome).join('; '),
          getNome(e.salmista),
          getNome(e.ministroPalavra),
          e.ministrosComunhao.map(getNome).join('; '),
          getNome(e.comunicador),
        ].join(',')
      );
    });

    const blob = new Blob([linhas.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historico-escalas-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

  return (
    <AppShell>
      <Header
        title="Historico"
        description="Veja o historico de escalas e estatisticas"
        action={
          <Button variant="outline" onClick={exportarHistorico}>
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
        }
      />

      <div className="p-6">
        {/* Estatisticas */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card className="border-border bg-card">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-lg bg-primary/10 p-3 text-primary">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Escalas</p>
                <p className="text-2xl font-bold text-card-foreground">{escalas.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-lg bg-chart-2/20 p-3 text-chart-2">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Voluntarios Ativos</p>
                <p className="text-2xl font-bold text-card-foreground">
                  {voluntarios.filter((v) => v.ativo).length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-lg bg-chart-3/20 p-3 text-chart-3">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Concluidas</p>
                <p className="text-2xl font-bold text-card-foreground">
                  {escalas.filter((e) => e.status === 'concluida').length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Tabela de Historico */}
          <Card className="border-border bg-card lg:col-span-2">
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-card-foreground">Historico de Escalas</CardTitle>
                  <CardDescription>
                    {escalasFiltradas.length} escalas encontradas
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar..."
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      className="w-40 pl-10"
                    />
                  </div>
                  <Select value={filtroMeses} onValueChange={setFiltroMeses}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 mes</SelectItem>
                      <SelectItem value="3">3 meses</SelectItem>
                      <SelectItem value="6">6 meses</SelectItem>
                      <SelectItem value="12">1 ano</SelectItem>
                      <SelectItem value="999">Tudo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {escalasFiltradas.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <History className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-muted-foreground">Nenhuma escala encontrada</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Missa</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Acoes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {escalasFiltradas.slice(0, 20).map((escala) => (
                        <TableRow key={escala.id}>
                          <TableCell className="font-medium">
                            {escala.missa
                              ? format(parseISO(escala.missa.data), 'dd/MM/yyyy', { locale: ptBR })
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {escala.missa && (
                              <div>
                                <p className="text-card-foreground">
                                  {escala.missa.descricao || 'Missa'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {escala.missa.horario} - {escala.missa.local}
                                </p>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusColor(escala.status)}>
                              {STATUS_LABELS[escala.status]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Link href={`/escalas/${escala.id}`}>
                              <Button variant="ghost" size="icon">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ranking de Participacao */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-card-foreground">Ranking de Participacao</CardTitle>
              <CardDescription>
                Voluntarios com mais escalas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {estatisticas.slice(0, 10).map((stat, index) => (
                  <div
                    key={stat.voluntario.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-bold ${index < 3 ? 'text-primary' : 'text-muted-foreground'}`}>
                        #{index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-card-foreground">
                          {stat.voluntario.nome}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">{stat.totalEscalas}</Badge>
                  </div>
                ))}
                {estatisticas.length === 0 && (
                  <p className="text-center text-muted-foreground">
                    Nenhuma participacao registrada
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
