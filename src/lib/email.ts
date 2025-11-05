import nodemailer from 'nodemailer';

// Configuração do transportador de email
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

interface MeetingData {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  requestedBy: string;
  email: string;
  phone: string;
}

// Template de email de aprovação
function getApprovalEmailTemplate(data: MeetingData): string {
  // Criar data sem conversão de timezone
  const [year, month, day] = data.date.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  const formattedDate = date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    weekday: 'long'
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #10b981;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .content {
          background-color: #f9fafb;
          padding: 30px;
          border: 1px solid #e5e7eb;
          border-top: none;
        }
        .info-box {
          background-color: white;
          border-left: 4px solid #10b981;
          padding: 15px;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          padding: 20px;
          color: #6b7280;
          font-size: 12px;
        }
        h1 {
          margin: 0;
        }
        strong {
          color: #1f2937;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Resposta de Solicitação de Agendamento</h1>
        </div>
        <div class="content">
          <p>Olá, <strong>${data.requestedBy}</strong>!</p>

          <p>Sua solicitação de reunião foi <strong>aprovada</strong> pela Junta de Recursos Fiscais (JURFIS).</p>

          <div class="info-box">
            <h3 style="margin-top: 0;">Detalhes da Reunião</h3>
            <p><strong>Título:</strong> ${data.title}</p>
            <p><strong>Data:</strong> ${formattedDate}</p>
            <p><strong>Horário:</strong> ${data.startTime} às ${data.endTime}</p>
          </div>

          <p><strong>Observações importantes:</strong></p>
          <ul>
            <li>Por favor, chegue com 10 minutos de antecedência</li>
            <li>Em caso de imprevistos, entre em contato o quanto antes</li>
          </ul>

          <p>Caso precise reagendar ou cancelar, entre em contato pelo email: <a href="mailto:jurfis.semre@gmail.com">jurfis.semre@gmail.com</a></p>

          <p>Atenciosamente,<br><strong>Junta de Recursos Fiscais - JURFIS</strong></p>
        </div>
        <div class="footer">
          Este é um email automático. Por favor, não responda diretamente.
        </div>
      </div>
    </body>
    </html>
  `;
}

// Template de email de rejeição
function getRejectionEmailTemplate(data: MeetingData, reason: string): string {
  // Criar data sem conversão de timezone
  const [year, month, day] = data.date.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  const formattedDate = date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    weekday: 'long'
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #ef4444;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .content {
          background-color: #f9fafb;
          padding: 30px;
          border: 1px solid #e5e7eb;
          border-top: none;
        }
        .info-box {
          background-color: white;
          border-left: 4px solid #ef4444;
          padding: 15px;
          margin: 20px 0;
        }
        .reason-box {
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          padding: 15px;
          margin: 20px 0;
          border-radius: 5px;
        }
        .footer {
          text-align: center;
          padding: 20px;
          color: #6b7280;
          font-size: 12px;
        }
        h1 {
          margin: 0;
        }
        strong {
          color: #1f2937;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Resposta de Solicitação de Agendamento</h1>
        </div>
        <div class="content">
          <p>Olá, <strong>${data.requestedBy}</strong>!</p>

          <p>Infelizmente, não foi possível aprovar sua solicitação de reunião com a Junta de Recursos Fiscais (JURFIS).</p>

          <div class="info-box">
            <h3 style="margin-top: 0;">Solicitação Original</h3>
            <p><strong>Data solicitada:</strong> ${formattedDate}</p>
            <p><strong>Horário solicitado:</strong> ${data.startTime} às ${data.endTime}</p>
          </div>

          <div class="reason-box">
            <h3 style="margin-top: 0; color: #991b1b;">📋 Motivo:</h3>
            <p>${reason}</p>
          </div>

          <p>Atenciosamente,<br><strong>Junta de Recursos Fiscais - JURFIS</strong></p>
        </div>
        <div class="footer">
          Este é um email automático. Por favor, não responda diretamente.
        </div>
      </div>
    </body>
    </html>
  `;
}

// Função para enviar email de aprovação
export async function sendApprovalEmail(meetingData: MeetingData): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: `"JURFIS - Junta de Recursos Fiscais" <${process.env.GMAIL_USER}>`,
      to: meetingData.email,
      subject: 'Solicitação Confirmada - JURFIS/SEFAZ',
      html: getApprovalEmailTemplate(meetingData),
    });

    console.log('Email de aprovação enviado com sucesso para:', meetingData.email);
    return true;
  } catch (error) {
    console.error('Erro ao enviar email de aprovação:', error);
    return false;
  }
}

// Função para enviar email de rejeição
export async function sendRejectionEmail(
  meetingData: MeetingData,
  reason: string
): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: `"JURFIS - Junta de Recursos Fiscais" <${process.env.GMAIL_USER}>`,
      to: meetingData.email,
      subject: 'Solicitação Recusada - JURFIS/SEFAZ',
      html: getRejectionEmailTemplate(meetingData, reason),
    });

    console.log('Email de rejeição enviado com sucesso para:', meetingData.email);
    return true;
  } catch (error) {
    console.error('Erro ao enviar email de rejeição:', error);
    return false;
  }
}

// Template de email de notificação para o admin
function getAdminNotificationTemplate(data: MeetingData): string {
  // Criar data sem conversão de timezone
  const [year, month, day] = data.date.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  const formattedDate = date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    weekday: 'long'
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #3b82f6;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .content {
          background-color: #f9fafb;
          padding: 30px;
          border: 1px solid #e5e7eb;
          border-top: none;
        }
        .info-box {
          background-color: white;
          border-left: 4px solid #3b82f6;
          padding: 15px;
          margin: 20px 0;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #3b82f6;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin-top: 20px;
        }
        .footer {
          text-align: center;
          padding: 20px;
          color: #6b7280;
          font-size: 12px;
        }
        h1 {
          margin: 0;
        }
        strong {
          color: #1f2937;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Solicitação de Reunião</h1>
        </div>
        <div class="content">
          <p>Uma nova solicitação de reunião foi recebida no sistema de calendário da JURFIS.</p>

          <div class="info-box">
            <h3 style="margin-top: 0;">Detalhes da Solicitação</h3>
            <p><strong>Solicitante:</strong> ${data.requestedBy}</p>
            <p><strong>Email:</strong> ${data.email}</p>
            <p><strong>Telefone:</strong> ${data.phone}</p>
            <p><strong>Data solicitada:</strong> ${formattedDate}</p>
            <p><strong>Horário:</strong> ${data.startTime} às ${data.endTime}</p>
            <p><strong>Título:</strong> ${data.title}</p>
          </div>

          <p><strong>Ação necessária:</strong></p>
          <p>Acesse o sistema de calendário para aprovar ou rejeitar esta solicitação. O solicitante receberá um email automático com sua decisão.</p>

          <div style="text-align: center;">
            <a href="${process.env.NEXTAUTH_URL}/calendario" class="button" style="color: white;">Acessar Sistema de Calendário</a>
          </div>
        </div>
        <div class="footer">
          Sistema de Agendamento JURFIS - Notificação Automática
        </div>
      </div>
    </body>
    </html>
  `;
}

// Função para enviar email de notificação para o admin
export async function sendAdminNotification(meetingData: MeetingData): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: `"JURFIS - Sistema de Calendário" <${process.env.GMAIL_USER}>`,
      to: 'jurfis.semre@gmail.com',
      subject: 'Solicitação de Reunião - JURFIS/SEFAZ',
      html: getAdminNotificationTemplate(meetingData),
    });

    console.log('Email de notificação enviado para o admin');
    return true;
  } catch (error) {
    console.error('Erro ao enviar email de notificação para admin:', error);
    return false;
  }
}

// Template de email de cancelamento
function getCancellationEmailTemplate(data: MeetingData, reason: string): string {
  // Criar data sem conversão de timezone
  const [year, month, day] = data.date.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  const formattedDate = date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    weekday: 'long'
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #f59e0b;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .content {
          background-color: #f9fafb;
          padding: 30px;
          border: 1px solid #e5e7eb;
          border-top: none;
        }
        .info-box {
          background-color: white;
          border-left: 4px solid #f59e0b;
          padding: 15px;
          margin: 20px 0;
        }
        .reason-box {
          background-color: #fffbeb;
          border: 1px solid #fde68a;
          padding: 15px;
          margin: 20px 0;
          border-radius: 5px;
        }
        .footer {
          text-align: center;
          padding: 20px;
          color: #6b7280;
          font-size: 12px;
        }
        h1 {
          margin: 0;
        }
        strong {
          color: #1f2937;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Cancelamento de Reunião</h1>
        </div>
        <div class="content">
          <p>Olá, <strong>${data.requestedBy}</strong>!</p>

          <p>Informamos que a reunião agendada com a Junta de Recursos Fiscais (JURFIS) foi <strong>cancelada</strong>.</p>

          <div class="info-box">
            <h3 style="margin-top: 0;">Detalhes da Reunião Cancelada</h3>
            <p><strong>Título:</strong> ${data.title}</p>
            <p><strong>Data:</strong> ${formattedDate}</p>
            <p><strong>Horário:</strong> ${data.startTime} às ${data.endTime}</p>
          </div>

          <div class="reason-box">
            <h3 style="margin-top: 0; color: #92400e;">Justificativa do Cancelamento:</h3>
            <p>${reason}</p>
          </div>

          <p>Caso deseje reagendar, entre em contato pelo email: <a href="mailto:jurfis.semre@gmail.com">jurfis.semre@gmail.com</a></p>

          <p>Atenciosamente,<br><strong>Junta de Recursos Fiscais - JURFIS</strong></p>
        </div>
        <div class="footer">
          Este é um email automático. Por favor, não responda diretamente.
        </div>
      </div>
    </body>
    </html>
  `;
}

// Função para enviar email de cancelamento
export async function sendCancellationEmail(meetingData: MeetingData, reason: string): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: `"JURFIS - Junta de Recursos Fiscais" <${process.env.GMAIL_USER}>`,
      to: meetingData.email,
      subject: 'Reunião Cancelada - JURFIS/SEFAZ',
      html: getCancellationEmailTemplate(meetingData, reason),
    });

    console.log('Email de cancelamento enviado com sucesso para:', meetingData.email);
    return true;
  } catch (error) {
    console.error('Erro ao enviar email de cancelamento:', error);
    return false;
  }
}

// Template de email de alteração de reunião
function getUpdateEmailTemplate(oldData: MeetingData, newData: MeetingData): string {
  // Criar datas sem conversão de timezone
  const [oldYear, oldMonth, oldDay] = oldData.date.split('-').map(Number);
  const oldDate = new Date(oldYear, oldMonth - 1, oldDay);

  const [newYear, newMonth, newDay] = newData.date.split('-').map(Number);
  const newDate = new Date(newYear, newMonth - 1, newDay);

  const oldFormattedDate = oldDate.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    weekday: 'long'
  });

  const newFormattedDate = newDate.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    weekday: 'long'
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #3b82f6;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .content {
          background-color: #f9fafb;
          padding: 30px;
          border: 1px solid #e5e7eb;
          border-top: none;
        }
        .info-box {
          background-color: white;
          border-left: 4px solid #ef4444;
          padding: 15px;
          margin: 20px 0;
        }
        .new-info-box {
          background-color: white;
          border-left: 4px solid #10b981;
          padding: 15px;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          padding: 20px;
          color: #6b7280;
          font-size: 12px;
        }
        h1 {
          margin: 0;
        }
        strong {
          color: #1f2937;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Alteração de Reunião</h1>
        </div>
        <div class="content">
          <p>Olá, <strong>${newData.requestedBy}</strong>!</p>

          <p>Informamos que a reunião "<strong>${newData.title}</strong>" foi <strong>reagendada</strong>.</p>

          <div class="info-box">
            <h3 style="margin-top: 0; color: #991b1b;">Agendamento Anterior</h3>
            <p><strong>Data:</strong> ${oldFormattedDate}</p>
            <p><strong>Horário:</strong> ${oldData.startTime} às ${oldData.endTime}</p>
          </div>

          <div class="new-info-box">
            <h3 style="margin-top: 0; color: #065f46;">Novo Agendamento</h3>
            <p><strong>Data:</strong> ${newFormattedDate}</p>
            <p><strong>Horário:</strong> ${newData.startTime} às ${newData.endTime}</p>
          </div>

          <p><strong>Observações importantes:</strong></p>
          <ul>
            <li>Por favor, chegue com 10 minutos de antecedência</li>
            <li>Em caso de imprevistos, entre em contato o quanto antes</li>
          </ul>

          <p>Caso precise reagendar ou cancelar, entre em contato pelo email: <a href="mailto:jurfis.semre@gmail.com">jurfis.semre@gmail.com</a></p>

          <p>Atenciosamente,<br><strong>Junta de Recursos Fiscais - JURFIS</strong></p>
        </div>
        <div class="footer">
          Este é um email automático. Por favor, não responda diretamente.
        </div>
      </div>
    </body>
    </html>
  `;
}

// Função para enviar email de alteração de reunião
export async function sendUpdateEmail(oldData: MeetingData, newData: MeetingData): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: `"JURFIS - Junta de Recursos Fiscais" <${process.env.GMAIL_USER}>`,
      to: newData.email,
      subject: 'Reunião Reagendada - JURFIS/SEFAZ',
      html: getUpdateEmailTemplate(oldData, newData),
    });

    console.log('Email de alteração enviado com sucesso para:', newData.email);
    return true;
  } catch (error) {
    console.error('Erro ao enviar email de alteração:', error);
    return false;
  }
}
