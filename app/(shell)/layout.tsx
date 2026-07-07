/** Shared container for content pages; the homepage manages its own width. */
export default function ShellLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="mx-auto w-full max-w-4xl px-5 pb-20">{children}</div>
}
