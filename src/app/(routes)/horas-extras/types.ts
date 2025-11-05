export interface OvertimeRecord {
  id: string;
  userId: string;
  month: number;
  year: number;
  extraHours: number;
  lateHours: number;
  balance: number;
  accumulatedBalance: number;
  documentPath?: string;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    name?: string;
    email: string;
  };
}

export interface OvertimeFormData {
  month: number;
  year: number;
  extraHours: number;
  lateHours: number;
  document?: File;
}

export interface OvertimeStats {
  totalExtraHours: number;
  totalLateHours: number;
  currentBalance: number;
}
