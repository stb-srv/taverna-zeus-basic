"use server";

import { i18nFromForm } from "@/i18n/fields";
import { buildOsmEmbedUrl } from "./geocode";
import { str, strOrNull } from "@/lib/form-data";
import { SOCIAL_PLATFORMS, type SocialLinks } from "@/lib/social-platforms";
import { fillTranslations, guard, revalidatePublic, type ActionState } from "./shared";

export type { ActionState } from "./shared";

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
    const closureMessageI18n = i18nFromForm((k) => str(fd, k), "closure_banner_message");
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
        closure_banner_enabled: fd.get("closure_banner_enabled") === "on",
        closure_banner_from: strOrNull(fd, "closure_banner_from"),
        closure_banner_until: strOrNull(fd, "closure_banner_until"),
        closure_banner_message_de: str(fd, "closure_banner_message_de"),
        closure_banner_message_i18n: closureMessageI18n,
      })
      .eq("id", 1);
    if (error) return { error: error.message };
    await fillTranslations(supabase, "restaurant_settings", 1, {
      description: { i18n: descI18n, source: str(fd, "description_de") },
      closure_banner_message: { i18n: closureMessageI18n, source: str(fd, "closure_banner_message_de") },
    });
    revalidatePublic();
    return { ok: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
