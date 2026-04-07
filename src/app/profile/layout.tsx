import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Profile — bitmap.trade",
  description:
    "Manage your wallets and bitmap portfolio on bitmap.trade.",
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
