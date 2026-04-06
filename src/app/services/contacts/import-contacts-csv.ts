import "server-only";

import { createSupabaseAdminClient } from "@/adapters/supabase/client-admin";
import { createSupabaseServerClient } from "@/adapters/supabase/client-server";
import { ensureUserContext } from "@/app/services/auth/ensure-user-context";
import { normalizePhone } from "@/core/contacts/normalize-phone";

const MAX_CSV_FILE_SIZE = 256 * 1024;
const MAX_CSV_ROWS = 500;
const ACCEPTED_HEADERS = [
  ["name", "phone"],
  ["nombre", "telefono"],
] as const;

type ExistingContactRow = {
  phone_e164: string;
};

type ImportContactsCsvResult = {
  duplicated: number;
  ignored: number;
  imported: number;
};

type CsvContactDraft = {
  displayName: string | null;
  phoneE164: string;
};

function normalizeHeaderValue(value: string): string {
  return value.trim().toLowerCase();
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let isInsideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];

    if (character === '"') {
      if (isInsideQuotes && nextCharacter === '"') {
        current += '"';
        index += 1;
        continue;
      }

      isInsideQuotes = !isInsideQuotes;
      continue;
    }

    if (character === "," && !isInsideQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += character;
  }

  values.push(current.trim());

  return values;
}

function parseCsvText(text: string): string[] {
  return text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function isAcceptedHeader(values: string[]): boolean {
  if (values.length < 2) {
    return false;
  }

  const normalizedValues = values.slice(0, 2).map(normalizeHeaderValue);

  return ACCEPTED_HEADERS.some(
    (header) =>
      header[0] === normalizedValues[0] && header[1] === normalizedValues[1],
  );
}

async function readCsvFile(file: File): Promise<string> {
  if (!file.name.toLowerCase().endsWith(".csv")) {
    throw new Error("El archivo debe estar en formato CSV.");
  }

  if (file.size === 0) {
    throw new Error("El archivo CSV estÃ¡ vacÃ­o.");
  }

  if (file.size > MAX_CSV_FILE_SIZE) {
    throw new Error("El archivo CSV supera el tamaÃ±o mÃ¡ximo permitido.");
  }

  return file.text();
}

function buildDraftFromValues(values: string[]): CsvContactDraft | null {
  const displayName = values[0]?.trim() || null;
  const phoneE164 = normalizePhone(values[1]?.trim() || null);

  if (!phoneE164) {
    return null;
  }

  return {
    displayName,
    phoneE164,
  };
}

export async function importContactsCsv(
  file: File,
): Promise<ImportContactsCsvResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Tu sesiÃ³n ya no es vÃ¡lida. Vuelve a iniciar sesiÃ³n.");
  }

  const internalUser = await ensureUserContext(user);
  const text = await readCsvFile(file);
  const lines = parseCsvText(text);

  if (lines.length < 2) {
    throw new Error("El CSV debe incluir cabecera y al menos una fila.");
  }

  if (lines.length - 1 > MAX_CSV_ROWS) {
    throw new Error("El CSV supera el lÃ­mite mÃ¡ximo de filas permitido.");
  }

  const headerValues = parseCsvLine(lines[0]);

  if (!isAcceptedHeader(headerValues)) {
    throw new Error(
      "La cabecera del CSV debe ser name,phone o nombre,telefono.",
    );
  }

  const drafts: CsvContactDraft[] = [];
  let ignored = 0;
  let duplicated = 0;
  const seenPhones = new Set<string>();

  for (const line of lines.slice(1)) {
    const values = parseCsvLine(line);

    if (values.length < 2) {
      ignored += 1;
      continue;
    }

    const draft = buildDraftFromValues(values);

    if (!draft) {
      ignored += 1;
      continue;
    }

    if (seenPhones.has(draft.phoneE164)) {
      duplicated += 1;
      continue;
    }

    seenPhones.add(draft.phoneE164);
    drafts.push(draft);
  }

  if (drafts.length === 0) {
    return {
      duplicated,
      ignored,
      imported: 0,
    };
  }

  const admin = createSupabaseAdminClient();
  const phones = drafts.map((draft) => draft.phoneE164);
  const { data: existingContacts, error: existingContactsError } = await admin
    .from("contacts")
    .select("phone_e164")
    .eq("account_id", internalUser.account_id)
    .in("phone_e164", phones)
    .returns<ExistingContactRow[]>();

  if (existingContactsError) {
    throw new Error("No pudimos comprobar los contactos existentes.");
  }

  const existingPhones = new Set(
    (existingContacts ?? []).map((contact) => contact.phone_e164),
  );
  const contactsToInsert = drafts.filter((draft) => {
    if (existingPhones.has(draft.phoneE164)) {
      duplicated += 1;
      return false;
    }

    return true;
  });

  if (contactsToInsert.length === 0) {
    return {
      duplicated,
      ignored,
      imported: 0,
    };
  }

  const { error: insertError } = await admin.from("contacts").insert(
    contactsToInsert.map((draft) => ({
      account_id: internalUser.account_id,
      display_name: draft.displayName,
      phone_e164: draft.phoneE164,
    })),
  );

  if (insertError) {
    throw new Error("No pudimos importar los contactos del archivo.");
  }

  return {
    duplicated,
    ignored,
    imported: contactsToInsert.length,
  };
}
