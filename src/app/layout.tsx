// Pass-through root layout. The actual <html>/<body> live in the localized
// public layout ([locale]/layout.tsx) and in the non-localized admin layout,
// so this root simply forwards its children.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
