import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zkeleton | Data Vision",
  description:
    "$908.8B in Medicaid claims. 95% have no clinical record attached. See where the money hides.",
  openGraph: {
    title: "Zkeleton | Data Vision",
    description:
      "Claims data = what was billed. Clinical data = what actually happened. The gap is where the money hides.",
    siteName: "Zkeleton",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
