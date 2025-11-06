import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient, MeetingStatus } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Lista reuniões com todos os detalhes (apenas autenticados)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where = startDate && endDate ? {
      date: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      },
      status: MeetingStatus.APPROVED // Mostrar apenas reuniões aprovadas no calendário
    } : {
      status: MeetingStatus.APPROVED
    };

    const meetings = await prisma.meeting.findMany({
      where,
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' }
      ]
    });

    return NextResponse.json({ success: true, meetings });
  } catch (error) {
    console.error('Erro ao buscar reuniões (admin):', error);
    return NextResponse.json({ success: false, error: 'Erro ao buscar reuniões' }, { status: 500 });
  }
}
