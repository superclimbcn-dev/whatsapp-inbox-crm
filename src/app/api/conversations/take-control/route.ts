import { NextResponse } from "next/server";

import { takeConversationControl } from "@/app/services/whatsapp/take-conversation-control";

type TakeControlRequestBody = {
  conversationId?: string;
};

function isValidTakeControlRequestBody(
  value: unknown,
): value is TakeControlRequestBody {
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
    !isValidTakeControlRequestBody(body) ||
    typeof body.conversationId !== "string"
  ) {
    return NextResponse.json(
      {
        error: "Faltan datos obligatorios para tomar control.",
      },
      {
        status: 400,
      },
    );
  }

  try {
    await takeConversationControl({
      conversationId: body.conversationId,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No pudimos tomar control de la conversación.";
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
