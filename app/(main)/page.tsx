import { WlHome } from "@/components/wl-home"

export default function Page() {
  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-1 flex-col">
        <WlHome />
      </div>
    </div>
  )
}
