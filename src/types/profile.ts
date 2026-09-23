
export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';

/** Outbound shape returned by GET /profiles/{id} and GET /profiles/user/{userId} */
export interface ProfileResponse {
  id: number;
  userId: number;
  fullName: string;
  phoneNumber: string | null;
  dateOfBirth: string | null; // ISO date string, e.g. "1998-04-12"
  gender: string | null;
  monthlySalary: number | null;
  preferredCurrency: string; // 3-letter ISO code, e.g. "INR"
  primaryFinancialGoal: string | null;
  profilePictureUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Inbound payload for POST /profiles and PUT /profiles/{id} */
export interface ProfileRequest {
  userId: number;
  fullName: string;
  phoneNumber?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  monthlySalary?: number | null;
  preferredCurrency: string;
  primaryFinancialGoal?: string | null;
  profilePictureUrl?: string | null;
}

export interface ApiErrorResponse {
  timestamp?: string;
  status?: number;
  error?: string;
  message?: string;
  path?: string;
  fieldErrors?: Record<string, string>;
}