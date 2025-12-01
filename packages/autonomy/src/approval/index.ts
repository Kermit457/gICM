/**
 * Approval Module for Level 2 Autonomy
 *
 * Components for approval queue management and notifications
 */

export {
  ApprovalQueue,
  type ApprovalQueueConfig,
  type ApprovalQueueEvents,
} from "./approval-queue.js";
export {
  NotificationManager,
  type NotificationManagerConfig,
} from "./notification-manager.js";
export {
  BatchApproval,
  type BatchSummary,
  type BatchFilter,
} from "./batch-approval.js";
