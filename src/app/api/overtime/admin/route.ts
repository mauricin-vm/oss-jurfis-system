import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Lista todos os registros (apenas admin)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se o usuário é admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Acesso negado. Apenas administradores podem acessar.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const year = searchParams.get('year');
    const userId = searchParams.get('userId');

    // Filtros
    const where: Prisma.OvertimeRecordWhereInput = {};

    if (year) {
      where.year = parseInt(year);
    }

    if (userId) {
      where.userId = userId;
    }

    const records = await prisma.overtimeRecord.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' }
      ]
    });

    return NextResponse.json({ success: true, records });
  } catch (error) {
    console.error('Erro ao buscar registros (admin):', error);
    return NextResponse.json({ success: false, error: 'Erro ao buscar registros' }, { status: 500 });
  }
}
