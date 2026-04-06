import "server-only";

import { createSupabaseAdminClient } from "@/adapters/supabase/client-admin";
import { createSupabaseServerClient } from "@/adapters/supabase/client-server";
import { ensureUserContext } from "@/app/services/auth/ensure-user-context";
import { readOpenAIEnv } from "@/lib/env";

type AccountRow = {
  id: string;
  name: string;
  slug: string;
  timezone: string;
};

type ChannelRow = {
  business_account_id: string | null;
  created_at: string;
  id: string;
  name: string;
  phone_number_id: string | null;
  status: "active" | "inactive";
};

export type SettingsWorkspace = {
  id: string;
  name: string;
  slug: string;
  timezone: string;
};

export type SettingsChannel = {
  businessAccountId: string | null;
  id: string;
  name: string;
  phoneNumberId: string | null;
  status: "active" | "inactive";
} | null;

export type SettingsAI = {
  isConfigured: boolean;
  model: string;
};

export type SettingsData = {
  ai: SettingsAI;
  channel: SettingsChannel;
  totalChannels: number;
  workspace: SettingsWorkspace;
};

function compareChannels(left: ChannelRow, right: ChannelRow): number {
  if (left.status !== right.status) {
    return left.status === "active" ? -1 : 1;
  }

  return (
    new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
  );
}

function resolveOpenAIState(): SettingsAI {
  try {
    const env = readOpenAIEnv();

    return {
      isConfigured: true,
      model: env.OPENAI_MODEL,
    };
  } catch {
    return {
      isConfigured: false,
      model: process.env.OPENAI_MODEL?.trim() || "gpt-5.4-mini",
    };
  }
}

export async function getSettingsData(): Promise<SettingsData> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No pudimos cargar la sesión actual.");
  }

  const internalUser = await ensureUserContext(user);
  const admin = createSupabaseAdminClient();
  const [{ data: workspace, error: workspaceError }, { data: channels, error: channelsError }] =
    await Promise.all([
      admin
        .from("accounts")
        .select("id, name, slug, timezone")
        .eq("id", internalUser.account_id)
        .maybeSingle<AccountRow>(),
      admin
        .from("channels")
        .select("id, name, status, phone_number_id, business_account_id, created_at")
        .eq("account_id", internalUser.account_id)
        .returns<ChannelRow[]>(),
    ]);

  if (workspaceError || !workspace) {
    throw new Error("No pudimos cargar los datos del workspace.");
  }

  if (channelsError || !channels) {
    throw new Error("No pudimos cargar los canales del workspace.");
  }

  const sortedChannels = [...channels].sort(compareChannels);
  const selectedChannel = sortedChannels[0] ?? null;

  return {
    ai: resolveOpenAIState(),
    channel: selectedChannel
      ? {
          businessAccountId: selectedChannel.business_account_id,
          id: selectedChannel.id,
          name: selectedChannel.name,
          phoneNumberId: selectedChannel.phone_number_id,
          status: selectedChannel.status,
        }
      : null,
    totalChannels: channels.length,
    workspace: {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      timezone: workspace.timezone,
    },
  };
}
