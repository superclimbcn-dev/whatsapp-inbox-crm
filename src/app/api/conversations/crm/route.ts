import { NextResponse } from "next/server";

import { updateConversationCrm } from "@/app/services/conversations/update-conversation-crm";
import { isCrmState } from "@/core/crm/crm-state";

type UpdateConversationCrmRequestBody = {
  conversationId?: string;
  crmState?: string;
  internalNote?: string;
  metadata?: {
    internal_notes?: string;
  };
};

function isUpdateConversationCrmRequestBody(
  value: unknown,
): value is UpdateConversationCrmRequestBody {
  return typeof value === "object" && value !== null;
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
    !isUpdateConversationCrmRequestBody(body) ||
    typeof body.conversationId !== "string" ||
    typeof body.crmState !== "string" ||
    typeof body.internalNote !== "string"
  ) {
    return NextResponse.json(
      {
        error: "Faltan datos obligatorios para guardar el contexto CRM.",
      },
      {
        status: 400,
      },
    );
  }

  if (body.metadata && typeof body.metadata !== "object") {
    return NextResponse.json(
      {
        error: "El campo metadata debe ser un objeto válido.",
      },
      {
        status: 400,
      },
    );
  }

  if (!isCrmState(body.crmState)) {
    return NextResponse.json(
      {
        error: "El estado CRM recibido no es válido.",
      },
      {
        status: 400,
      },
    );
  }

  try {
    await updateConversationCrm({
      conversationId: body.conversationId,
      crmState: body.crmState,
      internalNote: body.internalNote,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No pudimos guardar el contexto CRM.";
    const status =
      message === "Tu sesión ya no es válida. Vuelve a iniciar sesión."
        ? 401
        : 400;

    return NextResponse.json(
      {
        error: message,
      },
      {
        status,
      },
    );
  }

  return NextResponse.json(
    {
      ok: true,
    },
    {
      status: 200,
    },
  );
}
