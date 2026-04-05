"use server";

import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/adapters/supabase/client-server";
import { ensureUserContext } from "@/app/services/auth/ensure-user-context";

export type LoginActionState = {
  error: string | null;
};

export async function loginAction(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || typeof password !== "string") {
    return {
      error: "Completa el correo y la contraseña para continuar.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return {
      error: "No pudimos iniciar sesión. Revisa tus credenciales.",
    };
  }

  try {
    await ensureUserContext(data.user);
  } catch {
    await supabase.auth.signOut();

    return {
      error:
        "Tu sesión se abrió, pero no pudimos preparar tu espacio de trabajo. Intenta de nuevo.",
    };
  }

  redirect("/inbox");
}
