import { NextResponse } from "next/server";

import { sendOutboundMessage } from "@/app/services/whatsapp/send-outbound-message";

type SendRequestBody = {
  conversationId?: string;
  text?: string;
};

function isValidSendRequestBody(value: unknown): value is SendRequestBody {
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

  if (!isValidSendRequestBody(body)) {
    return NextResponse.json(
      {
        error: "La solicitud no tiene el formato esperado.",
      },
      {
        status: 400,
      },
    );
  }

  if (
    typeof body.conversationId !== "string" ||
    typeof body.text !== "string"
  ) {
    return NextResponse.json(
      {
        error: "Faltan datos obligatorios para enviar el mensaje.",
      },
      {
        status: 400,
      },
    );
  }

  try {
    await sendOutboundMessage({
      conversationId: body.conversationId,
      text: body.text,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No pudimos completar el envío del mensaje.";
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
