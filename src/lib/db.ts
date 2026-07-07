import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

/**
 * Módulo de conexão com o Banco de Dados (Prisma 7 + SQLite)
 * 
 * Correção do padrão de instanciação do Prisma 7:
 * O construtor PrismaBetterSqlite3 espera um objeto de configuração contendo { url: string }
 * ao invés de uma instância direta da classe 'better-sqlite3'. O próprio adaptador
 * gerencia internamente a conexão.
 */

// Extrai e resolve o caminho absoluto do banco para evitar conflitos de diretórios entre a API e scripts de Seed
// Resolve o caminho do banco SQLite sempre na pasta prisma/dev.db de forma absoluta para consistência entre CLI e Aplicação
const absoluteDbPath = path.resolve(process.cwd(), "prisma/dev.db");
const cleanAbsoluteDbPath = absoluteDbPath.replace(/\\/g, "/");
const databaseUrl = `file:${cleanAbsoluteDbPath}`;

console.log("=========================================");
console.log("DB_DEBUG: databaseUrl =", databaseUrl);
console.log("=========================================");

// Declaração de tipo global para o cache de conexão no ambiente de desenvolvimento
const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

// Declaração da instância do cliente
let prisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
  // Em produção, instancia diretamente
  const adapter = new PrismaBetterSqlite3({ url: databaseUrl });
  prisma = new PrismaClient({ adapter });
} else {
  // Em desenvolvimento, reutiliza a instância existente na memória global
  if (!globalForPrisma.prisma) {
    const adapter = new PrismaBetterSqlite3({ url: databaseUrl });
    globalForPrisma.prisma = new PrismaClient({ adapter });
  }
  prisma = globalForPrisma.prisma;
}

// Exporta a instância ativa do banco de dados relacional
export const db = prisma;
export default db;
