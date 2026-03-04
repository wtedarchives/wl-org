"use client"

import Image from "next/image"
import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldContent,
  FieldLabel,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { HomeStatsColumn } from "@/components/home-stats-column"

export function WlHome() {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [layoutMode, setLayoutMode] = useState<"mobile" | "desktop">("mobile")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFirstName("")
    setLastName("")
    setEmail("")
    setMessage("")
  }

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const threshold = 840 // Tailwind lg breakpoint in px, for container

    const updateLayout = () => {
      const width = el.clientWidth
      const nextMode: "mobile" | "desktop" =
        width >= threshold ? "desktop" : "mobile"

      setLayoutMode((prev) => {
        return nextMode
      })
    }

    updateLayout()

    const resizeObserver = new ResizeObserver(() => {
      updateLayout()
    })
    resizeObserver.observe(el)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  return (
    <div className="flex h-full flex-col rounded-b-none bg-wl-dark-green md:rounded-b-xl">
      <main className="flex-1">
        <div
          ref={containerRef}
          className="mx-auto max-w-7xl px-4 py-6 lg:px-6 lg:py-8"
        >
          <div className="mb-4 text-center text-wl-white">
            <h1 className="text-xl font-bold sm:text-2xl">
              Welcome to Wysteria Lane
            </h1>
          </div>
          <div
            className={`flex flex-col gap-6 ${
              layoutMode === "desktop" ? "flex-row items-start" : ""
            }`}
          >
            <div className="flex flex-1 flex-col gap-4">
              {layoutMode === "desktop" ? (
                <div className="mx-auto inline-block overflow-hidden rounded-3xl shadow-xl">
                  <Image
                    src="/goose-press-2025.jpg"
                    alt="Goose press photo with confetti"
                    width={1600}
                    height={900}
                    className="mx-auto h-auto max-h-[500px] w-auto max-w-full object-cover"
                    priority
                  />
                </div>
              ) : null}

              <p className="mx-auto max-w-3xl text-center text-sm font-normal leading-[1.125rem] text-wl-white">
                Wysteria Lane is the online home for the charitable arm of a fan
                site and streaming radio station for the band Goose. Currently
                organized as an LLC with a goal of achieving 501(c)3 non-profit
                certification from the IRS, Wysteria Lane manages and operates{" "}
                <a
                  href="https://www.wtedradio.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-wl-orange underline hover:text-wl-light-orange"
                >
                  WTED Goose Radio
                </a>{" "}
                and the{" "}
                <a
                  href="https://community.wysterialane.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-wl-orange underline hover:text-wl-light-orange"
                >
                  Wysteria Lane Community
                </a>
                , both of which are available free of charge. Please explore, and
                reach out if you have questions or want to know more.
              </p>

              <Separator className="my-2 bg-wl-orange" />

              {layoutMode === "mobile" ? <HomeStatsColumn /> : null}

              {layoutMode === "mobile" ? (
                <Separator className="my-2 bg-wl-orange" />
              ) : null}

              <form
                onSubmit={handleSubmit}
                className="mx-auto flex w-full max-w-2xl flex-col gap-6 rounded-xl bg-wl-dark-grey/90 px-4 py-6 text-wl-white shadow-xl @lg/main:px-6"
              >
                <h2 className="text-center text-xl font-bold">Contact Us</h2>

                <FieldSet>
                  <Field>
                    <FieldLabel>
                      <FieldTitle>
                        Name <span className="text-red-500">*</span>
                      </FieldTitle>
                    </FieldLabel>
                    <FieldContent>
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <Input
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="First"
                          required
                          className="h-9 bg-white text-sm text-black shadow-md placeholder:text-gray-500"
                        />
                        <Input
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Last"
                          required
                          className="h-9 bg-white text-sm text-black shadow-md placeholder:text-gray-500"
                        />
                      </div>
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel>
                      <FieldTitle>
                        Email <span className="text-red-500">*</span>
                      </FieldTitle>
                    </FieldLabel>
                    <FieldContent>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email"
                        required
                        className="h-9 bg-white text-sm text-black shadow-md placeholder:text-gray-500"
                      />
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel>
                      <FieldTitle>Comment or Message</FieldTitle>
                    </FieldLabel>
                    <FieldContent>
                      <Textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Comment or Message"
                        rows={6}
                        className="bg-white text-sm text-black shadow-md placeholder:text-gray-500"
                      />
                    </FieldContent>
                  </Field>
                </FieldSet>

                <div className="flex justify-center">
                  <Button
                    type="submit"
                    className="bg-wl-orange px-6 py-2 text-wl-black hover:bg-wl-light-orange"
                  >
                    Submit
                  </Button>
                </div>
              </form>
            </div>

            {layoutMode === "desktop" ? (
              <div className="w-full max-w-sm flex-none">
                <HomeStatsColumn />
              </div>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  )
}

