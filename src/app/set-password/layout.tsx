import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vælg adgangskode · Systemklar",
};

export default function SetPasswordLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
