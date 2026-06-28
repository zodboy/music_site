import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Toaster } from "sonner";
import Header from "./Header";
import PlayerBar from "./PlayerBar";
import { useUserStore } from "@/store/user";

export default function Layout() {
  const init = useUserStore((s) => s.init);

  useEffect(() => {
    init();
  }, [init]);

  return (
    <div className="flex min-h-screen flex-col bg-ink-base text-fg-primary">
      <Header />
      <main className="flex-1 pb-32">
        <Outlet />
      </main>
      <PlayerBar />
      <Toaster
        theme="dark"
        position="top-right"
        toastOptions={{
          style: {
            background: "#15151D",
            border: "1px solid #26262F",
            color: "#F5F5F7",
          },
        }}
      />
    </div>
  );
}
