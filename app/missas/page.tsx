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
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field';
import {
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Clock,
  MapPin,
  Church,
  CalendarPlus,
} from 'lucide-react';
import { missaService, escalaService } from '@/lib/services/data-service';
import type { Missa } from '@/lib/types';
import { format, parseISO, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';

export default function MissasPage() {
  const [missas, setMissas] = useState<Missa[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<Missa | null>(null);
  const [formData, setFormData] = useState({
    data: '',
    horario: '',
    local: '',
    descricao: '',
  });

  const carregarMissas = () => {
    const todas = missaService.listar();
    todas.sort((a, b) => {
      const dateCompare = a.data.localeCompare(b.data);
      if (dateCompare !== 0) return dateCompare;
      return a.horario.localeCompare(b.horario);
    });
    setMissas(todas);
  };

  useEffect(() => {
    carregarMissas();
  }, []);

  const abrirDialogNovo = () => {
    setEditando(null);
    const hoje = new Date().toISOString().split('T')[0];
    setFormData({ data: hoje, horario: '08:00', local: '', descricao: '' });
    setDialogOpen(true);
  };

  const abrirDialogEditar = (missa: Missa) => {
    setEditando(missa);
    setFormData({
      data: missa.data,
      horario: missa.horario,
      local: missa.local,
      descricao: missa.descricao || '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editando) {
      missaService.atualizar(editando.id, formData);
    } else {
      missaService.criar(formData);
    }
    setDialogOpen(false);
    carregarMissas();
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta missa?')) {
      missaService.excluir(id);
      carregarMissas();
    }
  };

  const hoje = startOfDay(new Date());
  const missasFuturas = missas.filter((m) => !isBefore(parseISO(m.data), hoje));
  const missasPassadas = missas.filter((m) => isBefore(parseISO(m.data), hoje));

  const temEscala = (missaId: string) => {
    return !!escalaService.buscarPorMissa(missaId);
  };

  const MissaCard = ({ missa }: { missa: Missa }) => {
    const passada = isBefore(parseISO(missa.data), hoje);
    const escalaExiste = temEscala(missa.id);

    return (
      <Card className={`border-border bg-card ${passada ? 'opacity-60' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 flex-col items-center justify-center rounded-lg bg-primary/10">
                <span className="text-xs text-muted-foreground">
                  {format(parseISO(missa.data), 'MMM', { locale: ptBR }).toUpperCase()}
                </span>
                <span className="text-xl font-bold text-primary">
                  {format(parseISO(missa.data), 'd')}
                </span>
              </div>
              <div>
                <p className="font-medium text-card-foreground">
                  {missa.descricao || 'Missa'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(parseISO(missa.data), "EEEE", { locale: ptBR })}
                </p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => abrirDialogEditar(missa)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                {!escalaExiste && !passada && (
                  <Link href={`/escalas/nova?missaId=${missa.id}`}>
                    <DropdownMenuItem>
                      <CalendarPlus className="mr-2 h-4 w-4" />
                      Criar Escala
                    </DropdownMenuItem>
                  </Link>
                )}
                <DropdownMenuItem
                  onClick={() => handleDelete(missa.id)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {missa.horario}
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {missa.local}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            {escalaExiste ? (
              <Badge variant="default">Com Escala</Badge>
            ) : (
              <Badge variant="outline">Sem Escala</Badge>
            )}
            {!passada && !escalaExiste && (
              <Link href={`/escalas/nova?missaId=${missa.id}`}>
                <Button size="sm" variant="outline">
                  <CalendarPlus className="mr-2 h-4 w-4" />
                  Criar Escala
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <AppShell>
      <Header
        title="Missas"
        description="Gerencie as missas da paroquia"
        action={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={abrirDialogNovo}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Missa
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{editando ? 'Editar Missa' : 'Nova Missa'}</DialogTitle>
                <DialogDescription>
                  {editando ? 'Atualize os dados da missa' : 'Cadastre uma nova missa'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="mt-4">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="data">Data</FieldLabel>
                    <Input
                      id="data"
                      type="date"
                      value={formData.data}
                      onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="horario">Horario</FieldLabel>
                    <Input
                      id="horario"
                      type="time"
                      value={formData.horario}
                      onChange={(e) => setFormData({ ...formData, horario: e.target.value })}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="local">Local</FieldLabel>
                    <Input
                      id="local"
                      value={formData.local}
                      onChange={(e) => setFormData({ ...formData, local: e.target.value })}
                      placeholder="Ex: Igreja Matriz"
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="descricao">Descricao (opcional)</FieldLabel>
                    <Input
                      id="descricao"
                      value={formData.descricao}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                      placeholder="Ex: Missa de Pascoa"
                    />
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
        {missas.length === 0 ? (
          <Card className="border-border bg-card">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Church className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">Nenhuma missa cadastrada</p>
              <Button className="mt-4" onClick={abrirDialogNovo}>
                <Plus className="mr-2 h-4 w-4" />
                Cadastrar primeira missa
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Missas Futuras */}
            <div>
              <h2 className="mb-4 text-lg font-semibold text-foreground">
                Proximas Missas ({missasFuturas.length})
              </h2>
              {missasFuturas.length === 0 ? (
                <p className="text-muted-foreground">Nenhuma missa futura cadastrada</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {missasFuturas.map((missa) => (
                    <MissaCard key={missa.id} missa={missa} />
                  ))}
                </div>
              )}
            </div>

            {/* Missas Passadas */}
            {missasPassadas.length > 0 && (
              <div>
                <h2 className="mb-4 text-lg font-semibold text-foreground">
                  Missas Anteriores ({missasPassadas.length})
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {missasPassadas.slice(0, 6).map((missa) => (
                    <MissaCard key={missa.id} missa={missa} />
                  ))}
                </div>
                {missasPassadas.length > 6 && (
                  <p className="mt-4 text-center text-sm text-muted-foreground">
                    E mais {missasPassadas.length - 6} missas anteriores...
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
