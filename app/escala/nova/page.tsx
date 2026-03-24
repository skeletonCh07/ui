'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Wand2,
  Save,
  AlertTriangle,
  Clock,
  MapPin,
  Users,
  Plus,
  X,
} from 'lucide-react';
import { missaService, voluntarioService, escalaService } from '@/lib/services/data-service';
import { gerarEscalaAutomatica, verificarDisponibilidadeMinima } from '@/lib/services/escala-generator';
import { FUNCOES_LABELS, type Missa, type Voluntario, type TipoFuncao } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function NovaEscalaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const missaIdParam = searchParams.get('missaId');

  const [missas, setMissas] = useState<Missa[]>([]);
  const [voluntarios, setVoluntarios] = useState<Voluntario[]>([]);
  const [missaSelecionada, setMissaSelecionada] = useState<string>('');
  const [modoGeracao, setModoGeracao] = useState<'manual' | 'automatico'>('manual');
  
  // Opcoes de geracao automatica
  const [numLeitores1, setNumLeitores1] = useState(1);
  const [numLeitores2, setNumLeitores2] = useState(1);
  const [numMinistrosComunhao, setNumMinistrosComunhao] = useState(2);

  // Formulario manual
  const [leitura1Leitores, setLeitura1Leitores] = useState<string[]>([]);
  const [leitura2Leitores, setLeitura2Leitores] = useState<string[]>([]);
  const [salmista, setSalmista] = useState<string>('');
  const [ministroPalavra, setMinistroPalavra] = useState<string>('');
  const [ministrosComunhao, setMinistrosComunhao] = useState<string[]>([]);
  const [comunicador, setComunicador] = useState<string>('');

  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const missasProximas = missaService.listarProximas().filter(
      (m) => !escalaService.buscarPorMissa(m.id)
    );
    setMissas(missasProximas);
    setVoluntarios(voluntarioService.listar().filter((v) => v.ativo));

    if (missaIdParam) {
      setMissaSelecionada(missaIdParam);
    }
  }, [missaIdParam]);

  const missaAtual = missas.find((m) => m.id === missaSelecionada);

  const voluntariosPorFuncao = (funcao: TipoFuncao) =>
    voluntarios.filter((v) => v.funcoes.includes(funcao));

  const adicionarLeitor = (leitura: 1 | 2, voluntarioId: string) => {
    if (leitura === 1) {
      if (!leitura1Leitores.includes(voluntarioId) && leitura1Leitores.length < 2) {
        setLeitura1Leitores([...leitura1Leitores, voluntarioId]);
      }
    } else {
      if (!leitura2Leitores.includes(voluntarioId) && leitura2Leitores.length < 2) {
        setLeitura2Leitores([...leitura2Leitores, voluntarioId]);
      }
    }
  };

  const removerLeitor = (leitura: 1 | 2, voluntarioId: string) => {
    if (leitura === 1) {
      setLeitura1Leitores(leitura1Leitores.filter((id) => id !== voluntarioId));
    } else {
      setLeitura2Leitores(leitura2Leitores.filter((id) => id !== voluntarioId));
    }
  };

  const adicionarMinistroComunhao = (voluntarioId: string) => {
    if (!ministrosComunhao.includes(voluntarioId)) {
      setMinistrosComunhao([...ministrosComunhao, voluntarioId]);
    }
  };

  const removerMinistroComunhao = (voluntarioId: string) => {
    setMinistrosComunhao(ministrosComunhao.filter((id) => id !== voluntarioId));
  };

  const getNomeVoluntario = (id: string) => {
    return voluntarios.find((v) => v.id === id)?.nome || 'Desconhecido';
  };

  const handleGerarAutomatico = () => {
    if (!missaAtual) return;

    const verificacao = verificarDisponibilidadeMinima(missaAtual.data, {
      numLeitoresLeitura1: numLeitores1,
      numLeitoresLeitura2: numLeitores2,
      numMinistrosComunhao,
    });

    if (!verificacao.suficiente) {
      const faltandoStr = verificacao.faltando
        .map((f) => `${FUNCOES_LABELS[f.funcao]}: ${f.disponivel}/${f.necessario}`)
        .join(', ');
      setErro(`Voluntarios insuficientes: ${faltandoStr}`);
      return;
    }

    const escalaGerada = gerarEscalaAutomatica({
      missaId: missaSelecionada,
      data: missaAtual.data,
      numLeitoresLeitura1: numLeitores1,
      numLeitoresLeitura2: numLeitores2,
      numMinistrosComunhao,
    });

    setLeitura1Leitores(escalaGerada.leitura1.leitores);
    setLeitura2Leitores(escalaGerada.leitura2.leitores);
    setSalmista(escalaGerada.salmista || '');
    setMinistroPalavra(escalaGerada.ministroPalavra || '');
    setMinistrosComunhao(escalaGerada.ministrosComunhao);
    setComunicador(escalaGerada.comunicador || '');
    setErro('');
    setModoGeracao('manual');
  };

  const handleSalvar = () => {
    if (!missaSelecionada) {
      setErro('Selecione uma missa');
      return;
    }

    setLoading(true);
    try {
      escalaService.criar({
        missaId: missaSelecionada,
        leitura1: { leitores: leitura1Leitores },
        leitura2: { leitores: leitura2Leitores },
        salmista: salmista || null,
        ministroPalavra: ministroPalavra || null,
        ministrosComunhao,
        comunicador: comunicador || null,
        status: 'rascunho',
      });
      router.push('/escalas');
    } catch {
      setErro('Erro ao salvar escala');
    } finally {
      setLoading(false);
    }
  };

  const SeletorVoluntario = ({
    funcao,
    value,
    onChange,
    excluir = [],
  }: {
    funcao: TipoFuncao;
    value: string;
    onChange: (value: string) => void;
    excluir?: string[];
  }) => {
    const disponiveis = voluntariosPorFuncao(funcao).filter((v) => !excluir.includes(v.id));
    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={`Selecione ${FUNCOES_LABELS[funcao].toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Nenhum</SelectItem>
          {disponiveis.map((v) => (
            <SelectItem key={v.id} value={v.id}>
              {v.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  return (
    <AppShell>
      <Header
        title="Nova Escala"
        description="Crie uma nova escala para uma missa"
      />

      <div className="p-6">
        <div className="max-w-4xl">
          {/* Selecao da Missa */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-card-foreground">Selecionar Missa</CardTitle>
              <CardDescription>Escolha a missa para criar a escala</CardDescription>
            </CardHeader>
            <CardContent>
              {missas.length === 0 ? (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Nenhuma missa disponivel</AlertTitle>
                  <AlertDescription>
                    Todas as missas ja possuem escala ou nao ha missas futuras cadastradas.
                  </AlertDescription>
                </Alert>
              ) : (
                <Select value={missaSelecionada} onValueChange={setMissaSelecionada}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma missa" />
                  </SelectTrigger>
                  <SelectContent>
                    {missas.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {format(parseISO(m.data), "dd/MM/yyyy", { locale: ptBR })} - {m.horario} - {m.descricao || 'Missa'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {missaAtual && (
                <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {missaAtual.horario}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {missaAtual.local}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Geracao da Escala */}
          {missaSelecionada && (
            <Card className="mt-6 border-border bg-card">
              <CardHeader>
                <CardTitle className="text-card-foreground">Montar Escala</CardTitle>
                <CardDescription>
                  Escolha o modo de geracao da escala
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={modoGeracao} onValueChange={(v) => setModoGeracao(v as 'manual' | 'automatico')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="manual">Manual</TabsTrigger>
                    <TabsTrigger value="automatico">Automatico</TabsTrigger>
                  </TabsList>

                  <TabsContent value="automatico" className="mt-4">
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        O sistema ira selecionar automaticamente os voluntarios disponiveis,
                        priorizando aqueles com menos escalas recentes.
                      </p>

                      <FieldGroup>
                        <Field>
                          <FieldLabel>Leitores na 1a Leitura</FieldLabel>
                          <Select value={String(numLeitores1)} onValueChange={(v) => setNumLeitores1(Number(v))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 leitor</SelectItem>
                              <SelectItem value="2">2 leitores</SelectItem>
                            </SelectContent>
                          </Select>
                        </Field>
                        <Field>
                          <FieldLabel>Leitores na 2a Leitura</FieldLabel>
                          <Select value={String(numLeitores2)} onValueChange={(v) => setNumLeitores2(Number(v))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 leitor</SelectItem>
                              <SelectItem value="2">2 leitores</SelectItem>
                            </SelectContent>
                          </Select>
                        </Field>
                        <Field>
                          <FieldLabel>Ministros da Comunhao</FieldLabel>
                          <Select value={String(numMinistrosComunhao)} onValueChange={(v) => setNumMinistrosComunhao(Number(v))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[1, 2, 3, 4, 5, 6].map((n) => (
                                <SelectItem key={n} value={String(n)}>
                                  {n} ministro{n > 1 ? 's' : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </Field>
                      </FieldGroup>

                      <Button onClick={handleGerarAutomatico} className="w-full">
                        <Wand2 className="mr-2 h-4 w-4" />
                        Gerar Escala Automaticamente
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="manual" className="mt-4">
                    <div className="space-y-6">
                      {/* Leitura 1 */}
                      <Field>
                        <FieldLabel className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          1a Leitura (ate 2 leitores)
                        </FieldLabel>
                        <div className="mt-2 space-y-2">
                          <div className="flex flex-wrap gap-2">
                            {leitura1Leitores.map((id) => (
                              <Badge key={id} variant="secondary" className="gap-1">
                                {getNomeVoluntario(id)}
                                <button onClick={() => removerLeitor(1, id)}>
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                          {leitura1Leitores.length < 2 && (
                            <Select onValueChange={(v) => v !== 'none' && adicionarLeitor(1, v)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Adicionar leitor" />
                              </SelectTrigger>
                              <SelectContent>
                                {voluntariosPorFuncao('leitor')
                                  .filter((v) => !leitura1Leitores.includes(v.id) && !leitura2Leitores.includes(v.id))
                                  .map((v) => (
                                    <SelectItem key={v.id} value={v.id}>
                                      {v.nome}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </Field>

                      {/* Leitura 2 */}
                      <Field>
                        <FieldLabel className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          2a Leitura (ate 2 leitores)
                        </FieldLabel>
                        <div className="mt-2 space-y-2">
                          <div className="flex flex-wrap gap-2">
                            {leitura2Leitores.map((id) => (
                              <Badge key={id} variant="secondary" className="gap-1">
                                {getNomeVoluntario(id)}
                                <button onClick={() => removerLeitor(2, id)}>
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                          {leitura2Leitores.length < 2 && (
                            <Select onValueChange={(v) => v !== 'none' && adicionarLeitor(2, v)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Adicionar leitor" />
                              </SelectTrigger>
                              <SelectContent>
                                {voluntariosPorFuncao('leitor')
                                  .filter((v) => !leitura1Leitores.includes(v.id) && !leitura2Leitores.includes(v.id))
                                  .map((v) => (
                                    <SelectItem key={v.id} value={v.id}>
                                      {v.nome}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </Field>

                      {/* Salmista */}
                      <Field>
                        <FieldLabel>Salmista</FieldLabel>
                        <SeletorVoluntario
                          funcao="salmista"
                          value={salmista}
                          onChange={(v) => setSalmista(v === 'none' ? '' : v)}
                        />
                      </Field>

                      {/* Ministro da Palavra */}
                      <Field>
                        <FieldLabel>Ministro da Palavra</FieldLabel>
                        <SeletorVoluntario
                          funcao="ministro_palavra"
                          value={ministroPalavra}
                          onChange={(v) => setMinistroPalavra(v === 'none' ? '' : v)}
                        />
                      </Field>

                      {/* Ministros da Comunhao */}
                      <Field>
                        <FieldLabel className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Ministros da Comunhao
                        </FieldLabel>
                        <div className="mt-2 space-y-2">
                          <div className="flex flex-wrap gap-2">
                            {ministrosComunhao.map((id) => (
                              <Badge key={id} variant="secondary" className="gap-1">
                                {getNomeVoluntario(id)}
                                <button onClick={() => removerMinistroComunhao(id)}>
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                          <Select onValueChange={(v) => v !== 'none' && adicionarMinistroComunhao(v)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Adicionar ministro" />
                            </SelectTrigger>
                            <SelectContent>
                              {voluntariosPorFuncao('ministro_comunhao')
                                .filter((v) => !ministrosComunhao.includes(v.id))
                                .map((v) => (
                                  <SelectItem key={v.id} value={v.id}>
                                    {v.nome}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </Field>

                      {/* Comunicador */}
                      <Field>
                        <FieldLabel>Comunicador</FieldLabel>
                        <SeletorVoluntario
                          funcao="comunicador"
                          value={comunicador}
                          onChange={(v) => setComunicador(v === 'none' ? '' : v)}
                        />
                      </Field>
                    </div>
                  </TabsContent>
                </Tabs>

                {erro && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{erro}</AlertDescription>
                  </Alert>
                )}

                <div className="mt-6 flex justify-end gap-2">
                  <Button variant="outline" onClick={() => router.back()}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSalvar} disabled={loading}>
                    <Save className="mr-2 h-4 w-4" />
                    {loading ? 'Salvando...' : 'Salvar Escala'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}

export default function NovaEscalaPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-background"><p className="text-muted-foreground">Carregando...</p></div>}>
      <NovaEscalaContent />
    </Suspense>
  );
}
