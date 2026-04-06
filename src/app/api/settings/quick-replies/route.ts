import { NextResponse } from "next/server";

import { updateQuickReplies } from "@/app/services/settings/update-quick-replies";
import { type QuickReply, type QuickReplyStage } from "@/core/settings/quick-replies";

type QuickRepliesRequestBody = {
  quickReplies?: Array<{
    id?: unknown;
    isActive?: unknown;
    label?: unknown;
    stage?: unknown;
    text?: unknown;
  }>;
};

function isQuickReplyStage(value: unknown): value is QuickReplyStage {
  return (
    value === "saludo" ||
    value === "fotos" ||
    value === "ubicacion" ||
    value === "servicio" ||
    value === "medidas" ||
    value === "presupuesto" ||
    value === "cierre"
  );
}

function parseQuickReplies(body: QuickRepliesRequestBody): QuickReply[] {
  if (!Array.isArray(body.quickReplies)) {
    throw new Error("No pudimos leer las respuestas rapidas enviadas.");
  }

  return body.quickReplies.map((reply) => {
    if (!reply || typeof reply !== "object") {
      throw new Error("No pudimos leer las respuestas rapidas enviadas.");
    }

    if (
      typeof reply.id !== "string" ||
      typeof reply.label !== "string" ||
      typeof reply.text !== "string" ||
      typeof reply.isActive !== "boolean" ||
      !isQuickReplyStage(reply.stage)
    ) {
      throw new Error("La configuracion de respuestas rapidas no es valida.");
    }

    return {
      id: reply.id,
      isActive: reply.isActive,
      label: reply.label,
      stage: reply.stage,
      text: reply.text,
    };
  });
}

export async function POST(request: Request): Promise<Response> {
  let payload: QuickRepliesRequestBody;

  try {
    payload = (await request.json()) as QuickRepliesRequestBody;
  } catch {
    return NextResponse.json(
      { error: "No pudimos leer la configuracion enviada." },
      { status: 400 },
    );
  }

  try {
    await updateQuickReplies({
      quickReplies: parseQuickReplies(payload),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No pudimos guardar las respuestas rapidas.",
      },
      { status: 400 },
    );
  }
}
