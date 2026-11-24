import { redirect } from "next/navigation";

/**
 * Volta para a página do painel exibindo uma mensagem de erro.
 * Usado dentro de server actions (o redirect() do Next é tratado
 * como navegação, não como exceção de verdade).
 */
export function actionError(path: string, message: string): never {
  redirect(`${path}?err=${encodeURIComponent(message)}`);
}

/** Volta para a página do painel exibindo uma mensagem de sucesso. */
export function actionOk(path: string, message?: string): never {
  redirect(message ? `${path}?ok=${encodeURIComponent(message)}` : path);
}
