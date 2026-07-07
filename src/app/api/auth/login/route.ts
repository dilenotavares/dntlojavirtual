import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { signJWT } from "@/lib/jwt";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  try {
    const body = await request.json();
    const { email, password } = body;

    // 1. Validação simples de entrada
    if (!email || !password) {
      return NextResponse.json(
        { error: "Por favor, preencha o e-mail e a senha." },
        { status: 400 }
      );
    }

    // 2. Busca o usuário pelo e-mail
    const user = await db.user.findUnique({
      where: { email },
      include: {
        profile: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "E-mail ou senha incorretos." },
        { status: 401 }
      );
    }

    // 3. Compara o hash da senha
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "E-mail ou senha incorretos." },
        { status: 401 }
      );
    }

    // 4. Assina o token JWT com dados básicos do usuário
    const token = await signJWT({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    // 5. Configura o cookie HTTP-only
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24, // 24 horas
      path: "/",
    });

    // 6. Grava log de auditoria do login bem-sucedido
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "USER_LOGIN",
        details: `Login bem-sucedido para ${user.name}.`,
      },
    });

    // Retorna os dados resumidos do usuário autenticado
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        cpf: user.profile?.cpf,
      },
      message: "Login realizado com sucesso!",
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Erro no login de usuário:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ao tentar realizar o login." },
      { status: 500 }
    );
  }
}

/**
 * Rota de Logout (DELETE /api/auth/login ou POST com logout)
 * 
 * Permite limpar o cookie de sessão do navegador para desconectar o usuário.
 */
export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("auth_token");
  return NextResponse.json({ message: "Sessão encerrada com sucesso." });
}
