import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifyJWT } from "@/lib/jwt";

export async function GET() {
  const cookieStore = await cookies();
  try {
    const token = cookieStore.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });
    }

    const userId = payload.userId as string;

    const addresses = await db.address.findMany({
      where: { userId },
      orderBy: { isDefault: "desc" }, // Endereço padrão vem primeiro
    });

    return NextResponse.json({ addresses });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Erro ao obter endereços do cliente:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ao listar endereços." },
      { status: 500 }
    );
  }
}

// Cadastra um novo endereço de entrega
export async function POST(request: Request) {
  const cookieStore = await cookies();
  try {
    const token = cookieStore.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });
    }

    const userId = payload.userId as string;
    const body = await request.json();
    const { street, number, complement, neighborhood, city, state, zip, isDefault } = body;

    // Validação básica dos campos obrigatórios brasileiros
    if (!street || !number || !neighborhood || !city || !state || !zip) {
      return NextResponse.json(
        { error: "Por favor, preencha todos os campos obrigatórios (Rua, Número, Bairro, Cidade, Estado, CEP)." },
        { status: 400 }
      );
    }

    const cleanZip = zip.replace(/\D/g, "");

    // Se o usuário marcar como endereço padrão, precisamos desmarcar os outros endereços existentes
    if (isDefault) {
      await db.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    // Cria o endereço associado ao usuário
    const newAddress = await db.address.create({
      data: {
        userId,
        street,
        number,
        complement,
        neighborhood,
        city,
        state,
        zip: cleanZip,
        isDefault: !!isDefault,
      },
    });

    // Registra auditoria
    await db.auditLog.create({
      data: {
        userId,
        action: "ADDRESS_CREATED",
        details: `Endereço adicionado: ${street}, Nº ${number} - ${city}/${state}.`,
      },
    });

    return NextResponse.json({
      success: true,
      address: newAddress,
      message: "Endereço cadastrado com sucesso!",
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Erro ao cadastrar endereço:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ao tentar cadastrar o endereço." },
      { status: 500 }
    );
  }
}
