import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authService } from "@/lib/auth-service";
import DashboardLayoutClient from "./DashboardLayoutClient";
import { Providers } from "./Providers";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;

  if (!token) {
    redirect("/sign-in");
  }

  const sessionUser = await authService.getUserBySession(token);

  if (!sessionUser) {
    redirect("/sign-in");
  }

  return (
    <Providers>
      <DashboardLayoutClient>{children}</DashboardLayoutClient>
    </Providers>
  );
}
