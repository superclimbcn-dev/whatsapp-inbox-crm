import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/adapters/supabase/client-server";
import { PanelSurface } from "@/web/components/ui/panel-surface";
import { StatusBadge } from "@/web/components/ui/status-badge";
import { LoginForm } from "@/web/features/auth/login-form";

export default async function LoginPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/inbox");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[minmax(0,1.15fr)_440px]">
        <PanelSurface className="hidden p-8 lg:block">
          <p className="text-xs uppercase tracking-[0.24em] text-foreground-muted">
            Acceso seguro
          </p>
          <h1 className="mt-4 max-w-xl text-4xl font-semibold leading-tight text-foreground">
            Workspace premium para operar conversaciones y relaciones desde una
            misma consola.
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-8 text-foreground-muted">
            Esta pantalla define el tono del producto desde el inicio: sobrio,
            consistente y preparado para crecer hacia WhatsApp Engine + Inbox +
            CRM con una base multiusuario por cuenta.
          </p>
        </PanelSurface>

        <PanelSurface className="p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-foreground-muted">
                Inicio de sesi&oacute;n
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-foreground">
                Acceder al workspace
              </h2>
            </div>
            <StatusBadge tone="success">Auth activa</StatusBadge>
          </div>

          <LoginForm />

          <div className="mt-6 flex items-center justify-between text-sm text-foreground-muted">
            <span>
              Acceso con Supabase Auth mediante correo y contrase&ntilde;a.
            </span>
          </div>
        </PanelSurface>
      </div>
    </main>
  );
}
