import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { sendEmail } from '@/lib/email';
import { getApprovalEmailTemplate } from '@/app/(routes)/calendario/templates';

const prisma = new PrismaClient();

// PUT - Aprovar solicitação de reunião (apenas autenticados)
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

    // Atualizar status para APPROVED
    const updatedMeeting = await prisma.meeting.update({
      where: { id },
      data: {
        status: 'APPROVED'
      }
    });

    // Enviar email de aprovação
    if (meeting.email) {
      // Formatar data como YYYY-MM-DD sem conversão de timezone
      const meetingDate = new Date(meeting.date);
      const dateString = `${meetingDate.getFullYear()}-${String(meetingDate.getMonth() + 1).padStart(2, '0')}-${String(meetingDate.getDate()).padStart(2, '0')}`;

      const emailHtml = getApprovalEmailTemplate({
        title: meeting.title,
        date: dateString,
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        requestedBy: meeting.requestedBy || '',
        email: meeting.email,
        phone: meeting.phone || ''
      });

      const result = await sendEmail({
        to: meeting.email,
        subject: 'Solicitação Confirmada - JURFIS/SEFAZ',
        html: emailHtml
      });

      if (!result.success) {
        console.warn('Reunião aprovada, mas email não foi enviado:', result.error);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Solicitação aprovada com sucesso',
      meeting: updatedMeeting
    });
  } catch (error) {
    console.error('Erro ao aprovar solicitação:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro ao aprovar solicitação'
    }, { status: 500 });
  }
}
