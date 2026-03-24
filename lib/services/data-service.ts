import type { Membro, Missa, Escala, Disponibilidade, Indisponibilidade } from '@/lib/types';

// Chaves do localStorage
const KEYS = {
  membros: 'escala-missa:membros',
  missas: 'escala-missa:missas',
  escalas: 'escala-missa:escalas',
  disponibilidades: 'escala-missa:disponibilidades',
} as const;

// Helpers
function getItem<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

function setItem<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ======================
// Membros
// ======================
export const membroService = {
  listar: (): Membro[] => {
    return getItem<Membro>(KEYS.membros);
  },

  buscarPorId: (id: string): Membro | undefined => {
    const membros = getItem<Membro>(KEYS.membros);
    return membros.find((m) => m.id === id);
  },

  buscarPorEmail: (email: string): Membro | undefined => {
    const membros = getItem<Membro>(KEYS.membros);
    return membros.find((m) => m.email.toLowerCase() === email.toLowerCase());
  },

  criar: (data: Omit<Membro, 'id' | 'criadoEm'>): Membro => {
    const membros = getItem<Membro>(KEYS.membros);
    const novo: Membro = {
      ...data,
      id: generateId(),
      criadoEm: new Date().toISOString(),
    };
    membros.push(novo);
    setItem(KEYS.membros, membros);
    return novo;
  },

  atualizar: (id: string, data: Partial<Membro>): Membro | undefined => {
    const membros = getItem<Membro>(KEYS.membros);
    const index = membros.findIndex((m) => m.id === id);
    if (index === -1) return undefined;
    membros[index] = { ...membros[index], ...data };
    setItem(KEYS.membros, membros);
    return membros[index];
  },

  excluir: (id: string): boolean => {
    const membros = getItem<Membro>(KEYS.membros);
    const filtered = membros.filter((m) => m.id !== id);
    if (filtered.length === membros.length) return false;
    setItem(KEYS.membros, filtered);
    return true;
  },

  listarPorFuncao: (funcao: string): Membro[] => {
    const membros = getItem<Membro>(KEYS.membros);
    return membros.filter((m) => m.ativo && m.funcoes.includes(funcao as Membro['funcoes'][number]));
  },

  listarAtivos: (): Membro[] => {
    const membros = getItem<Membro>(KEYS.membros);
    return membros.filter((m) => m.ativo);
  },
};

// Alias para compatibilidade
export const voluntarioService = membroService;

// ======================
// Missas
// ======================
export const missaService = {
  listar: (): Missa[] => {
    return getItem<Missa>(KEYS.missas);
  },

  buscarPorId: (id: string): Missa | undefined => {
    const missas = getItem<Missa>(KEYS.missas);
    return missas.find((m) => m.id === id);
  },

  criar: (data: Omit<Missa, 'id'>): Missa => {
    const missas = getItem<Missa>(KEYS.missas);
    const nova: Missa = {
      ...data,
      id: generateId(),
    };
    missas.push(nova);
    setItem(KEYS.missas, missas);
    return nova;
  },

  atualizar: (id: string, data: Partial<Missa>): Missa | undefined => {
    const missas = getItem<Missa>(KEYS.missas);
    const index = missas.findIndex((m) => m.id === id);
    if (index === -1) return undefined;
    missas[index] = { ...missas[index], ...data };
    setItem(KEYS.missas, missas);
    return missas[index];
  },

  excluir: (id: string): boolean => {
    const missas = getItem<Missa>(KEYS.missas);
    const filtered = missas.filter((m) => m.id !== id);
    if (filtered.length === missas.length) return false;
    setItem(KEYS.missas, filtered);
    return true;
  },

  listarProximas: (): Missa[] => {
    const missas = getItem<Missa>(KEYS.missas);
    const hoje = new Date().toISOString().split('T')[0];
    return missas
      .filter((m) => m.data >= hoje)
      .sort((a, b) => a.data.localeCompare(b.data) || a.horario.localeCompare(b.horario));
  },
};

// ======================
// Escalas
// ======================
export const escalaService = {
  listar: (): Escala[] => {
    return getItem<Escala>(KEYS.escalas);
  },

  buscarPorId: (id: string): Escala | undefined => {
    const escalas = getItem<Escala>(KEYS.escalas);
    return escalas.find((e) => e.id === id);
  },

  buscarPorMissa: (missaId: string): Escala | undefined => {
    const escalas = getItem<Escala>(KEYS.escalas);
    return escalas.find((e) => e.missaId === missaId);
  },

  criar: (data: Omit<Escala, 'id' | 'criadaEm' | 'atualizadaEm' | 'indisponibilidades'>): Escala => {
    const escalas = getItem<Escala>(KEYS.escalas);
    const agora = new Date().toISOString();
    const nova: Escala = {
      ...data,
      id: generateId(),
      indisponibilidades: [],
      criadaEm: agora,
      atualizadaEm: agora,
    };
    escalas.push(nova);
    setItem(KEYS.escalas, escalas);
    return nova;
  },

  atualizar: (id: string, data: Partial<Escala>): Escala | undefined => {
    const escalas = getItem<Escala>(KEYS.escalas);
    const index = escalas.findIndex((e) => e.id === id);
    if (index === -1) return undefined;
    escalas[index] = {
      ...escalas[index],
      ...data,
      atualizadaEm: new Date().toISOString(),
    };
    setItem(KEYS.escalas, escalas);
    return escalas[index];
  },

  excluir: (id: string): boolean => {
    const escalas = getItem<Escala>(KEYS.escalas);
    const filtered = escalas.filter((e) => e.id !== id);
    if (filtered.length === escalas.length) return false;
    setItem(KEYS.escalas, filtered);
    return true;
  },

  // Registrar indisponibilidade e substituir membro
  registrarIndisponibilidade: (
    escalaId: string,
    indisponibilidade: Omit<Indisponibilidade, 'dataRegistro'>
  ): Escala | undefined => {
    const escalas = getItem<Escala>(KEYS.escalas);
    const index = escalas.findIndex((e) => e.id === escalaId);
    if (index === -1) return undefined;

    const escala = escalas[index];
    const novaIndisponibilidade: Indisponibilidade = {
      ...indisponibilidade,
      dataRegistro: new Date().toISOString(),
    };

    // Adicionar indisponibilidade
    escala.indisponibilidades = [...(escala.indisponibilidades || []), novaIndisponibilidade];

    // Substituir o membro se houver substituto
    if (indisponibilidade.substitutoId) {
      const { membroId, substitutoId, funcao } = indisponibilidade;

      // Substituir na funcao apropriada
      if (funcao === 'leitura1') {
        escala.leitura1.leitores = escala.leitura1.leitores.map(id =>
          id === membroId ? substitutoId : id
        );
      } else if (funcao === 'leitura2') {
        escala.leitura2.leitores = escala.leitura2.leitores.map(id =>
          id === membroId ? substitutoId : id
        );
      } else if (funcao === 'salmista' && escala.salmista === membroId) {
        escala.salmista = substitutoId;
      } else if (funcao === 'ministro_palavra' && escala.ministroPalavra === membroId) {
        escala.ministroPalavra = substitutoId;
      } else if (funcao === 'ministro_comunhao') {
        escala.ministrosComunhao = escala.ministrosComunhao.map(id =>
          id === membroId ? substitutoId : id
        );
      } else if (funcao === 'comunicador' && escala.comunicador === membroId) {
        escala.comunicador = substitutoId;
      }
    }

    escala.atualizadaEm = new Date().toISOString();
    escalas[index] = escala;
    setItem(KEYS.escalas, escalas);
    return escala;
  },
};

// ======================
// Disponibilidades
// ======================
export const disponibilidadeService = {
  listar: (): Disponibilidade[] => {
    return getItem<Disponibilidade>(KEYS.disponibilidades);
  },

  listarPorMembro: (membroId: string): Disponibilidade[] => {
    const disponibilidades = getItem<Disponibilidade>(KEYS.disponibilidades);
    return disponibilidades.filter((d) => d.membroId === membroId);
  },

  listarPorVoluntario: (voluntarioId: string): Disponibilidade[] => {
    // Alias para compatibilidade
    return disponibilidadeService.listarPorMembro(voluntarioId);
  },

  listarPorData: (data: string): Disponibilidade[] => {
    const disponibilidades = getItem<Disponibilidade>(KEYS.disponibilidades);
    return disponibilidades.filter((d) => d.data === data && d.disponivel);
  },

  definir: (membroId: string, data: string, disponivel: boolean): Disponibilidade => {
    const disponibilidades = getItem<Disponibilidade>(KEYS.disponibilidades);
    const existente = disponibilidades.findIndex(
      (d) => d.membroId === membroId && d.data === data
    );

    if (existente !== -1) {
      disponibilidades[existente].disponivel = disponivel;
      setItem(KEYS.disponibilidades, disponibilidades);
      return disponibilidades[existente];
    }

    const nova: Disponibilidade = {
      id: generateId(),
      membroId,
      data,
      disponivel,
    };
    disponibilidades.push(nova);
    setItem(KEYS.disponibilidades, disponibilidades);
    return nova;
  },

  verificarDisponibilidade: (membroId: string, data: string): boolean => {
    const disponibilidades = getItem<Disponibilidade>(KEYS.disponibilidades);
    const registro = disponibilidades.find(
      (d) => d.membroId === membroId && d.data === data
    );
    return registro ? registro.disponivel : true; // Por padrao, disponivel
  },
};
