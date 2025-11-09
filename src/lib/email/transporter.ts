import nodemailer from 'nodemailer';
import { emailConfig } from './config';

// Criar transporter do Nodemailer
export const transporter = nodemailer.createTransport({
  service: emailConfig.service,
  auth: emailConfig.auth,
});

// Verificar conexão (opcional, útil para debug)
export async function verifyConnection(): Promise<boolean> {
  try {
    await transporter.verify();
    console.log('✅ Email server connection verified');
    return true;
  } catch (error) {
    console.error('❌ Email server connection failed:', error);
    return false;
  }
}
