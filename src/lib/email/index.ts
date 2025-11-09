// Exports principais do sistema de email

export * from './types';
export * from './config';
export { transporter, verifyConnection } from './transporter';
export { sendEmail } from './sender';
export { getBaseEmailTemplate, formatDateBR } from './templates/base';
