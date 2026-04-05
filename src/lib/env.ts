type EnvSource = NodeJS.ProcessEnv;

type PublicEnv = {
  NEXT_PUBLIC_APP_URL: string;
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
};

type ServerEnv = PublicEnv & {
  SUPABASE_SERVICE_ROLE_KEY: string;
  WHATSAPP_ACCESS_TOKEN: string;
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: string;
  WHATSAPP_APP_SECRET: string;
  WHATSAPP_PHONE_NUMBER_ID: string;
  WHATSAPP_BUSINESS_ACCOUNT_ID: string;
};

function readRequired(source: EnvSource, key: keyof ServerEnv): string {
  const value = source[key];

  if (!value) {
    throw new Error(`Falta la variable de entorno requerida: ${key}`);
  }

  return value;
}

export function readPublicEnv(source: EnvSource = process.env): PublicEnv {
  return {
    NEXT_PUBLIC_APP_URL: readRequired(source, "NEXT_PUBLIC_APP_URL"),
    NEXT_PUBLIC_SUPABASE_URL: readRequired(source, "NEXT_PUBLIC_SUPABASE_URL"),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: readRequired(
      source,
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    ),
  };
}

export function readSupabaseEnv(
  source: EnvSource = process.env,
): Pick<
  ServerEnv,
  | "NEXT_PUBLIC_SUPABASE_URL"
  | "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  | "SUPABASE_SERVICE_ROLE_KEY"
> {
  return {
    NEXT_PUBLIC_SUPABASE_URL: readRequired(source, "NEXT_PUBLIC_SUPABASE_URL"),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: readRequired(
      source,
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    ),
    SUPABASE_SERVICE_ROLE_KEY: readRequired(
      source,
      "SUPABASE_SERVICE_ROLE_KEY",
    ),
  };
}

export function readWhatsappWebhookEnv(
  source: EnvSource = process.env,
): Pick<ServerEnv, "WHATSAPP_WEBHOOK_VERIFY_TOKEN"> {
  return {
    WHATSAPP_WEBHOOK_VERIFY_TOKEN: readRequired(
      source,
      "WHATSAPP_WEBHOOK_VERIFY_TOKEN",
    ),
  };
}

export function readWhatsappSendEnv(
  source: EnvSource = process.env,
): Pick<ServerEnv, "WHATSAPP_ACCESS_TOKEN" | "WHATSAPP_PHONE_NUMBER_ID"> {
  return {
    WHATSAPP_ACCESS_TOKEN: readRequired(source, "WHATSAPP_ACCESS_TOKEN"),
    WHATSAPP_PHONE_NUMBER_ID: readRequired(source, "WHATSAPP_PHONE_NUMBER_ID"),
  };
}

export function readServerEnv(source: EnvSource = process.env): ServerEnv {
  return {
    ...readPublicEnv(source),
    ...readSupabaseEnv(source),
    WHATSAPP_ACCESS_TOKEN: readRequired(source, "WHATSAPP_ACCESS_TOKEN"),
    WHATSAPP_WEBHOOK_VERIFY_TOKEN: readRequired(
      source,
      "WHATSAPP_WEBHOOK_VERIFY_TOKEN",
    ),
    WHATSAPP_APP_SECRET: readRequired(source, "WHATSAPP_APP_SECRET"),
    WHATSAPP_PHONE_NUMBER_ID: readRequired(source, "WHATSAPP_PHONE_NUMBER_ID"),
    WHATSAPP_BUSINESS_ACCOUNT_ID: readRequired(
      source,
      "WHATSAPP_BUSINESS_ACCOUNT_ID",
    ),
  };
}
