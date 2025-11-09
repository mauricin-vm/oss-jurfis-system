import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Lista usuários que possuem registros de horas extras (apenas admin)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se o usuário é admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Acesso negado. Apenas administradores podem acessar.' }, { status: 403 });
    }

    // Buscar apenas usuários da mesma organização do admin
    const users = await prisma.user.findMany({
      where: {
        organizationMembers: {
          some: {
            organizationId: session.user.organizationId
          }
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return NextResponse.json({ success: false, error: 'Erro ao buscar usuários' }, { status: 500 });
  }
}
