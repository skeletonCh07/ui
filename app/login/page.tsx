'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Church, LogIn, UserPlus, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/lib/contexts/auth-context';
import { 
  FUNCOES_LABELS, 
  SACRAMENTOS_LABELS, 
  SEXO_LABELS,
  type TipoFuncao, 
  type SituacaoSacramental,
  type Sexo 
} from '@/lib/types';

const TODAS_FUNCOES: TipoFuncao[] = ['leitor', 'salmista', 'ministro_palavra', 'ministro_comunhao', 'comunicador'];
const TODOS_SACRAMENTOS: SituacaoSacramental[] = ['batizado', 'crismado', 'casado', 'ordenado'];

export default function LoginPage() {
  const router = useRouter();
  const { login, registrar } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'registro'>('login');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  // Login form
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  // Registro form
  const [registroData, setRegistroData] = useState({
    nome: '',
    email: '',
    dataNascimento: '',
    sexo: '' as Sexo | '',
    telefone: '',
    sacramentos: [] as SituacaoSacramental[],
    funcoes: [] as TipoFuncao[],
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro('');

    const success = await login(email, senha);
    if (success) {
      router.push('/');
    } else {
      setErro('Email ou senha invalidos');
    }
    setLoading(false);
  };

  const handleRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro('');
    setSucesso('');

    // Validacoes
    if (!registroData.nome || !registroData.email || !registroData.dataNascimento || !registroData.sexo) {
      setErro('Preencha todos os campos obrigatorios');
      setLoading(false);
      return;
    }

    if (registroData.funcoes.length === 0) {
      setErro('Selecione pelo menos uma funcao');
      setLoading(false);
      return;
    }

    const result = await registrar({
      nome: registroData.nome,
      email: registroData.email,
      dataNascimento: registroData.dataNascimento,
      sexo: registroData.sexo as Sexo,
      telefone: registroData.telefone,
      sacramentos: registroData.sacramentos,
      funcoes: registroData.funcoes,
    });

    if (result.success) {
      setSucesso(result.message);
      setTimeout(() => router.push('/minha-disponibilidade'), 1500);
    } else {
      setErro(result.message);
    }
    setLoading(false);
  };

  const toggleSacramento = (sacramento: SituacaoSacramental) => {
    setRegistroData((prev) => ({
      ...prev,
      sacramentos: prev.sacramentos.includes(sacramento)
        ? prev.sacramentos.filter((s) => s !== sacramento)
        : [...prev.sacramentos, sacramento],
    }));
  };

  const toggleFuncao = (funcao: TipoFuncao) => {
    setRegistroData((prev) => ({
      ...prev,
      funcoes: prev.funcoes.includes(funcao)
        ? prev.funcoes.filter((f) => f !== funcao)
        : [...prev.funcoes, funcao],
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg border-border bg-card">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
            <Church className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="mt-4 text-2xl text-card-foreground">Escala Missa</CardTitle>
          <CardDescription>Sistema de Gestao de Liturgia</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as 'login' | 'registro'); setErro(''); setSucesso(''); }}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="registro">Cadastrar-me</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-6">
              <form onSubmit={handleLogin}>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="senha">Senha</FieldLabel>
                    <Input
                      id="senha"
                      type="password"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      placeholder="Sua senha"
                      required
                    />
                  </Field>
                </FieldGroup>

                {erro && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{erro}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="mt-6 w-full" disabled={loading}>
                  <LogIn className="mr-2 h-4 w-4" />
                  {loading ? 'Entrando...' : 'Entrar'}
                </Button>

                <p className="mt-4 text-center text-sm text-muted-foreground">
                  Coordenador? Use qualquer email/senha para acessar.
                </p>
              </form>
            </TabsContent>

            <TabsContent value="registro" className="mt-6">
              <form onSubmit={handleRegistro}>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="reg-nome">Nome completo *</FieldLabel>
                    <Input
                      id="reg-nome"
                      value={registroData.nome}
                      onChange={(e) => setRegistroData({ ...registroData, nome: e.target.value })}
                      placeholder="Seu nome completo"
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="reg-email">Email *</FieldLabel>
                    <Input
                      id="reg-email"
                      type="email"
                      value={registroData.email}
                      onChange={(e) => setRegistroData({ ...registroData, email: e.target.value })}
                      placeholder="seu@email.com"
                      required
                    />
                  </Field>

                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="reg-nascimento">Data de Nascimento *</FieldLabel>
                      <Input
                        id="reg-nascimento"
                        type="date"
                        value={registroData.dataNascimento}
                        onChange={(e) => setRegistroData({ ...registroData, dataNascimento: e.target.value })}
                        required
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="reg-sexo">Sexo *</FieldLabel>
                      <Select
                        value={registroData.sexo}
                        onValueChange={(v) => setRegistroData({ ...registroData, sexo: v as Sexo })}
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
                    <FieldLabel htmlFor="reg-telefone">Telefone</FieldLabel>
                    <Input
                      id="reg-telefone"
                      value={registroData.telefone}
                      onChange={(e) => setRegistroData({ ...registroData, telefone: e.target.value })}
                      placeholder="(00) 00000-0000"
                    />
                  </Field>

                  <Field>
                    <FieldLabel>Situacao Sacramental</FieldLabel>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {TODOS_SACRAMENTOS.map((sacramento) => (
                        <label key={sacramento} className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={registroData.sacramentos.includes(sacramento)}
                            onCheckedChange={() => toggleSacramento(sacramento)}
                          />
                          <span className="text-sm text-foreground">{SACRAMENTOS_LABELS[sacramento]}</span>
                        </label>
                      ))}
                    </div>
                  </Field>

                  <Field>
                    <FieldLabel>Funcoes que pode desempenhar *</FieldLabel>
                    <div className="mt-2 space-y-2">
                      {TODAS_FUNCOES.map((funcao) => (
                        <label key={funcao} className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={registroData.funcoes.includes(funcao)}
                            onCheckedChange={() => toggleFuncao(funcao)}
                          />
                          <span className="text-sm text-foreground">{FUNCOES_LABELS[funcao]}</span>
                        </label>
                      ))}
                    </div>
                  </Field>
                </FieldGroup>

                {erro && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{erro}</AlertDescription>
                  </Alert>
                )}

                {sucesso && (
                  <Alert className="mt-4 border-primary bg-primary/10">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <AlertDescription className="text-primary">{sucesso}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="mt-6 w-full" disabled={loading}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  {loading ? 'Cadastrando...' : 'Cadastrar'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
