import { transporter } from './transporter';
import type { EmailOptions, EmailResult } from './types';

/**
 * Função genérica para enviar emails
 * @param options - Opções do email (to, subject, html, cc, bcc)
 * @returns Promise com resultado do envio
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  try {
    const { to, subject, html, cc, bcc } = options;

    await transporter.sendMail({
      from: `"JURFIS/SEFAZ" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
      cc,
      bcc,
    });

    console.log('✅ Email enviado com sucesso para:', to);
    return { success: true };
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}
