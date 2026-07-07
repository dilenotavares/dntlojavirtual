import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { signJWT } from "@/lib/jwt";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  try {
    const body = await request.json();
    const { email, password, name, phone, cpf, birthdate } = body;

    // 1. Validação básica de entrada
    if (!email || !password || !name || !cpf || !birthdate) {
      return NextResponse.json(
        { error: "Por favor, preencha todos os campos obrigatórios (E-mail, Senha, Nome, CPF, Data de Nascimento)." },
        { status: 400 }
      );
    }

    // Validação de formato de CPF simples
    const cleanCpf = cpf.replace(/\D/g, "");
    if (cleanCpf.length !== 11) {
      return NextResponse.json(
        { error: "CPF inválido. Certifique-se de preencher 11 dígitos." },
        { status: 400 }
      );
    }

    // 2. Verifica se o e-mail já está cadastrado
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Este endereço de e-mail já está cadastrado." },
        { status: 400 }
      );
    }

    // 3. Verifica se o CPF já está em uso
    const existingProfile = await db.profile.findUnique({
      where: { cpf: cleanCpf },
    });

    if (existingProfile) {
      return NextResponse.json(
        { error: "Este CPF já está associado a outra conta." },
        { status: 400 }
      );
    }

    // 4. Criptografa a senha com bcrypt
    const passwordHash = await bcrypt.hash(password, 10);

    // 5. Salva no banco de dados (User + Profile na mesma transação)
    const newUser = await db.user.create({
      data: {
        email,
        passwordHash,
        name,
        phone,
        profile: {
          create: {
            cpf: cleanCpf,
            birthdate: new Date(birthdate),
            preferences: JSON.stringify({ theme: "dark" }),
          },
        },
      },
      include: {
        profile: true,
      },
    });

    // 6. Cria o token de sessão JWT
    const token = await signJWT({
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name,
    });

    // 7. Configura o cookie HTTP-only
    cookieStore.set("auth_token", token, {
      httpOnly: true, // Protege contra XSS (JavaScript não consegue ler o cookie)
      secure: process.env.NODE_ENV === "production", // Apenas HTTPS em produção
      sameSite: "strict", // Proteção adicional contra CSRF
      maxAge: 60 * 60 * 24, // Expiração em 1 dia (segundos)
      path: "/",
    });

    // Grava log de auditoria
    await db.auditLog.create({
      data: {
        userId: newUser.id,
        action: "USER_REGISTER",
        details: `Usuário ${newUser.name} registrado com sucesso.`,
      },
    });

    // Retorna os dados do usuário criado (ocultando a senha criptografada por segurança)
    return NextResponse.json({
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        phone: newUser.phone,
        cpf: newUser.profile?.cpf,
      },
      message: "Conta criada com sucesso!",
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Erro no registro de usuário:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ao tentar registrar." },
      { status: 500 }
    );
  }
}
