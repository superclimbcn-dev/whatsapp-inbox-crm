import { NextResponse } from "next/server";

import { createConversation } from "@/app/services/conversations/create-conversation";
import { ensureUserContext } from "@/app/services/auth/ensure-user-context";

type CreateConversationRequestBody = {
  contactId?: string;
};

function isValidCreateConversationRequestBody(
  value: unknown,
): value is CreateConversationRequestBody {
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
    !isValidCreateConversationRequestBody(body) ||
    typeof body.contactId !== "string"
  ) {
    return NextResponse.json(
      {
        error: "Faltan datos obligatorios para crear la conversación.",
      },
      {
        status: 400,
      },
    );
  }

  try {
    const conversationId = await createConversation({
      contactId: body.contactId,
    });

    return NextResponse.json(
      {
        ok: true,
        conversationId,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No pudimos crear la conversación.";
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
}