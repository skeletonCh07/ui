'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Header } from '@/components/layout/header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field';
import {
  Plus,
  Search,
  MoreVertical,
  Pencil,
  Trash2,
  Phone,
  Mail,
  UserCheck,
  UserX,
  Calendar,
  Heart,
  Briefcase,
} from 'lucide-react';
import { membroService } from '@/lib/services/data-service';
import { 
  FUNCOES_LABELS, 
  SACRAMENTOS_LABELS,
  SEXO_LABELS,
  type Membro, 
  type TipoFuncao,
  type SituacaoSacramental,
  type Sexo
} from '@/lib/types';
import { format, parseISO, differenceInYears } from 'date-fns';

const TODAS_FUNCOES: TipoFuncao[] = ['leitor', 'salmista', 'ministro_palavra', 'ministro_comunhao', 'comunicador'];
const TODOS_SACRAMENTOS: SituacaoSacramental[] = ['batizado', 'crismado', 'casado', 'ordenado'];

export default function MembrosPage() {
  const [membros, setMembros] = useState<Membro[]>([]);
  const [busca, setBusca] = useState('');
  const [filtroFuncao, setFiltroFuncao] = useState<TipoFuncao | 'todas'>('todas');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<Membro | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    dataNascimento: '',
    sexo: '' as Sexo | '',
    telefone: '',
    email: '',
    sacramentos: [] as SituacaoSacramental[],
    funcoes: [] as TipoFuncao[],
  });

  const carregarMembros = () => {
    setMembros(membroService.listar());
  };

  useEffect(() => {
    carregarMembros();
  }, []);

  const membrosFiltrados = membros.filter((m) => {
    const matchBusca = m.nome.toLowerCase().includes(busca.toLowerCase()) ||
      m.email.toLowerCase().includes(busca.toLowerCase());
    const matchFuncao = filtroFuncao === 'todas' || m.funcoes.includes(filtroFuncao);
    return matchBusca && matchFuncao;
  });

  const abrirDialogNovo = () => {
    setEditando(null);
    setFormData({ 
      nome: '', 
      dataNascimento: '',
      sexo: '',
      telefone: '', 
      email: '', 
      sacramentos: [],
      funcoes: [] 
    });
    setDialogOpen(true);
  };

  const abrirDialogEditar = (membro: Membro) => {
    setEditando(membro);
    setFormData({
      nome: membro.nome,
      dataNascimento: membro.dataNascimento,
      sexo: membro.sexo,
      telefone: membro.telefone,
      email: membro.email,
      sacramentos: [...membro.sacramentos],
      funcoes: [...membro.funcoes],
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editando) {
      membroService.atualizar(editando.id, {
        ...formData,
        sexo: formData.sexo as Sexo,
      });
    } else {
      membroService.criar({ 
        ...formData, 
        sexo: formData.sexo as Sexo,
        ativo: true 
      });
    }
    setDialogOpen(false);
    carregarMembros();
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este membro?')) {
      membroService.excluir(id);
      carregarMembros();
    }
  };

  const toggleAtivo = (membro: Membro) => {
    membroService.atualizar(membro.id, { ativo: !membro.ativo });
    carregarMembros();
  };

  const toggleFuncao = (funcao: TipoFuncao) => {
    setFormData((prev) => ({
      ...prev,
      funcoes: prev.funcoes.includes(funcao)
        ? prev.funcoes.filter((f) => f !== funcao)
        : [...prev.funcoes, funcao],
    }));
  };

  const toggleSacramento = (sacramento: SituacaoSacramental) => {
    setFormData((prev) => ({
      ...prev,
      sacramentos: prev.sacramentos.includes(sacramento)
        ? prev.sacramentos.filter((s) => s !== sacramento)
        : [...prev.sacramentos, sacramento],
    }));
  };

  const calcularIdade = (dataNascimento: string) => {
    try {
      return differenceInYears(new Date(), parseISO(dataNascimento));
    } catch {
      return null;
    }
  };

  return (
    <AppShell>
      <Header
        title="Membros"
        description="Gerencie os membros da paroquia"
        action={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={abrirDialogNovo}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Membro
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editando ? 'Editar Membro' : 'Novo Membro'}</DialogTitle>
                <DialogDescription>
                  {editando ? 'Atualize os dados do membro' : 'Cadastre um novo membro'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="mt-4">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="nome">Nome</FieldLabel>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      placeholder="Nome completo"
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="email@exemplo.com"
                      required
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="dataNascimento">Data de Nascimento</FieldLabel>
                      <Input
                        id="dataNascimento"
                        type="date"
                        value={formData.dataNascimento}
                        onChange={(e) => setFormData({ ...formData, dataNascimento: e.target.value })}
                        required
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="sexo">Sexo</FieldLabel>
                      <Select
                        value={formData.sexo}
                        onValueChange={(v) => setFormData({ ...formData, sexo: v as Sexo })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="masculino">{SEXO_LABELS.masculino}</SelectItem>
                          <SelectItem value="feminino">{SEXO_LABELS.feminino}</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
                  <Field>
                    <FieldLabel htmlFor="telefone">Telefone</FieldLabel>
                    <Input
                      id="telefone"
                      value={formData.telefone}
                      onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                      placeholder="(00) 00000-0000"
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Situacao Sacramental</FieldLabel>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {TODOS_SACRAMENTOS.map((sacramento) => (
                        <label key={sacramento} className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={formData.sacramentos.includes(sacramento)}
                            onCheckedChange={() => toggleSacramento(sacramento)}
                          />
                          <span className="text-sm text-foreground">{SACRAMENTOS_LABELS[sacramento]}</span>
                        </label>
                      ))}
                    </div>
                  </Field>
                  <Field>
                    <FieldLabel>Funcoes</FieldLabel>
                    <div className="mt-2 space-y-2">
                      {TODAS_FUNCOES.map((funcao) => (
                        <label key={funcao} className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={formData.funcoes.includes(funcao)}
                            onCheckedChange={() => toggleFuncao(funcao)}
                          />
                          <span className="text-sm text-foreground">{FUNCOES_LABELS[funcao]}</span>
                        </label>
                      ))}
                    </div>
                  </Field>
                </FieldGroup>
                <div className="mt-6 flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editando ? 'Salvar' : 'Cadastrar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="p-6">
        {/* Filtros */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={filtroFuncao === 'todas' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFiltroFuncao('todas')}
            >
              Todas
            </Button>
            {TODAS_FUNCOES.map((funcao) => (
              <Button
                key={funcao}
                variant={filtroFuncao === funcao ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltroFuncao(funcao)}
              >
                {FUNCOES_LABELS[funcao]}
              </Button>
            ))}
          </div>
        </div>

        {/* Lista */}
        {membrosFiltrados.length === 0 ? (
          <Card className="border-border bg-card">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <UserCheck className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">
                {membros.length === 0
                  ? 'Nenhum membro cadastrado'
                  : 'Nenhum membro encontrado'}
              </p>
              {membros.length === 0 && (
                <Button className="mt-4" onClick={abrirDialogNovo}>
                  <Plus className="mr-2 h-4 w-4" />
                  Cadastrar primeiro membro
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {membrosFiltrados.map((membro) => {
              const idade = calcularIdade(membro.dataNascimento);
              return (
                <Card key={membro.id} className={`border-border bg-card transition-all hover:shadow-lg ${!membro.ativo ? 'opacity-60' : ''}`}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30 text-primary font-semibold text-lg flex-shrink-0">
                          {membro.nome.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-card-foreground text-base truncate">{membro.nome}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge variant={membro.ativo ? 'default' : 'secondary'} className="text-xs">
                              {membro.ativo ? 'Ativo' : 'Inativo'}
                            </Badge>
                            {idade && (
                              <span className="text-xs text-muted-foreground">{idade} anos</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => abrirDialogEditar(membro)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleAtivo(membro)}>
                            {membro.ativo ? (
                              <>
                                <UserX className="mr-2 h-4 w-4" />
                                Desativar
                              </>
                            ) : (
                              <>
                                <UserCheck className="mr-2 h-4 w-4" />
                                Ativar
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(membro.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2 bg-secondary/50 px-3 py-1.5 rounded-lg">
                        <Mail className="h-4 w-4 text-primary/60" />
                        <span className="truncate text-xs sm:text-sm">{membro.email}</span>
                      </div>
                      {membro.telefone && (
                        <div className="flex items-center gap-2 bg-secondary/50 px-3 py-1.5 rounded-lg">
                          <Phone className="h-4 w-4 text-primary/60" />
                          <span>{membro.telefone}</span>
                        </div>
                      )}
                      {membro.dataNascimento && (
                        <div className="flex items-center gap-2 bg-secondary/50 px-3 py-1.5 rounded-lg">
                          <Calendar className="h-4 w-4 text-primary/60" />
                          <span>{format(parseISO(membro.dataNascimento), 'dd/MM/yyyy')}</span>
                        </div>
                      )}
                    </div>

                    {membro.sacramentos.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border/50">
                        <div className="flex items-center gap-2 mb-2">
                          <Heart className="h-3.5 w-3.5 text-primary/60" />
                          <span className="text-xs font-semibold text-muted-foreground uppercase">Sacramentos</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {membro.sacramentos.map((sacramento) => (
                            <Badge key={sacramento} variant="secondary" className="text-xs">
                              {SACRAMENTOS_LABELS[sacramento]}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {membro.funcoes.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border/50">
                        <div className="flex items-center gap-2 mb-2">
                          <Briefcase className="h-3.5 w-3.5 text-primary/60" />
                          <span className="text-xs font-semibold text-muted-foreground uppercase">Funções</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {membro.funcoes.map((funcao) => (
                            <Badge key={funcao} variant="outline" className="text-xs">
                              {FUNCOES_LABELS[funcao]}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
