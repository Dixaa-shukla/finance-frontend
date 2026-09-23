/**
 * Module 7 — Financial Goals.
 */

/** com.finance_backend.goal.entity.GoalStatus */
export type GoalStatus = 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED';

/** GoalResponse — what every goal GET returns. */
export interface GoalResponse {
  id: number;
  userId: number;
  title: string;
  description: string | null;
  targetAmount: number;
  /** Moved only by the contribute route. */
  currentAmount: number;
  /** targetAmount − currentAmount; negative once a goal is overfunded. */
  remainingAmount: number;
  progressPercent: number;
  targetDate: string;
  /** ⚠️ NEGATIVE once the target date has passed. */
  daysRemaining: number;
  status: GoalStatus;
  /** null unless the goal is IN_PROGRESS with something still to save. */
  suggestedMonthlySaving: number | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * GoalRequest — the body shared by POST /goals and PUT /goals/{id}.
 */
export interface GoalRequest {
  userId: number;
  title: string;
  description: string | null;
  targetAmount: number | null;
  targetDate: string;
}

/** GoalContributionRequest — the whole body of POST /goals/{id}/contribute. */
export interface GoalContributionRequest {
  amount: number | null;
}

/** Which rows the grid shows. Filtered in the browser — see the note below. */
export type GoalStatusScope = 'ALL' | GoalStatus;

/**
 * There is no server-side filter for goal status.
 */
export const GOAL_STATUS_LABELS: Record<GoalStatus, string> = {
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  EXPIRED: 'Expired',
};
