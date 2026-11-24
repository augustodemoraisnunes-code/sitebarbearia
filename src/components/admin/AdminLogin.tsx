"use client";

import { useActionState } from "react";
import { Loader2, Lock, ShieldCheck } from "lucide-react";
import { loginAction } from "@/lib/actions/auth";

export default function AdminLogin() {
  const [state, formAction, pending] = useActionState(loginAction, null);

  return (
    <form
      action={formAction}
      className="w-full max-w-md rounded-lg border border-white/10 bg-charcoal p-8"
    >
      <div className="flex flex-col items-center text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full border border-bronze/50 bg-bronze/10">
          <ShieldCheck size={26} className="text-bronze" />
        </span>
        <h1 className="display-title mt-5 text-3xl text-white">
          Painel administrativo
        </h1>
        <p className="mt-2 text-sm text-mist/75">
          Acesso restrito ao proprietário da barbearia.
        </p>
      </div>

      {state?.error && (
        <div
          role="alert"
          className="mt-6 rounded-md border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm text-red-200"
        >
          {state.error}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-5">
        <div>
          <label className="label" htmlFor="email">
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="username"
            className="field"
            placeholder="seu@email.com"
          />
        </div>
        <div>
          <label className="label" htmlFor="password">
            Senha
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="field"
            placeholder="••••••••"
          />
        </div>
      </div>

      <button type="submit" disabled={pending} className="btn btn-bronze mt-7 w-full">
        {pending ? (
          <>
            <Loader2 size={16} className="spin" /> Entrando…
          </>
        ) : (
          <>
            <Lock size={16} /> Entrar
          </>
        )}
      </button>

      <p className="mt-6 text-center text-xs leading-relaxed text-mist/55">
        Esqueceu a senha? Solicite a redefinição ao administrador do sistema.
      </p>
    </form>
  );
}
