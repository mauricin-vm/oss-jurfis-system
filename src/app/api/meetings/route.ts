import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { sendApprovalEmail } from '@/lib/email';

const prisma = new PrismaClient();

// GET - Lista reuniões (público - sem detalhes sensíveis)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where = startDate && endDate ? {
      date: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      },
      status: 'APPROVED' // Apenas reuniões aprovadas para usuários não autenticados
    } : {
      status: 'APPROVED'
    };

    const meetings = await prisma.meeting.findMany({
      where,
      select: {
        id: true,
        title: true,
        date: true,
        startTime: true,
        endTime: true,
        status: true,
        // Não retorna requestedBy, contacts, notes, email, phone para usuários não autenticados
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' }
      ]
    });

    return NextResponse.json({ success: true, meetings });
  } catch (error) {
    console.error('Erro ao buscar reuniões:', error);
    return NextResponse.json({ success: false, error: 'Erro ao buscar reuniões' }, { status: 500 });
  }
}

// POST - Criar reunião (apenas autenticados)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    const { title, date, startTime, endTime, requestedBy, email, phone, notes } = await req.json();

    if (!title || !date || !startTime || !endTime || !requestedBy || !email || !phone) {
      return NextResponse.json({
        success: false,
        error: 'Campos obrigatórios faltando'
      }, { status: 400 });
    }

    // Converter a data sem conversão de timezone
    const [year, month, day] = date.split('-').map(Number);
    const meetingDate = new Date(year, month - 1, day, 0, 0, 0, 0);

    const meeting = await prisma.meeting.create({
      data: {
        title,
        date: meetingDate,
        startTime,
        endTime,
        requestedBy,
        email,
        phone,
        notes: notes || null,
        status: 'APPROVED' // Reunião criada manualmente já é aprovada
      }
    });

    // Enviar email de confirmação para o solicitante
    if (email) {
      // Formatar data como YYYY-MM-DD sem conversão de timezone
      const dateString = `${meetingDate.getFullYear()}-${String(meetingDate.getMonth() + 1).padStart(2, '0')}-${String(meetingDate.getDate()).padStart(2, '0')}`;

      const emailSent = await sendApprovalEmail({
        title,
        date: dateString,
        startTime,
        endTime,
        requestedBy,
        email,
        phone
      });

      if (!emailSent) {
        console.warn('Reunião criada, mas email de confirmação não foi enviado');
      }
    }

    return NextResponse.json({ success: true, meeting });
  } catch (error) {
    console.error('Erro ao criar reunião:', error);
    return NextResponse.json({ success: false, error: 'Erro ao criar reunião' }, { status: 500 });
  }
}
