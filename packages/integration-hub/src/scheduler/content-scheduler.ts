import { CronJob } from "cron";
import { generateContentBriefsDaily, materializeContentFromBriefs } from "../workflows/content.js";

export class ContentScheduler {
  private dailyBriefJob: CronJob | null = null;
  private contentMaterializationJob: CronJob | null = null;

  constructor() {
    // Schedule daily brief generation at a specific time (e.g., 2 AM daily)
    // In a real scenario, these schedules might be configurable.
    this.dailyBriefJob = new CronJob(
      "0 2 * * *", // 2:00 AM daily
      async () => {
        console.log("[ContentScheduler] Running daily content brief generation...");
        try {
          await generateContentBriefsDaily();
          console.log("[ContentScheduler] Daily content brief generation completed.");
        } catch (error) {
          console.error("[ContentScheduler] Daily content brief generation failed:", error);
        }
      },
      null, // onComplete
      true, // start
      "UTC" // timeZone
    );

    // Schedule content materialization every 4 hours
    this.contentMaterializationJob = new CronJob(
      "0 */4 * * *", // Every 4 hours
      async () => {
        console.log("[ContentScheduler] Running content materialization...");
        try {
          await materializeContentFromBriefs();
          console.log("[ContentScheduler] Content materialization completed.");
        } catch (error) {
          console.error("[ContentScheduler] Content materialization failed:", error);
        }
      },
      null, // onComplete
      true, // start
      "UTC" // timeZone
    );
  }

  start(): void {
    if (this.dailyBriefJob && !this.dailyBriefJob.running) {
      this.dailyBriefJob.start();
      console.log("[ContentScheduler] Daily brief generation job started.");
    }
    if (this.contentMaterializationJob && !this.contentMaterializationJob.running) {
      this.contentMaterializationJob.start();
      console.log("[ContentScheduler] Content materialization job started.");
    }
  }

  stop(): void {
    if (this.dailyBriefJob && this.dailyBriefJob.running) {
      this.dailyBriefJob.stop();
      console.log("[ContentScheduler] Daily brief generation job stopped.");
    }
    if (this.contentMaterializationJob && this.contentMaterializationJob.running) {
      this.contentMaterializationJob.stop();
      console.log("[ContentScheduler] Content materialization job stopped.");
    }
  }
}

// Singleton instance
let instance: ContentScheduler | null = null;

export function getContentScheduler(): ContentScheduler {
  if (!instance) {
    instance = new ContentScheduler();
  }
  return instance;
}
