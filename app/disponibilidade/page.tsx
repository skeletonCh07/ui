import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  CalendarDays,
  Users,
} from 'lucide-react';
import { voluntarioService, disponibilidadeService, missaService } from '@/lib/services/data-service';
import type { Voluntario, Missa } from '@/lib/types';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  addMonths,
  subMonths,
  getDay,
  isSameDay,
  parseISO,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function DisponibilidadePage() {
  const [voluntarios, setVoluntarios] = useState<Voluntario[]>([]);
  const [missas, setMissas] = useState<Missa[]>([]);
  const [voluntarioSelecionado, setVoluntarioSelecionado] = useState<string>('');
  const [mesAtual, setMesAtual] = useState(new Date());
  const [disponibilidades, setDisponibilidades] = useState<Map<string, boolean>>(new Map());

  useEffect(() => {
    const vols = voluntarioService.listar().filter((v) => v.ativo);
    setVoluntarios(vols);
    setMissas(missaService.listarProximas());
  }, []);

  useEffect(() => {
    if (voluntarioSelecionado) {
      const disps = disponibilidadeService.listarPorVoluntario(voluntarioSelecionado);
      const map = new Map<string, boolean>();
      disps.forEach((d) => map.set(d.data, d.disponivel));
      setDisponibilidades(map);
    }
  }, [voluntarioSelecionado]);

  const inicioMes = startOfMonth(mesAtual);
  const fimMes = endOfMonth(mesAtual);
  const diasDoMes = eachDayOfInterval({ start: inicioMes, end: fimMes });

  // Calcular offset para alinhar dias da semana (0 = Domingo)
  const offsetInicio = getDay(inicioMes);
  const diasVaziosInicio = Array(offsetInicio).fill(null);

  const toggleDisponibilidade = (data: Date) => {
    if (!voluntarioSelecionado) return;

    const dataStr = format(data, 'yyyy-MM-dd');
    const atual = disponibilidades.get(dataStr);
    const novoValor = atual === undefined ? true : !atual;

    disponibilidadeService.definir(voluntarioSelecionado, dataStr, novoValor);

    const novaMap = new Map(disponibilidades);
    novaMap.set(dataStr, novoValor);
    setDisponibilidades(novaMap);
  };

  const temMissa = (data: Date) => {
    const dataStr = format(data, 'yyyy-MM-dd');
    return missas.some((m) => m.data === dataStr);
  };

  const getMissasDoDia = (data: Date) => {
    const dataStr = format(data, 'yyyy-MM-dd');
    return missas.filter((m) => m.data === dataStr);
  };

  const voluntarioAtual = voluntarios.find((v) => v.id === voluntarioSelecionado);

  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

  return (
    <AppShell>
      <Header
        title="Disponibilidade"
        description="Marque os dias que voce esta disponivel"
      />

      <div className="p-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Seletor de Voluntario */}
          <Card className="border-border bg-card lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-card-foreground">Selecionar Voluntario</CardTitle>
              <CardDescription>
                Escolha o voluntario para gerenciar disponibilidade
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={voluntarioSelecionado} onValueChange={setVoluntarioSelecionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um voluntario" />
                </SelectTrigger>
                <SelectContent>
                  {voluntarios.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {voluntarioAtual && (
                <div className="mt-4 rounded-lg border border-border bg-secondary/50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                      {voluntarioAtual.nome.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-card-foreground">{voluntarioAtual.nome}</p>
                      <p className="text-sm text-muted-foreground">{voluntarioAtual.email}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Legenda</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded bg-primary/20 border border-primary" />
                    <span className="text-muted-foreground">Disponivel</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded bg-destructive/20 border border-destructive" />
                    <span className="text-muted-foreground">Indisponivel</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded bg-secondary border border-border" />
                    <span className="text-muted-foreground">Nao informado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-chart-3" />
                    <span className="text-muted-foreground">Dia com missa</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Calendario */}
          <Card className="border-border bg-card lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-card-foreground">
                  {format(mesAtual, "MMMM 'de' yyyy", { locale: ptBR })}
                </CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setMesAtual(subMonths(mesAtual, 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setMesAtual(addMonths(mesAtual, 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!voluntarioSelecionado ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CalendarDays className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-muted-foreground">
                    Selecione um voluntario para gerenciar disponibilidade
                  </p>
                </div>
              ) : (
                <div>
                  {/* Cabecalho dos dias da semana */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {diasSemana.map((dia) => (
                      <div
                        key={dia}
                        className="text-center text-xs font-medium text-muted-foreground py-2"
                      >
                        {dia}
                      </div>
                    ))}
                  </div>

                  {/* Dias do mes */}
                  <div className="grid grid-cols-7 gap-1">
                    {diasVaziosInicio.map((_, index) => (
                      <div key={`empty-${index}`} className="aspect-square" />
                    ))}
                    {diasDoMes.map((dia) => {
                      const dataStr = format(dia, 'yyyy-MM-dd');
                      const disponivel = disponibilidades.get(dataStr);
                      const missaDia = temMissa(dia);
                      const missasDoDia = getMissasDoDia(dia);
                      const hoje = isSameDay(dia, new Date());

                      return (
                        <button
                          key={dataStr}
                          onClick={() => toggleDisponibilidade(dia)}
                          className={cn(
                            'relative aspect-square rounded-lg border transition-colors p-1',
                            'hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background',
                            disponivel === true && 'bg-primary/20 border-primary',
                            disponivel === false && 'bg-destructive/20 border-destructive',
                            disponivel === undefined && 'bg-secondary border-border',
                            hoje && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                          )}
                        >
                          <span className={cn(
                            'text-sm font-medium',
                            disponivel === true && 'text-primary',
                            disponivel === false && 'text-destructive',
                            disponivel === undefined && 'text-card-foreground'
                          )}>
                            {format(dia, 'd')}
                          </span>
                          {missaDia && (
                            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                              {missasDoDia.slice(0, 3).map((m, i) => (
                                <div
                                  key={m.id}
                                  className="h-1.5 w-1.5 rounded-full bg-chart-3"
                                  title={`${m.horario} - ${m.descricao || 'Missa'}`}
                                />
                              ))}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Proximas missas com voluntarios disponiveis */}
        <Card className="mt-6 border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-card-foreground">
              <Users className="h-5 w-5" />
              Voluntarios Disponiveis por Missa
            </CardTitle>
            <CardDescription>
              Veja quantos voluntarios estao disponiveis para cada missa
            </CardDescription>
          </CardHeader>
          <CardContent>
            {missas.length === 0 ? (
              <p className="text-muted-foreground">Nenhuma missa futura cadastrada</p>
            ) : (
              <div className="space-y-3">
                {missas.slice(0, 5).map((missa) => {
                  const disponiveis = voluntarios.filter((v) =>
                    disponibilidadeService.verificarDisponibilidade(v.id, missa.data)
                  );
                  return (
                    <div
                      key={missa.id}
                      className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 p-4"
                    >
                      <div>
                        <p className="font-medium text-card-foreground">
                          {format(parseISO(missa.data), "dd/MM/yyyy", { locale: ptBR })} - {missa.horario}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {missa.descricao || 'Missa'} - {missa.local}
                        </p>
                      </div>
                      <Badge variant={disponiveis.length >= 5 ? 'default' : 'outline'}>
                        {disponiveis.length} disponiveis
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
