// Configuração de email

export const emailConfig = {
  // Gmail SMTP
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER || '',
    pass: process.env.GMAIL_APP_PASSWORD || '',
  },

  // Email do administrador
  adminEmail: process.env.ADMIN_EMAIL || 'jurfis.semre@gmail.com',

  // URL base da aplicação
  appUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
};
