import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { sendRejectionEmail } from '@/lib/email';

const prisma = new PrismaClient();

// PUT - Rejeitar solicitação de reunião (apenas autenticados)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const { reason } = await req.json();

    if (!reason || reason.trim() === '') {
      return NextResponse.json({
        success: false,
        error: 'É necessário informar o motivo da rejeição'
      }, { status: 400 });
    }

    // Buscar a solicitação
    const meeting = await prisma.meeting.findUnique({
      where: { id }
    });

    if (!meeting) {
      return NextResponse.json({ success: false, error: 'Solicitação não encontrada' }, { status: 404 });
    }

    if (meeting.status !== 'PENDING') {
      return NextResponse.json({
        success: false,
        error: 'Esta solicitação já foi processada'
      }, { status: 400 });
    }

    // Atualizar status para REJECTED e adicionar motivo
    const updatedMeeting = await prisma.meeting.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason: reason
      }
    });

    // Enviar email de rejeição
    if (meeting.email) {
      // Formatar data como YYYY-MM-DD sem conversão de timezone
      const meetingDate = new Date(meeting.date);
      const dateString = `${meetingDate.getFullYear()}-${String(meetingDate.getMonth() + 1).padStart(2, '0')}-${String(meetingDate.getDate()).padStart(2, '0')}`;

      const emailSent = await sendRejectionEmail(
        {
          title: meeting.title,
          date: dateString,
          startTime: meeting.startTime,
          endTime: meeting.endTime,
          requestedBy: meeting.requestedBy,
          email: meeting.email,
          phone: meeting.phone || ''
        },
        reason
      );

      if (!emailSent) {
        console.warn('Reunião rejeitada, mas email não foi enviado');
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Solicitação rejeitada com sucesso',
      meeting: updatedMeeting
    });
  } catch (error) {
    console.error('Erro ao rejeitar solicitação:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro ao rejeitar solicitação'
    }, { status: 500 });
  }
}
