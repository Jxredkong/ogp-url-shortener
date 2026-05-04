import { lazy, Suspense, useState } from "react";
import AccessGate from "./components/AccessGate";
import Shortener from "./components/Shortener";
import { getToken } from "./lib/api";

const ShaderBackground = lazy(() => import("./components/ShaderBackground"));

export default function App() {
  const [authed, setAuthed] = useState<boolean>(() => Boolean(getToken()));

  return (
    <div className="relative min-h-screen font-sans">
      <Suspense
        fallback={
          <div
            aria-hidden
            className="fixed inset-0 -z-10 bg-gradient-to-br from-[#4A61C0] via-[#5B73D8] to-[#1A2C7A]"
          />
        }
      >
        <ShaderBackground />
      </Suspense>
      <div className="relative z-10">
        {authed ? (
          <Shortener onSignOut={() => setAuthed(false)} />
        ) : (
          <AccessGate onAuthenticated={() => setAuthed(true)} />
        )}
      </div>
    </div>
  );
}
