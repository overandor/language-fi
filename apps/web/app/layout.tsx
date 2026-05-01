import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Language.fi - Protocol-Grade Symbolic Asset Oracle",
  description: "Deterministic pricing from real data sources",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
