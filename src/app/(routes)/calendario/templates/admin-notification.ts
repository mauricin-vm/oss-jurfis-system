import { getBaseEmailTemplate, formatDateBR, emailConfig, type MeetingData } from '@/lib/email';

/**
 * Template de email de notificação para o administrador
 * @param data - Dados da reunião solicitada
 * @returns HTML completo do email
 */
export function getAdminNotificationTemplate(data: MeetingData): string {
  const formattedDate = formatDateBR(data.date);

  const content = `
    <p>Uma nova solicitação de reunião foi recebida no sistema de calendário da JURFIS.</p>

    <div class="info-box">
      <h3>Detalhes da Solicitação</h3>
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
      <a href="${emailConfig.appUrl}/calendario" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px;">
        Acessar Sistema de Calendário
      </a>
    </div>
  `;

  return getBaseEmailTemplate({
    title: 'Solicitação de Reunião',
    headerColor: '#3b82f6', // Azul
    content,
  });
}
