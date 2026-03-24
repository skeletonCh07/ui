'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Usuario, Membro } from '@/lib/types';
import { membroService } from '@/lib/services/data-service';

interface AuthContextType {
  usuario: Usuario | null;
  membro: Membro | null;
  isLoading: boolean;
  login: (email: string, senha: string) => Promise<boolean>;
  logout: () => void;
  registrar: (dadosMembro: Omit<Membro, 'id' | 'criadoEm' | 'ativo'>) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_KEY = 'escala-missa:auth';

// Usuario padrao para demonstracao (admin)
const USUARIO_ADMIN: Usuario = {
  id: 'admin-1',
  email: 'admin@paroquia.com',
  nome: 'Administrador',
  role: 'admin',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [membro, setMembro] = useState<Membro | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar se ha usuario logado
    const stored = localStorage.getItem(AUTH_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUsuario(parsed.usuario);
        if (parsed.membroId) {
          const membroData = membroService.buscarPorId(parsed.membroId);
          setMembro(membroData || null);
        }
      } catch {
        localStorage.removeItem(AUTH_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, senha: string): Promise<boolean> => {
    // Verificar se e admin
    if (email === 'admin@paroquia.com') {
      setUsuario(USUARIO_ADMIN);
      setMembro(null);
      localStorage.setItem(AUTH_KEY, JSON.stringify({ usuario: USUARIO_ADMIN }));
      return true;
    }

    // Verificar se e um membro registrado
    const membroEncontrado = membroService.buscarPorEmail(email);
    if (membroEncontrado) {
      const user: Usuario = {
        id: `membro-${membroEncontrado.id}`,
        email: membroEncontrado.email,
        nome: membroEncontrado.nome,
        role: 'membro',
        membroId: membroEncontrado.id,
      };
      setUsuario(user);
      setMembro(membroEncontrado);
      localStorage.setItem(AUTH_KEY, JSON.stringify({ usuario: user, membroId: membroEncontrado.id }));
      return true;
    }

    // Para demo: aceitar qualquer email como coordenador
    if (email && senha) {
      const user: Usuario = {
        id: `coord-${Date.now()}`,
        email,
        nome: email.split('@')[0],
        role: 'coordenador',
      };
      setUsuario(user);
      setMembro(null);
      localStorage.setItem(AUTH_KEY, JSON.stringify({ usuario: user }));
      return true;
    }

    return false;
  };

  const registrar = async (dadosMembro: Omit<Membro, 'id' | 'criadoEm' | 'ativo'>): Promise<{ success: boolean; message: string }> => {
    // Verificar se email ja existe
    const existente = membroService.buscarPorEmail(dadosMembro.email);
    if (existente) {
      return { success: false, message: 'Este email ja esta cadastrado' };
    }

    // Criar membro
    const novoMembro = membroService.criar({ ...dadosMembro, ativo: true });

    // Fazer login automatico
    const user: Usuario = {
      id: `membro-${novoMembro.id}`,
      email: novoMembro.email,
      nome: novoMembro.nome,
      role: 'membro',
      membroId: novoMembro.id,
    };
    setUsuario(user);
    setMembro(novoMembro);
    localStorage.setItem(AUTH_KEY, JSON.stringify({ usuario: user, membroId: novoMembro.id }));

    return { success: true, message: 'Cadastro realizado com sucesso!' };
  };

  const logout = () => {
    setUsuario(null);
    setMembro(null);
    localStorage.removeItem(AUTH_KEY);
  };

  return (
    <AuthContext.Provider value={{ usuario, membro, isLoading, login, logout, registrar }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
