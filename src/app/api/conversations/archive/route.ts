import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/adapters/supabase/client-admin";
import { createSupabaseServerClient } from "@/adapters/supabase/client-server";
import { ensureUserContext } from "@/app/services/auth/ensure-user-context";

type ArchiveConversationRequestBody = {
  conversationId?: string;
  archive?: boolean;
};

function isArchiveConversationRequestBody(
  value: unknown,
): value is ArchiveConversationRequestBody {
  return (
    typeof value === "object" &&
    value !== null &&
    "conversationId" in value &&
    typeof (value as ArchiveConversationRequestBody).conversationId === "string"
  );
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: "El cuerpo de la solicitud no es un JSON válido.",
      },
      {
        status: 400,
      },
    );
  }

  if (
    !isArchiveConversationRequestBody(body) ||
    typeof body.conversationId !== "string"
  ) {
    return NextResponse.json(
      {
        error: "Faltan datos obligatorios para archivar la conversación.",
      },
      {
        status: 400,
      },
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      {
        error: "Tu sesión ya no es válida. Vuelve a iniciar sesión.",
      },
      {
        status: 401,
      },
    );
  }

  try {
    const internalUser = await ensureUserContext(user);
    const admin = createSupabaseAdminClient();

    // Get the conversation to verify ownership
    const { data: conversation, error: fetchError } = await admin
      .from("conversations")
      .select("id, account_id, status")
      .eq("id", body.conversationId)
      .eq("account_id", internalUser.account_id)
      .maybeSingle();

    if (fetchError || !conversation) {
      return NextResponse.json(
        {
          error: "No pudimos encontrar la conversación solicitada.",
        },
        {
          status: 404,
        },
      );
    }

    // Toggle archive status
    const newStatus = body.archive !== false ? "closed" : "open";

    const { error: updateError } = await admin
      .from("conversations")
      .update({
        status: newStatus,
      })
      .eq("id", body.conversationId);

    if (updateError) {
      return NextResponse.json(
        {
          error: "No pudimos actualizar el estado de la conversación.",
        },
        {
          status: 400,
        },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        status: newStatus,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No pudimos archivar la conversación.";

    return NextResponse.json(
      {
        error: message,
      },
      {
        status: message === "Tu sesión ya no es válida. Vuelve a iniciar sesión."
          ? 401
          : 400,
      },
    );
  }
}