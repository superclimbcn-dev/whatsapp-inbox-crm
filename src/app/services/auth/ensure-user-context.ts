import type { User } from "@supabase/supabase-js";
import "server-only";

import { createSupabaseAdminClient } from "@/adapters/supabase/client-admin";

type InternalUserRow = {
  id: string;
  account_id: string;
};

function buildAccountName(user: User): string {
  const metadataName =
    typeof user.user_metadata.full_name === "string"
      ? user.user_metadata.full_name
      : typeof user.user_metadata.name === "string"
        ? user.user_metadata.name
        : null;

  if (metadataName) {
    return metadataName.trim();
  }

  const emailPrefix = user.email?.split("@")[0] ?? "workspace";
  const normalized = emailPrefix.replace(/[._-]+/g, " ").trim();

  if (!normalized) {
    return "Mi workspace";
  }

  return normalized
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function buildAccountSlug(user: User): string {
  const emailPrefix = user.email?.split("@")[0] ?? "workspace";
  const baseSlug = emailPrefix
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const safeBase = baseSlug || "workspace";

  return `${safeBase}-${user.id.slice(0, 8)}`;
}

function buildFullName(user: User): string | null {
  const metadataName =
    typeof user.user_metadata.full_name === "string"
      ? user.user_metadata.full_name
      : typeof user.user_metadata.name === "string"
        ? user.user_metadata.name
        : null;

  if (metadataName) {
    return metadataName.trim();
  }

  return null;
}

export async function ensureUserContext(user: User): Promise<InternalUserRow> {
  const admin = createSupabaseAdminClient();

  const { data: existingUser, error: existingUserError } = await admin
    .from("users")
    .select("id, account_id")
    .eq("id", user.id)
    .maybeSingle<InternalUserRow>();

  if (existingUserError) {
    throw new Error("No pudimos comprobar el usuario interno.");
  }

  if (existingUser) {
    return existingUser;
  }

  const accountId = user.id;
  const accountName = buildAccountName(user);
  const accountSlug = buildAccountSlug(user);
  const fullName = buildFullName(user);

  const { error: accountError } = await admin.from("accounts").upsert(
    {
      id: accountId,
      name: accountName,
      slug: accountSlug,
    },
    {
      onConflict: "id",
      ignoreDuplicates: false,
    },
  );

  if (accountError) {
    throw new Error("No pudimos crear la cuenta inicial.");
  }

  const { data: internalUser, error: userError } = await admin
    .from("users")
    .upsert(
      {
        id: user.id,
        account_id: accountId,
        role: "admin",
        is_active: true,
        full_name: fullName,
      },
      {
        onConflict: "id",
        ignoreDuplicates: false,
      },
    )
    .select("id, account_id")
    .single<InternalUserRow>();

  if (userError) {
    throw new Error("No pudimos crear el usuario interno.");
  }

  return internalUser;
}
