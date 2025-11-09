import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { sendEmail, emailConfig } from '@/lib/email';
import { getAdminNotificationTemplate } from '@/app/(routes)/calendario/templates';
import { formatPhoneToDatabase } from '@/lib/validations';

const prisma = new PrismaClient();

// Função para verificar conflito de horários
function checkTimeConflict(
  startTime1: string,
  endTime1: string,
  startTime2: string,
  endTime2: string
): boolean {
  // Converter strings de horário (HH:MM) para minutos do dia
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const start1 = timeToMinutes(startTime1);
  const end1 = timeToMinutes(endTime1);
  const start2 = timeToMinutes(startTime2);
  const end2 = timeToMinutes(endTime2);

  // Verifica se há sobreposição de horários
  return (start1 < end2 && end1 > start2);
}

// POST - Criar solicitação de reunião (público - sem autenticação)
export async function POST(req: NextRequest) {
  try {
    const { title, date, startTime, endTime, requestedBy, email, phone, notes } = await req.json();

    // Validação dos campos obrigatórios
    if (!title || !date || !startTime || !endTime || !requestedBy || !email || !phone) {
      return NextResponse.json({
        success: false,
        error: 'Todos os campos são obrigatórios'
      }, { status: 400 });
    }

    // Validação de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        success: false,
        error: 'Email inválido'
      }, { status: 400 });
    }

    // Validação de telefone usando a função de formatação
    const phoneValidation = formatPhoneToDatabase(phone, '67');
    if (!phoneValidation.formated) {
      return NextResponse.json({
        success: false,
        error: phoneValidation.message || 'Telefone inválido'
      }, { status: 400 });
    }

    // Usar o telefone formatado/validado
    const validatedPhone = phoneValidation.phone;

    // Converter a data para o início do dia (00:00:00) sem conversão de timezone
    // Usar split para extrair ano, mês e dia e criar Date diretamente
    const [year, month, day] = date.split('-').map(Number);
    const requestDate = new Date(year, month - 1, day, 0, 0, 0, 0);

    // Verificar se já existe uma reunião aprovada no mesmo horário
    const existingMeetings = await prisma.meeting.findMany({
      where: {
        date: requestDate,
        status: 'APPROVED' // Verifica apenas reuniões aprovadas
      },
      select: {
        id: true,
        title: true,
        startTime: true,
        endTime: true,
        status: true
      }
    });

    console.log('🔍 [REQUEST] Verificando conflito:', {
      solicitacao: `${startTime} - ${endTime}`,
      reunioesExistentes: existingMeetings.length,
      reunioes: existingMeetings.map(m => `${m.startTime}-${m.endTime} (${m.status})`)
    });

    // Verificar conflito de horários
    const hasConflict = existingMeetings.some(meeting => {
      const conflict = checkTimeConflict(startTime, endTime, meeting.startTime, meeting.endTime);
      console.log('📅 [REQUEST] Comparando:', {
        solicitacao: `${startTime} - ${endTime}`,
        reuniao: `${meeting.startTime} - ${meeting.endTime}`,
        status: meeting.status,
        temConflito: conflict
      });
      return conflict;
    });

    console.log('✅ [REQUEST] Resultado:', hasConflict ? 'CONFLITO' : 'SEM CONFLITO');

    if (hasConflict) {
      return NextResponse.json({
        success: false,
        error: 'Já existe uma reunião agendada neste horário. Por favor, escolha outro horário.'
      }, { status: 409 });
    }

    // Criar a solicitação com status PENDING
    const meeting = await prisma.meeting.create({
      data: {
        title,
        date: requestDate,
        startTime,
        endTime,
        requestedBy,
        email,
        phone: validatedPhone, // Usar telefone validado
        notes: notes || null,
        status: 'PENDING'
      }
    });

    // Enviar email de notificação para o admin
    // Formatar data como YYYY-MM-DD sem conversão de timezone
    const meetingDate = new Date(meeting.date);
    const dateString = `${meetingDate.getFullYear()}-${String(meetingDate.getMonth() + 1).padStart(2, '0')}-${String(meetingDate.getDate()).padStart(2, '0')}`;

    const emailHtml = getAdminNotificationTemplate({
      title: meeting.title,
      date: dateString,
      startTime: meeting.startTime,
      endTime: meeting.endTime,
      requestedBy: meeting.requestedBy,
      email: meeting.email || '',
      phone: meeting.phone || ''
    });

    await sendEmail({
      to: emailConfig.adminEmail,
      subject: 'Solicitação de Reunião - JURFIS/SEFAZ',
      html: emailHtml
    });

    return NextResponse.json({
      success: true,
      message: 'Solicitação enviada com sucesso! Em breve, um email será enviado com a confirmação ou rejeição.',
      meeting
    });
  } catch (error) {
    console.error('Erro ao criar solicitação de reunião:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro ao enviar solicitação'
    }, { status: 500 });
  }
}
