/**
 * Fixed set of platforms editable in the admin settings form. Kept in a
 * plain (non-"use server") module so the client-rendered SettingsForm can
 * import the actual array/type at runtime — a "use server" file may only
 * export async functions; any other export (like a plain const) resolves to
 * a broken stub on the client.
 */
export const SOCIAL_PLATFORMS = ["instagram", "facebook", "tiktok", "whatsapp"] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];
export type SocialLinks = Record<SocialPlatform, { url: string; enabled: boolean }>;
