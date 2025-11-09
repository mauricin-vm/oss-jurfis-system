import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { sendEmail } from '@/lib/email';
import { getCancellationEmailTemplate, getUpdateEmailTemplate } from '@/app/(routes)/calendario/templates';

const prisma = new PrismaClient();

// PUT - Atualizar reunião (apenas autenticados)
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
    const { title, date, startTime, endTime, requestedBy, email, phone, notes } = await req.json();

    // Buscar dados atuais da reunião antes de atualizar
    const oldMeeting = await prisma.meeting.findUnique({
      where: { id }
    });

    if (!oldMeeting) {
      return NextResponse.json({ success: false, error: 'Reunião não encontrada' }, { status: 404 });
    }

    // Converter a data sem conversão de timezone
    const [year, month, day] = date.split('-').map(Number);
    const meetingDate = new Date(year, month - 1, day, 0, 0, 0, 0);

    const meeting = await prisma.meeting.update({
      where: { id },
      data: {
        title,
        date: meetingDate,
        startTime,
        endTime,
        requestedBy: requestedBy || null,
        email: email || null,
        phone: phone || null,
        notes: notes || null
      }
    });

    // Verificar se data ou horário foram alterados
    const oldDate = new Date(oldMeeting.date);
    const oldDateString = `${oldDate.getFullYear()}-${String(oldDate.getMonth() + 1).padStart(2, '0')}-${String(oldDate.getDate()).padStart(2, '0')}`;
    const newDateString = `${meetingDate.getFullYear()}-${String(meetingDate.getMonth() + 1).padStart(2, '0')}-${String(meetingDate.getDate()).padStart(2, '0')}`;

    const dateChanged = oldDateString !== newDateString;
    const startTimeChanged = oldMeeting.startTime !== startTime;
    const endTimeChanged = oldMeeting.endTime !== endTime;

    // Enviar email de alteração se data ou horário mudaram e a reunião está aprovada
    if ((dateChanged || startTimeChanged || endTimeChanged) && oldMeeting.status === 'APPROVED' && oldMeeting.email) {
      const emailHtml = getUpdateEmailTemplate(
        {
          title: oldMeeting.title,
          date: oldDateString,
          startTime: oldMeeting.startTime,
          endTime: oldMeeting.endTime,
          requestedBy: oldMeeting.requestedBy || 'Solicitante não informado',
          email: oldMeeting.email,
          phone: oldMeeting.phone || ''
        },
        {
          title,
          date: newDateString,
          startTime,
          endTime,
          requestedBy: requestedBy || 'Solicitante não informado',
          email,
          phone
        }
      );

      const result = await sendEmail({
        to: oldMeeting.email,
        subject: 'Reunião Reagendada - JURFIS/SEFAZ',
        html: emailHtml
      });

      if (!result.success) {
        console.warn('Reunião atualizada, mas email de alteração não foi enviado:', result.error);
      }
    }

    return NextResponse.json({ success: true, meeting });
  } catch (error) {
    console.error('Erro ao atualizar reunião:', error);
    return NextResponse.json({ success: false, error: 'Erro ao atualizar reunião' }, { status: 500 });
  }
}

// DELETE - Deletar reunião (apenas autenticados)
export async function DELETE(
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

    // Buscar dados da reunião antes de deletar
    const meeting = await prisma.meeting.findUnique({
      where: { id }
    });

    if (!meeting) {
      return NextResponse.json({ success: false, error: 'Reunião não encontrada' }, { status: 404 });
    }

    // Deletar a reunião
    await prisma.meeting.delete({
      where: { id }
    });

    // Enviar email de cancelamento se a reunião estava aprovada e tem email
    if (meeting.status === 'APPROVED' && meeting.email) {
      // Formatar data como YYYY-MM-DD sem conversão de timezone
      const meetingDate = new Date(meeting.date);
      const dateString = `${meetingDate.getFullYear()}-${String(meetingDate.getMonth() + 1).padStart(2, '0')}-${String(meetingDate.getDate()).padStart(2, '0')}`;

      const emailHtml = getCancellationEmailTemplate(
        {
          title: meeting.title,
          date: dateString,
          startTime: meeting.startTime,
          endTime: meeting.endTime,
          requestedBy: meeting.requestedBy || 'Solicitante não informado',
          email: meeting.email,
          phone: meeting.phone || ''
        },
        reason || 'Motivo não informado'
      );

      const result = await sendEmail({
        to: meeting.email,
        subject: 'Reunião Cancelada - JURFIS/SEFAZ',
        html: emailHtml
      });

      if (!result.success) {
        console.warn('Reunião excluída, mas email de cancelamento não foi enviado:', result.error);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar reunião:', error);
    return NextResponse.json({ success: false, error: 'Erro ao deletar reunião' }, { status: 500 });
  }
}
