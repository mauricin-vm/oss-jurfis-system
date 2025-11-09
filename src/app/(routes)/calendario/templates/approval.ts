import { getBaseEmailTemplate, formatDateBR, type MeetingData } from '@/lib/email';

/**
 * Template de email de aprovação de reunião
 * @param data - Dados da reunião aprovada
 * @returns HTML completo do email
 */
export function getApprovalEmailTemplate(data: MeetingData): string {
  const formattedDate = formatDateBR(data.date);

  const content = `
    <p>Olá, <strong>${data.requestedBy}</strong>!</p>

    <p>Sua solicitação de reunião foi <strong>aprovada</strong> pela Junta de Recursos Fiscais (JURFIS).</p>

    <div class="info-box">
      <h3>Detalhes da Reunião</h3>
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
  `;

  return getBaseEmailTemplate({
    title: 'Resposta de Solicitação de Agendamento',
    headerColor: '#10b981', // Verde
    content,
  });
}
