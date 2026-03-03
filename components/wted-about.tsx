"use client"

import Link from "next/link"

import { Separator } from "@/components/ui/separator"

export function WtedAbout() {
  return (
    <div className="flex h-full flex-col rounded-b-none bg-wl-dark-green md:rounded-b-xl">
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6 lg:py-8">
          <div className="text-center text-wl-white">
            <h1 className="text-xl font-bold">About Us and FAQ</h1>
            <p className="mt-2 text-sm text-wl-white/80">
              Last updated: November 25, 2025
            </p>
          </div>

          <div className="mt-6 space-y-6 text-left text-sm leading-[1.25rem] text-wl-white [&_a]:font-medium [&_a]:text-wl-orange [&_a]:underline [&_a]:hover:text-wl-light-orange">
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">
                What is WTED Goose Radio?
              </h2>
              <p>
                WTED Goose Radio is an Internet streaming radio station that
                celebrates the band Goose as well as Goose-related projects and
                forerunners like Vasudo, Great Blue, and Orebolo. It streams a
                mix of studio and live recordings from the band&apos;s various
                catalogs as well as commentary, special event simulcasts, and
                other programming. Though it is freely available to anyone on
                the Internet, the station is primarily targeted for users of the{" "}
                <a
                  href="https://community.wysterialane.org"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Wysteria Lane Community
                </a>
                . If you&apos;re not already a member, join us!
              </p>
            </section>

            <Separator className="my-4 bg-wl-orange" />

            <section className="space-y-3">
              <h2 className="text-lg font-semibold">
                Where does the music come from? Is the band compensated?
              </h2>
              <p>
                The team behind WTED is 100% sold on supporting the band and
                part of that is ensuring that they are compensated for their
                art. We support this effort in two ways: music purchases and
                streaming licensing. All songs and shows are purchased through
                Bandcamp or other means and WTED holds streaming licensing from
                SoundExchange and ASCAP to ensure that we operate ethically.
              </p>
            </section>

            <Separator className="my-4 bg-wl-orange" />

            <section className="space-y-3">
              <h2 className="text-lg font-semibold">
                How is all of this paid for?
              </h2>
              <p>
                WTED Goose Radio, the Wysteria Lane Community, and associated
                resources have traditionally been funded out of the pocket of
                the team that produces the station. We&apos;ve launched the
                ability to{" "}
                <Link
                  href="/wted/support"
                  className="font-medium text-wl-orange underline hover:text-wl-light-orange"
                >
                  support WTED
                </Link>{" "}
                with either a monthly recurring payment or a one-time gift if
                you choose to do so, and thank you to those that have! We use
                Stripe as a payment processor so that we never see or store any
                of your payment credentials or credit card information. If you
                have questions on how that works, please{" "}
                <a
                  href="mailto:wted@wtedradio.com"
                  className="font-medium text-wl-orange underline hover:text-wl-light-orange"
                >
                  reach out to us
                </a>
                .
              </p>
              <p>
                The goal of the team behind WTED and the Wysteria Lane
                Community is to have sufficient community support so that
                operating costs are covered every month. Any funds raised above
                and beyond the monthly costs will be donated on a quarterly
                basis to official charities in and around the Goose orbit such
                as{" "}
                <a
                  href="https://westernsunfoundation.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Western Sun Foundation
                </a>
                ,{" "}
                <a
                  href="https://groovesafe.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GrooveSafe
                </a>
                ,{" "}
                <a
                  href="https://consciousalliance.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Conscious Alliance
                </a>
                , and others. We&apos;ve made investments in mobile apps to
                make it easier to enjoy WTED on the go or wherever you are. As
                the station becomes financially sustainable, we plan to invest
                in additional capabilities and offerings (regular merch,
                anyone?) in addition to donating. We also have partnerships with
                community retailers like{" "}
                <a
                  href="https://www.teesthatjam.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  TeesThatJam.com
                </a>{" "}
                and{" "}
                <a
                  href="https://junglerooooom.com/search?q=wted&options%5Bprefix%5D=last"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Junglerooooom
                </a>{" "}
                that graciously provide part of their proceeds to WTED.
              </p>
              <p>
                In order to support those goals, we&apos;ve formed Wysteria
                Lane LLC as a way to enable basic business functions (like a
                bank account) as well as establishing a basic but transparent
                financial framework that includes a breakdown of our monthly
                costs, income, and donations (if any) supported by bank account
                statements. You can view these financial breakdowns in{" "}
                <a
                  href="https://docs.google.com/spreadsheets/d/1P_7PG3tl-axoFA136phWsdl14U9re5zrUeD-Knq2aU0/edit?usp=sharing"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  this spreadsheet
                </a>
                . This is the first step on a journey that will eventually see
                Wysteria Lane LLC reorganized in order to gain an IRS
                certification of 501(c)(3) non-profit status. It also means that
                any gifts received are currently not tax deductible.
                Transparency is a cornerstone of our partnership and it is
                important that contributors know what their gift is used for.
              </p>
              <p>
                The bottom line in all of that in real terms for listeners is
                that no one involved with the production, management, or
                leadership of WTED Goose Radio is paid or otherwise compensated
                for their time and effort; this is a labor of love, and of
                community.
              </p>
            </section>

            <Separator className="my-4 bg-wl-orange" />

            <section className="space-y-3">
              <h2 className="text-lg font-semibold">
                Can I become a GORP (Goose Obsessed Radio Personality)?
              </h2>
              <p>
                In a word...yes! We encourage and value community participation
                in producing original content to accompany the music. GORPs are
                special guests that contribute periodically to show hosting,
                commentary, bumpers, and other content. Join us at the{" "}
                <a
                  href="https://community.wysterialane.org"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Wysteria Lane Community
                </a>{" "}
                site and join in the conversation. There are threads, posts, and
                a live chat feature that you can use to join the fray and learn
                how to contribute.
              </p>
            </section>

            <Separator className="my-4 bg-wl-orange" />

            <section className="space-y-3">
              <h2 className="text-lg font-semibold">
                I have other questions; who can I contact?
              </h2>
              <p>
                For other questions, comments, concerns, or to give us delicious
                waffles, please reach out to us at{" "}
                <a href="mailto:wted@wtedradio.com">wted@wtedradio.com</a>.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}

