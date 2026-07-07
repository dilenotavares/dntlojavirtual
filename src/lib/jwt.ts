import { SignJWT, jwtVerify } from "jose";

/**
 * Utilitários de Autenticação JWT (JSON Web Tokens)
 * 
 * Utilizamos a biblioteca 'jose' por ser compatível com ambientes Edge e Node.js
 * nativos do Next.js (necessário para rodar dentro de Middlewares sem limitações).
 * O segredo de assinatura é carregado das variáveis de ambiente com um fallback seguro.
 */

// Codifica a chave secreta de assinatura do JWT
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dnt-loja-virtual-chave-secreta-de-seguranca-2026"
);

/**
 * Assina um payload gerando um token JWT válido por 24 horas.
 * 
 * @param payload Dados do usuário para incluir no token (id, email, name)
 * @returns Token JWT assinado em formato string
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function signJWT(payload: Record<string, any>): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" }) // Algoritmo padrão HS256
    .setIssuedAt() // Data de emissão (agora)
    .setExpirationTime("24h") // Expira em 24 horas
    .sign(JWT_SECRET);
}

/**
 * Verifica a autenticidade e validade de um token JWT.
 * 
 * @param token Token JWT enviado pelo cliente
 * @returns O payload decodificado se o token for válido, ou null caso contrário
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function verifyJWT(token: string): Promise<Record<string, any> | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch (error) {
    // Retorna nulo se o token estiver expirado, adulterado ou malformado
    return null;
  }
}
