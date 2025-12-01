/**
 * Type declarations for @gicm/integration-hub
 */
declare module "@gicm/integration-hub" {
  export function getHub(): {
    engineStarted(name: string): void;
    heartbeat(name: string): void;
  } | null;
}
