import "server-only";

/**
 * Small admin-editable app settings (Settings → Automation), stored the same
 * way as pricing overrides — a single JSON row, `null` meaning "use defaults".
 */

export interface AppSettings {
  /**
   * When true, a freshly generated proposal is approved and dispatched to the
   * client (email/WhatsApp, per their delivery preference) immediately —
   * no admin review step. Turn off to go back to manual "Approve & send".
   */
  autoSend: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = { autoSend: true };

export function resolveSettings(stored: Partial<AppSettings> | null): AppSettings {
  return { ...DEFAULT_SETTINGS, ...(stored ?? {}) };
}
