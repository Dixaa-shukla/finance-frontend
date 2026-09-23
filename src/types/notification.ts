export type NotificationType = 'BUDGET_ALERT' | 'GOAL_DEADLINE' | 'DUE_REMINDER' | 'MONTHLY_SUMMARY' | 'SYSTEM';
export interface NotificationResponse { id: number; userId: number; type: NotificationType; title: string; message: string; relatedEntityType: string | null; relatedEntityId: number | null; read: boolean; createdAt: string; }
