import type { Membro, Escala, TipoFuncao } from '@/lib/types';
import { membroService, escalaService, disponibilidadeService } from './data-service';

interface GeradorOpcoes {
  missaId: string;
  data: string;
  numLeitoresLeitura1?: number; // 1 ou 2
  numLeitoresLeitura2?: number; // 1 ou 2
  numMinistrosComunhao?: number; // 1 a N
}

// Conta quantas vezes um membro foi escalado recentemente
function contarEscalasRecentes(membroId: string, dias: number = 30): number {
  const escalas = escalaService.listar();
  const dataLimite = new Date();
  dataLimite.setDate(dataLimite.getDate() - dias);

  let count = 0;
  for (const escala of escalas) {
    // Verificar todas as posicoes da escala
    if (escala.leitura1.leitores.includes(membroId)) count++;
    if (escala.leitura2.leitores.includes(membroId)) count++;
    if (escala.salmista === membroId) count++;
    if (escala.ministroPalavra === membroId) count++;
    if (escala.ministrosComunhao.includes(membroId)) count++;
    if (escala.comunicador === membroId) count++;
  }
  return count;
}

// Obtem membros disponiveis para uma funcao em uma data
function obterMembrosDisponiveis(
  funcao: TipoFuncao,
  data: string,
  excluirIds: string[] = []
): Membro[] {
  const membros = membroService.listarPorFuncao(funcao);
  
  return membros
    .filter((m) => !excluirIds.includes(m.id))
    .filter((m) => disponibilidadeService.verificarDisponibilidade(m.id, data))
    .map((m) => ({
      ...m,
      _escalasRecentes: contarEscalasRecentes(m.id),
    }))
    .sort((a, b) => (a as typeof a & { _escalasRecentes: number })._escalasRecentes - (b as typeof b & { _escalasRecentes: number })._escalasRecentes);
}

// Seleciona N membros com menor numero de escalas recentes
function selecionarMembros(
  funcao: TipoFuncao,
  data: string,
  quantidade: number,
  excluirIds: string[] = []
): string[] {
  const disponiveis = obterMembrosDisponiveis(funcao, data, excluirIds);
  return disponiveis.slice(0, quantidade).map((m) => m.id);
}

// Gera uma escala automatica
export function gerarEscalaAutomatica(opcoes: GeradorOpcoes): Omit<Escala, 'id' | 'criadaEm' | 'atualizadaEm' | 'indisponibilidades'> {
  const {
    missaId,
    data,
    numLeitoresLeitura1 = 1,
    numLeitoresLeitura2 = 1,
    numMinistrosComunhao = 2,
  } = opcoes;

  const usados: string[] = [];

  // Selecionar leitores para leitura 1
  const leitura1Leitores = selecionarMembros('leitor', data, numLeitoresLeitura1, usados);
  usados.push(...leitura1Leitores);

  // Selecionar leitores para leitura 2
  const leitura2Leitores = selecionarMembros('leitor', data, numLeitoresLeitura2, usados);
  usados.push(...leitura2Leitores);

  // Selecionar salmista
  const salmistas = selecionarMembros('salmista', data, 1, usados);
  const salmista = salmistas[0] || null;
  if (salmista) usados.push(salmista);

  // Selecionar ministro da palavra
  const ministrosPalavra = selecionarMembros('ministro_palavra', data, 1, usados);
  const ministroPalavra = ministrosPalavra[0] || null;
  if (ministroPalavra) usados.push(ministroPalavra);

  // Selecionar ministros da comunhao
  const ministrosComunhao = selecionarMembros('ministro_comunhao', data, numMinistrosComunhao, usados);
  usados.push(...ministrosComunhao);

  // Selecionar comunicador
  const comunicadores = selecionarMembros('comunicador', data, 1, usados);
  const comunicador = comunicadores[0] || null;

  return {
    missaId,
    leitura1: { leitores: leitura1Leitores },
    leitura2: { leitores: leitura2Leitores },
    salmista,
    ministroPalavra,
    ministrosComunhao,
    comunicador,
    status: 'rascunho',
  };
}

// Verifica se ha membros suficientes para gerar escala
export function verificarDisponibilidadeMinima(
  data: string,
  opcoes: {
    numLeitoresLeitura1?: number;
    numLeitoresLeitura2?: number;
    numMinistrosComunhao?: number;
  } = {}
): {
  suficiente: boolean;
  faltando: { funcao: TipoFuncao; necessario: number; disponivel: number }[];
} {
  const {
    numLeitoresLeitura1 = 1,
    numLeitoresLeitura2 = 1,
    numMinistrosComunhao = 2,
  } = opcoes;

  const verificacoes: { funcao: TipoFuncao; necessario: number }[] = [
    { funcao: 'leitor', necessario: numLeitoresLeitura1 + numLeitoresLeitura2 },
    { funcao: 'salmista', necessario: 1 },
    { funcao: 'ministro_palavra', necessario: 1 },
    { funcao: 'ministro_comunhao', necessario: numMinistrosComunhao },
    { funcao: 'comunicador', necessario: 1 },
  ];

  const faltando: { funcao: TipoFuncao; necessario: number; disponivel: number }[] = [];

  for (const { funcao, necessario } of verificacoes) {
    const disponiveis = obterMembrosDisponiveis(funcao, data);
    if (disponiveis.length < necessario) {
      faltando.push({
        funcao,
        necessario,
        disponivel: disponiveis.length,
      });
    }
  }

  return {
    suficiente: faltando.length === 0,
    faltando,
  };
}
