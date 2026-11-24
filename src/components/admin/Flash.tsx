export function getFlash(searchParams: { err?: string | string[]; ok?: string | string[] }) {
  const pick = (v?: string | string[]) =>
    v ? decodeURIComponent(Array.isArray(v) ? v[0] : v) : null;
  return { err: pick(searchParams.err), ok: pick(searchParams.ok) };
}

export function FlashMessages({
  err,
  ok,
}: {
  err?: string | null;
  ok?: string | null;
}) {
  if (!err && !ok) return null;
  return (
    <div className="mb-6 flex flex-col gap-3">
      {err && (
        <div
          role="alert"
          className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {err}
        </div>
      )}
      {ok && (
        <div
          role="status"
          className="rounded-md border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          {ok}
        </div>
      )}
    </div>
  );
}
