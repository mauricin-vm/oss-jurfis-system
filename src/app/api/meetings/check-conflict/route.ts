import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma, MeetingStatus } from '@prisma/client';

const prisma = new PrismaClient();

// POST - Verifica se há conflito de horário
export async function POST(req: NextRequest) {
  try {
    const { date, startTime, endTime, excludeMeetingId } = await req.json();

    if (!date || !startTime || !endTime) {
      return NextResponse.json({
        success: false,
        error: 'Data, horário inicial e final são obrigatórios'
      }, { status: 400 });
    }

    // Buscar reuniões aprovadas na mesma data (sem conversão de timezone)
    const [year, month, day] = date.split('-').map(Number);
    const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
    const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

    // Construir filtro - excluir reunião específica se informado (útil ao editar)
    const whereClause: Prisma.MeetingWhereInput = {
      date: {
        gte: startOfDay,
        lte: endOfDay
      },
      status: MeetingStatus.APPROVED
    };

    if (excludeMeetingId) {
      whereClause.id = {
        not: excludeMeetingId
      };
    }

    const existingMeetings = await prisma.meeting.findMany({
      where: whereClause,
      select: {
        id: true,
        startTime: true,
        endTime: true,
        title: true
      }
    });

    // Função para converter horário (HH:MM) em minutos
    const timeToMinutes = (time: string): number => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const requestStart = timeToMinutes(startTime);
    const requestEnd = timeToMinutes(endTime);

    console.log('🔍 Verificando conflito:', {
      solicitacao: `${startTime} - ${endTime}`,
      requestStart,
      requestEnd,
      reunioesExistentes: existingMeetings.length
    });

    // Verificar se há conflito com alguma reunião existente
    // Dois intervalos se sobrepõem se: requestEnd > meetingStart AND meetingEnd > requestStart
    const hasConflict = existingMeetings.some(meeting => {
      const meetingStart = timeToMinutes(meeting.startTime);
      const meetingEnd = timeToMinutes(meeting.endTime);

      const overlaps = requestEnd > meetingStart && meetingEnd > requestStart;

      console.log('📅 Comparando com reunião:', {
        reuniao: `${meeting.startTime} - ${meeting.endTime}`,
        meetingStart,
        meetingEnd,
        condicao1: `${requestEnd} > ${meetingStart} = ${requestEnd > meetingStart}`,
        condicao2: `${meetingEnd} > ${requestStart} = ${meetingEnd > requestStart}`,
        temConflito: overlaps
      });

      return overlaps;
    });

    console.log('✅ Resultado final:', hasConflict ? 'CONFLITO' : 'SEM CONFLITO');

    if (hasConflict) {
      return NextResponse.json({
        success: false,
        hasConflict: true,
        message: 'Já existe uma reunião agendada neste horário. Por favor, escolha outro horário.'
      });
    }

    return NextResponse.json({
      success: true,
      hasConflict: false,
      message: 'Horário disponível'
    });
  } catch (error) {
    console.error('Erro ao verificar conflito:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro ao verificar disponibilidade'
    }, { status: 500 });
  }
}
