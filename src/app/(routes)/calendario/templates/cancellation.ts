import { getBaseEmailTemplate, formatDateBR, type MeetingData } from '@/lib/email';

/**
 * Template de email de cancelamento de reunião
 * @param data - Dados da reunião cancelada
 * @param reason - Justificativa do cancelamento
 * @returns HTML completo do email
 */
export function getCancellationEmailTemplate(data: MeetingData, reason: string): string {
  const formattedDate = formatDateBR(data.date);

  const content = `
    <p>Olá, <strong>${data.requestedBy}</strong>!</p>

    <p>Informamos que a reunião agendada com a Junta de Recursos Fiscais (JURFIS) foi <strong>cancelada</strong>.</p>

    <div class="info-box">
      <h3>Detalhes da Reunião Cancelada</h3>
      <p><strong>Título:</strong> ${data.title}</p>
      <p><strong>Data:</strong> ${formattedDate}</p>
      <p><strong>Horário:</strong> ${data.startTime} às ${data.endTime}</p>
    </div>

    <div style="background-color: #fffbeb; border: 1px solid #fde68a; padding: 15px; margin: 20px 0; border-radius: 5px;">
      <h3 style="margin-top: 0; color: #92400e;">Justificativa do Cancelamento:</h3>
      <p>${reason}</p>
    </div>

    <p>Caso deseje reagendar, entre em contato pelo email: <a href="mailto:jurfis.semre@gmail.com">jurfis.semre@gmail.com</a></p>

    <p>Atenciosamente,<br><strong>Junta de Recursos Fiscais - JURFIS</strong></p>
  `;

  return getBaseEmailTemplate({
    title: 'Cancelamento de Reunião',
    headerColor: '#f59e0b', // Laranja
    content,
  });
}
