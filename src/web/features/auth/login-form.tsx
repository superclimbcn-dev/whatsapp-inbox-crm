"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  loginAction,
  type LoginActionState,
} from "@/app/(auth)/login/actions";

const initialState: LoginActionState = {
  error: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 h-12 w-full rounded-2xl border border-[rgba(88,108,176,0.44)] bg-[linear-gradient(180deg,rgba(66,84,142,0.96),rgba(41,55,98,0.98))] px-4 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(14,20,38,0.26)] transition hover:border-[rgba(108,128,196,0.52)] hover:bg-[linear-gradient(180deg,rgba(76,95,156,0.98),rgba(46,62,109,1))] disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Entrando..." : "Entrar al workspace"}
    </button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initialState);

  return (
    <form className="mt-8 space-y-4" action={formAction}>
      <label className="block">
        <span className="text-sm font-medium text-foreground">
          Correo corporativo
        </span>
        <input
          type="email"
          name="email"
          placeholder="equipo@nexodigital.com"
          autoComplete="email"
          className="mt-2 h-12 w-full rounded-2xl border border-border bg-background-soft px-4 text-sm text-foreground outline-none transition focus:border-accent/40"
          required
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-foreground">Contraseña</span>
        <input
          type="password"
          name="password"
          placeholder="Introduce tu contraseña"
          autoComplete="current-password"
          className="mt-2 h-12 w-full rounded-2xl border border-border bg-background-soft px-4 text-sm text-foreground outline-none transition focus:border-accent/40"
          required
        />
      </label>

      {state.error ? (
        <p className="rounded-2xl border border-warning/20 bg-warning-soft px-4 py-3 text-sm text-amber-200">
          {state.error}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
