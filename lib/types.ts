// Tipos de funcao na missa
export type TipoFuncao =
  | 'leitor'
  | 'salmista'
  | 'ministro_palavra'
  | 'ministro_comunhao'
  | 'comunicador';

export const FUNCOES_LABELS: Record<TipoFuncao, string> = {
  leitor: 'Leitor',
  salmista: 'Salmista',
  ministro_palavra: 'Ministro da Palavra',
  ministro_comunhao: 'Ministro da Comunhao',
  comunicador: 'Comunicador',
};

// Situacao Sacramental
export type SituacaoSacramental = 
  | 'batizado'
  | 'crismado'
  | 'casado'
  | 'ordenado';

export const SACRAMENTOS_LABELS: Record<SituacaoSacramental, string> = {
  batizado: 'Batizado',
  crismado: 'Crismado',
  casado: 'Casado',
  ordenado: 'Ordenado',
};

// Sexo
export type Sexo = 'masculino' | 'feminino';

export const SEXO_LABELS: Record<Sexo, string> = {
  masculino: 'Masculino',
  feminino: 'Feminino',
};

// Membro (antigo Voluntario)
export interface Membro {
  id: string;
  nome: string;
  dataNascimento: string;
  sexo: Sexo;
  telefone: string;
  email: string;
  sacramentos: SituacaoSacramental[];
  funcoes: TipoFuncao[];
  ativo: boolean;
  criadoEm: string;
}

// Missa
export interface Missa {
  id: string;
  data: string;
  horario: string;
  local: string;
  descricao?: string;
}

// Leitura com 1 ou 2 leitores
export interface Leitura {
  leitores: string[]; // IDs dos membros (1-2)
}

// Status da escala
export type StatusEscala = 'rascunho' | 'publicada' | 'concluida';

export const STATUS_LABELS: Record<StatusEscala, string> = {
  rascunho: 'Rascunho',
  publicada: 'Publicada',
  concluida: 'Concluida',
};

// Indisponibilidade de um membro na escala
export interface Indisponibilidade {
  membroId: string;
  funcao: string; // qual funcao estava escalado
  motivo?: string;
  substitutoId?: string; // quem vai substituir
  dataRegistro: string;
}

// Escala de uma missa
export interface Escala {
  id: string;
  missaId: string;
  leitura1: Leitura;
  leitura2: Leitura;
  salmista: string | null;
  ministroPalavra: string | null;
  ministrosComunhao: string[];
  comunicador: string | null;
  status: StatusEscala;
  indisponibilidades: Indisponibilidade[];
  criadaEm: string;
  atualizadaEm: string;
}

// Disponibilidade
export interface Disponibilidade {
  id: string;
  membroId: string;
  data: string;
  disponivel: boolean;
}

// Usuario para autenticacao (administrador/coordenador)
export interface Usuario {
  id: string;
  email: string;
  nome: string;
  role: 'admin' | 'coordenador' | 'membro';
  membroId?: string; // link para o membro se for um membro
}

// Tipos para formularios
export interface MembroFormData {
  nome: string;
  dataNascimento: string;
  sexo: Sexo;
  telefone: string;
  email: string;
  sacramentos: SituacaoSacramental[];
  funcoes: TipoFuncao[];
}

export interface MissaFormData {
  data: string;
  horario: string;
  local: string;
  descricao?: string;
}

export interface EscalaFormData {
  missaId: string;
  leitura1Leitores: string[];
  leitura2Leitores: string[];
  salmista: string;
  ministroPalavra: string;
  ministrosComunhao: string[];
  comunicador: string;
}

// Alias para compatibilidade (deprecated - usar Membro)
export type Voluntario = Membro;
