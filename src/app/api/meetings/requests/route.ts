import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Lista solicitações pendentes (apenas autenticados)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    const pendingRequests = await prisma.meeting.findMany({
      where: {
        status: 'PENDING'
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    return NextResponse.json({ success: true, requests: pendingRequests });
  } catch (error) {
    console.error('Erro ao buscar solicitações pendentes:', error);
    return NextResponse.json({ success: false, error: 'Erro ao buscar solicitações' }, { status: 500 });
  }
}
