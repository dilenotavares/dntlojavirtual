"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

/**
 * Interface do Usuário Autenticado
 */
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  cpf?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addresses?: Array<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  wishlist?: Array<any>;
}

/**
 * Tipagem do Contexto de Autenticação
 */
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userData: User) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Provider de Autenticação (AuthProvider)
 * 
 * Gerencia a sessão do usuário chamando a rota `/api/auth/me` na inicialização
 * para restabelecer a sessão a partir do cookie HttpOnly seguro.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Busca as informações do usuário atual na inicialização do aplicativo
  const checkSession = async () => {
    try {
      const response = await fetch("/api/auth/me");
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Erro ao verificar sessão do usuário:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  // Armazena na memória o usuário autenticado com sucesso
  const login = (userData: User) => {
    setUser(userData);
    setIsLoading(false);
  };

  // Encerra a sessão limpando o cookie seguro no backend e reiniciando o estado
  const logout = async () => {
    setIsLoading(true);
    try {
      await fetch("/api/auth/login", { method: "DELETE" });
    } catch (error) {
      console.error("Erro ao encerrar sessão no servidor:", error);
    } finally {
      setUser(null);
      setIsLoading(false);
    }
  };

  // Recarrega os dados do perfil do cliente (útil após cadastrar novos endereços)
  const refreshUser = async () => {
    try {
      const response = await fetch("/api/auth/me");
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
        }
      }
    } catch (error) {
      console.error("Erro ao recarregar dados do usuário:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook para acessar facilmente as informações da conta do cliente
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado de dentro de um AuthProvider");
  }
  return context;
}
