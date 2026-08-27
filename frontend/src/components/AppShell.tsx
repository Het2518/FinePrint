"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";

const PUBLIC_PATHS = ["/login"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isPublic = PUBLIC_PATHS.includes(pathname);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("fineprint_token");
    if (!isPublic && !token) {
      router.replace("/login");
    } else {
      // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
      setChecked(true);
    }
  }, [pathname, isPublic, router]);

  // Login page: no sidebar, full screen
  if (isPublic) {
    return <>{children}</>;
  }

  // Auth pages: show sidebar + main
  if (!checked) {
    return (
      <div suppressHydrationWarning className="min-h-screen flex items-center justify-center">
        <div suppressHydrationWarning className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div suppressHydrationWarning className="flex min-h-screen">
      <Sidebar />
      <main suppressHydrationWarning className="flex-1 ml-64 relative z-10 min-h-screen">{children}</main>
    </div>
  );
}
