import Link from "next/link"

import { Separator } from "@/components/ui/separator"
import {
  GOOSE101_INTRO,
  GOOSE101_SECTIONS,
  type Goose101Section,
} from "@/app/(main)/old/goose101/content"

function SectionBlock({ section }: { section: Goose101Section }) {
  return (
    <div className="mb-4">
      {section.images?.length ? (
        <div className="float-right ml-4 mb-2 space-y-4">
          {section.images.map((img) => (
            <a
              key={img.src}
              href={img.href}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <img
                src={img.src}
                alt={img.alt}
                className="h-auto w-48 rounded-lg shadow-xl transition-transform duration-300 hover:scale-105"
              />
            </a>
          ))}
        </div>
      ) : null}
      <h2
        id={`section-${section.id}`}
        className="mb-2 text-lg font-bold leading-[1.25rem] text-wl-white"
      >
        {section.id}. {section.title}
      </h2>
      <div className="space-y-4 text-sm font-normal leading-[1.125rem] text-wl-white">
        {section.paragraphs.map((p, i) => (
          <p
            key={i}
            className={i === 1 && section.paragraphs.length > 1 ? "mb-2" : ""}
            dangerouslySetInnerHTML={{ __html: p }}
          />
        ))}
        {section.links?.length ? (
          <p className="mt-2">
            {section.links.map((l, i) => (
              <span key={l.href}>
                {i > 0 && <br />}
                <Link
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-wl-orange underline hover:text-wl-light-orange"
                >
                  {l.label}: {l.href}
                </Link>
              </span>
            ))}
          </p>
        ) : null}
        {section.youtubeIds?.length ? (
          <div className={section.youtubeIds.length > 1 ? "mt-4 space-y-4" : "mt-4"}>
            {section.youtubeIds.map((id) => (
              <iframe
                key={id}
                className="mx-auto aspect-video w-full max-w-2xl rounded-lg shadow-xl transition-transform duration-300 hover:scale-105"
                src={`https://www.youtube.com/embed/${id}`}
                title="YouTube video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            ))}
          </div>
        ) : null}
      </div>
      <div className="clear-both" />
    </div>
  )
}

export function Goose101Legacy() {
  return (
    <div className="flex h-full flex-col rounded-b-none bg-wl-dark-green md:rounded-b-xl">
      <main className="relative flex-1">
        <div className="relative mx-auto w-full max-w-7xl px-4 lg:px-6">
          <div className="min-w-0 flex-1 px-4 pb-8 pt-6 md:px-8">
            <h1 className="mb-6 text-center text-xl font-bold text-wl-white">
              Goose 101: An Introduction And Guide
            </h1>
            <div className="space-y-4 text-sm font-normal leading-[1.125rem] text-wl-white">
              {GOOSE101_INTRO.paragraphs.map((p, i) => (
                <p key={i} className={i === 2 ? "text-xs italic" : ""}>
                  {p}
                </p>
              ))}
            </div>

            {GOOSE101_SECTIONS.map((section) => (
              <div key={section.id} className="space-y-4 text-wl-white">
                <div className="clear-both scroll-mt-[var(--header-height,0px)]">
                  <Separator className="my-6 border-wl-orange" />
                </div>
                <SectionBlock section={section} />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
