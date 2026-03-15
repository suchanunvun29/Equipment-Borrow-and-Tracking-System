export const appLogger = {
  info(action: string, detail?: unknown) {
    console.info(`[INFO] ${action}`, detail ?? "");
  },
  warn(action: string, detail?: unknown) {
    console.warn(`[WARN] ${action}`, detail ?? "");
  },
  error(action: string, detail?: unknown) {
    console.error(`[ERROR] ${action}`, detail ?? "");
  },
};
