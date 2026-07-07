import { BagForm } from "./bag-form"

export const metadata = { title: "Add a bag" }

export default function NewBagPage() {
  return (
    <div className="pt-8 max-w-md mx-auto space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Add a bag</h1>
        <p className="text-sm text-muted-foreground">
          Copy the details straight off the label. New bags start as
          unverified — the community takes it from there.
        </p>
      </header>

      <BagForm />
    </div>
  )
}
