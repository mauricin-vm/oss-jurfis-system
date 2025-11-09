import { getBaseEmailTemplate, formatDateBR, type MeetingData } from '@/lib/email';

/**
 * Template de email de rejeição de reunião
 * @param data - Dados da reunião rejeitada
 * @param reason - Motivo da rejeição
 * @returns HTML completo do email
 */
export function getRejectionEmailTemplate(data: MeetingData, reason: string): string {
  const formattedDate = formatDateBR(data.date);

  const content = `
    <p>Olá, <strong>${data.requestedBy}</strong>!</p>

    <p>Infelizmente, não foi possível aprovar sua solicitação de reunião com a Junta de Recursos Fiscais (JURFIS).</p>

    <div class="info-box">
      <h3>Solicitação Original</h3>
      <p><strong>Data solicitada:</strong> ${formattedDate}</p>
      <p><strong>Horário solicitado:</strong> ${data.startTime} às ${data.endTime}</p>
    </div>

    <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 15px; margin: 20px 0; border-radius: 5px;">
      <h3 style="margin-top: 0; color: #991b1b;">📋 Motivo:</h3>
      <p>${reason}</p>
    </div>

    <p>Atenciosamente,<br><strong>Junta de Recursos Fiscais - JURFIS</strong></p>
  `;

  return getBaseEmailTemplate({
    title: 'Resposta de Solicitação de Agendamento',
    headerColor: '#ef4444', // Vermelho
    content,
  });
}
