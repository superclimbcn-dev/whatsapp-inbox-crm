"use client";

import { useFormStatus } from "react-dom";

import { logoutAction } from "@/app/(dashboard)/actions";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-2xl border border-border bg-white/[0.03] px-4 py-2 text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted transition hover:border-accent/30 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Saliendo..." : "Cerrar sesión"}
    </button>
  );
}

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <SubmitButton />
    </form>
  );
}
