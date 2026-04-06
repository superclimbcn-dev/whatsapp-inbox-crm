import { NextResponse } from "next/server";

import {
  QUICK_REPLY_IDS,
  type QuickReply,
} from "@/core/settings/quick-replies";
import { updateQuickReplies } from "@/app/services/settings/update-quick-replies";

function buildRedirectUrl(request: Request): URL {
  return new URL("/settings", request.url);
}

export async function POST(request: Request): Promise<Response> {
  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      {
        error: "No pudimos leer la configuración enviada.",
      },
      {
        status: 400,
      },
    );
  }

  const redirectUrl = buildRedirectUrl(request);

  try {
    const quickReplies = QUICK_REPLY_IDS.map((id) => ({
      id,
      isActive: formData.get(`active_${id}`) === "on",
      label:
        typeof formData.get(`label_${id}`) === "string"
          ? (formData.get(`label_${id}`) as string)
          : "",
      text:
        typeof formData.get(`text_${id}`) === "string"
          ? (formData.get(`text_${id}`) as string)
          : "",
    })) satisfies QuickReply[];

    await updateQuickReplies({
      quickReplies,
    });

    redirectUrl.searchParams.set("quick_replies_saved", "1");
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No pudimos guardar las respuestas rápidas.";

    redirectUrl.searchParams.set("quick_replies_error", message);
  }

  return NextResponse.redirect(redirectUrl, {
    status: 303,
  });
}
