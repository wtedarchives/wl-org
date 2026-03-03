import Link from "next/link"

import { Button } from "@/components/ui/button"

export function NotFoundContent() {
  return (
    <div className="flex h-full flex-col rounded-b-none bg-wl-dark-green md:rounded-b-xl">
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-6 text-center text-wl-white">
          <img
            src="/404.png"
            alt=""
            className="w-full max-w-md rounded-xl object-cover"
          />
          <h1 className="text-2xl font-bold sm:text-3xl">Did the wrung come loose?!</h1>
          <p className="max-w-md text-base text-wl-white/90">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          <Button asChild size="lg" className="mt-2">
            <Link href="/">Go to home</Link>
          </Button>
        </div>
      </main>
    </div>
  )
}
