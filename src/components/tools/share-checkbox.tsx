import { Checkbox } from "@/components/ui/checkbox"

export function ShareCheckbox({
  checked,
  onChange
}: {
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="text-muted-foreground flex cursor-pointer items-start gap-2 text-left text-xs">
      <Checkbox
        checked={checked}
        onCheckedChange={(v) => onChange(v === true)}
        className="mt-0.5"
      />
      <span>
        Share anonymised module codes, terms and grades to help improve NTUMods.
        Your name and matric number are never read or sent.
      </span>
    </label>
  )
}
