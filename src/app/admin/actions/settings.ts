"use server";

import { i18nFromForm } from "@/i18n/fields";
import { buildOsmEmbedUrl } from "./geocode";
import { str, strOrNull } from "@/lib/form-data";
import { fillTranslations, guard, revalidatePublic, type ActionState } from "./shared";

export type { ActionState } from "./shared";

/** Fixed set of platforms editable in the settings form (Feature: Social-Media-Links). */
export const SOCIAL_PLATFORMS = ["instagram", "facebook", "tiktok", "whatsapp"] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];
export type SocialLinks = Record<SocialPlatform, { url: string; enabled: boolean }>;

function socialLinksFromForm(fd: FormData): SocialLinks {
  return Object.fromEntries(
    SOCIAL_PLATFORMS.map((p) => [
      p,
      { url: str(fd, `social_${p}_url`), enabled: fd.get(`social_${p}_enabled`) === "on" },
    ]),
  ) as SocialLinks;
}

export async function updateSettings(_prev: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const supabase = await guard();
    const descI18n = i18nFromForm((k) => str(fd, k), "description");
    const address = {
      street: strOrNull(fd, "address_street"),
      zip: strOrNull(fd, "address_zip"),
      city: strOrNull(fd, "address_city"),
      country: strOrNull(fd, "address_country"),
    };
    // Empty embed field → derive the map from the address (OpenStreetMap).
    const mapEmbed = strOrNull(fd, "google_maps_embed") ?? (await buildOsmEmbedUrl(address));
    const { error } = await supabase
      .from("restaurant_settings")
      .update({
        name: str(fd, "name") || "Taverna Zeus",
        description_de: strOrNull(fd, "description_de"),
        description_en: strOrNull(fd, "description_en"),
        description_i18n: descI18n,
        address_street: address.street,
        address_zip: address.zip,
        address_city: address.city,
        address_country: address.country,
        phone: strOrNull(fd, "phone"),
        email: strOrNull(fd, "email"),
        google_maps_embed: mapEmbed,
        hero_image_url: strOrNull(fd, "hero_image_url"),
        social_links: socialLinksFromForm(fd),
      })
      .eq("id", 1);
    if (error) return { error: error.message };
    await fillTranslations(supabase, "restaurant_settings", 1, {
      description: { i18n: descI18n, source: str(fd, "description_de") },
    });
    revalidatePublic();
    return { ok: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
