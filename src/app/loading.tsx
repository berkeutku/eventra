export default function Loading() {
  return (
    <main className="px-6 py-14 sm:py-20" aria-busy="true">
      <div className="mx-auto max-w-6xl animate-pulse motion-reduce:animate-none">
        <div className="h-10 w-2/3 rounded-xl bg-lilac sm:h-14" />
        <div className="mt-4 h-5 w-1/2 rounded-lg bg-lilac" />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="overflow-hidden rounded-3xl bg-white ring-1 ring-black/5"
            >
              <div className="h-44 bg-lilac" />
              <div className="space-y-3 p-5">
                <div className="h-6 w-3/4 rounded-lg bg-lilac" />
                <div className="h-4 w-1/2 rounded-lg bg-lilac" />
                <div className="h-4 w-2/3 rounded-lg bg-lilac" />
              </div>
            </div>
          ))}
        </div>
        <span role="status" className="sr-only">
          Yükleniyor…
        </span>
      </div>
    </main>
  );
}