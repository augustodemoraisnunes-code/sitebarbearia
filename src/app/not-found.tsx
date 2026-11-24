import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-ink px-6 text-center">
      <p className="display-title text-7xl text-bronze">404</p>
      <h1 className="serif-title text-2xl text-white md:text-3xl">
        Página não encontrada
      </h1>
      <p className="max-w-md text-sm leading-relaxed text-mist/80">
        O endereço que você acessou não existe ou foi movido.
      </p>
      <Link href="/" className="btn btn-bronze">
        Voltar ao início
      </Link>
    </div>
  );
}
