import { lazy, Suspense } from "react";

const ShaderBackground = lazy(() => import("./components/ShaderBackground"));

export default function App() {
  return (
    <div className="relative min-h-screen font-sans">
      <Suspense fallback={<div aria-hidden className="fixed inset-0 -z-10 bg-gradient-to-br from-[#4A61C0] via-[#5B73D8] to-[#1A2C7A]" />}>
        <ShaderBackground />
      </Suspense>
      <main className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <p className="rounded-md bg-card/80 px-6 py-4 text-sm text-muted-foreground shadow-md backdrop-blur">
          URL shortener UI lands in the next commit.
        </p>
      </main>
    </div>
  );
}
