// Tipos e interfaces para o sistema de email

export interface MeetingData {
  title: string;
  date: string;        // Formato: YYYY-MM-DD
  startTime: string;   // Formato: HH:MM
  endTime: string;     // Formato: HH:MM
  requestedBy: string;
  email: string;
  phone: string;
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  cc?: string;
  bcc?: string;
}

export interface EmailResult {
  success: boolean;
  error?: string;
}
