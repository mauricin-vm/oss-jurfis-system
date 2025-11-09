// Template base compartilhado para todos os emails

export interface BaseTemplateOptions {
  title: string;
  headerColor: string;
  content: string;
}

/**
 * Template base com header, footer e estilos compartilhados
 * @param options - Opções do template (title, headerColor, content)
 * @returns HTML completo do email
 */
export function getBaseEmailTemplate(options: BaseTemplateOptions): string {
  const { title, headerColor, content } = options;

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
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: ${headerColor};
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
          border-left: 4px solid ${headerColor};
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
          font-size: 24px;
        }
        h3 {
          margin-top: 0;
          color: #1f2937;
        }
        strong {
          color: #1f2937;
        }
        p {
          margin: 10px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${title}</h1>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>Este é um email automático. Por favor, não responda.</p>
          <p>Em caso de dúvidas, entre em contato: <strong>jurfis.semre@gmail.com</strong></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Formata data no padrão brasileiro
 * @param dateString - Data no formato YYYY-MM-DD
 * @returns Data formatada (ex: "segunda-feira, 08 de novembro de 2025")
 */
export function formatDateBR(dateString: string): string {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    weekday: 'long',
  });
}
