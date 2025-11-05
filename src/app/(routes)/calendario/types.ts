export type MeetingStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Meeting {
  id: string;
  title: string;
  date: Date;
  startTime: string;
  endTime: string;
  requestedBy: string;
  email?: string;
  phone?: string;
  contacts?: string;
  notes?: string;
  status: MeetingStatus;
  rejectionReason?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MeetingFormData {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  requestedBy: string;
  email: string;
  phone: string;
  notes?: string;
}

export interface MeetingRequestFormData {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  requestedBy: string;
  email: string;
  phone: string;
  notes?: string;
}
