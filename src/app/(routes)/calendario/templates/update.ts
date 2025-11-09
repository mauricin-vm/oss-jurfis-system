import { getBaseEmailTemplate, formatDateBR, type MeetingData } from '@/lib/email';

/**
 * Template de email de atualização/reagendamento de reunião
 * @param oldData - Dados da reunião anterior
 * @param newData - Dados da reunião atualizada
 * @returns HTML completo do email
 */
export function getUpdateEmailTemplate(oldData: MeetingData, newData: MeetingData): string {
  const oldFormattedDate = formatDateBR(oldData.date);
  const newFormattedDate = formatDateBR(newData.date);

  const content = `
    <p>Olá, <strong>${newData.requestedBy}</strong>!</p>

    <p>Informamos que a reunião "<strong>${newData.title}</strong>" foi <strong>reagendada</strong>.</p>

    <div style="background-color: white; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #991b1b;">Agendamento Anterior</h3>
      <p><strong>Data:</strong> ${oldFormattedDate}</p>
      <p><strong>Horário:</strong> ${oldData.startTime} às ${oldData.endTime}</p>
    </div>

    <div style="background-color: white; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
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
  `;

  return getBaseEmailTemplate({
    title: 'Alteração de Reunião',
    headerColor: '#3b82f6', // Azul
    content,
  });
}
