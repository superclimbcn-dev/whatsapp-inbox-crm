import { NextResponse } from "next/server";

import { importContactsCsv } from "@/app/services/contacts/import-contacts-csv";

function buildRedirectUrl(request: Request, formData: FormData): URL {
  const baseUrl = new URL("/contacts", request.url);
  const searchTerm = formData.get("q");
  const selectedContactId = formData.get("contact");

  if (typeof searchTerm === "string" && searchTerm.trim()) {
    baseUrl.searchParams.set("q", searchTerm.trim());
  }

  if (typeof selectedContactId === "string" && selectedContactId.trim()) {
    baseUrl.searchParams.set("contact", selectedContactId.trim());
  }

  return baseUrl;
}

export async function POST(request: Request): Promise<Response> {
  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      {
        error: "No pudimos leer el archivo enviado.",
      },
      {
        status: 400,
      },
    );
  }

  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      {
        error: "Debes seleccionar un archivo CSV para importar.",
      },
      {
        status: 400,
      },
    );
  }

  const redirectUrl = buildRedirectUrl(request, formData);

  try {
    const result = await importContactsCsv(file);

    redirectUrl.searchParams.set("imported", String(result.imported));
    redirectUrl.searchParams.set("duplicated", String(result.duplicated));
    redirectUrl.searchParams.set("ignored", String(result.ignored));
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No pudimos importar el archivo en este momento.";

    redirectUrl.searchParams.set("import_error", message);
  }

  return NextResponse.redirect(redirectUrl, {
    status: 303,
  });
}
