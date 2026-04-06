import { NextResponse } from "next/server";

import { generateReplyDraft } from "@/app/services/ai/generate-reply-draft";

type ReplyDraftRequestBody = {
  conversationId?: string;
};

function isReplyDraftRequestBody(
  value: unknown,
): value is ReplyDraftRequestBody {
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
    !isReplyDraftRequestBody(body) ||
    typeof body.conversationId !== "string"
  ) {
    return NextResponse.json(
      {
        error: "Faltan datos obligatorios para generar el borrador.",
      },
      {
        status: 400,
      },
    );
  }

  try {
    const draft = await generateReplyDraft({
      conversationId: body.conversationId,
    });

    return NextResponse.json(
      {
        draft,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No pudimos generar el borrador en este momento.";
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
