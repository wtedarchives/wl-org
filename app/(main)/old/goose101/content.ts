/**
 * Goose 101 section content (extracted for line-count and maintainability).
 * Paragraphs may contain HTML for links; render with dangerouslySetInnerHTML.
 */

export interface Goose101Image {
  src: string
  alt: string
  href: string
}

export interface Goose101Link {
  label: string
  href: string
}

export interface Goose101Section {
  id: number
  title: string
  paragraphs: string[]
  images?: Goose101Image[]
  youtubeIds?: string[]
  links?: Goose101Link[]
}

export const GOOSE101_INTRO = {
  paragraphs: [
    "We've all been there. You hear a band that resonates with your soul and hits you right in the gut. You clamor for more. But where to begin your journey? Goose did just that to myself during the pandemic-stricken year of 2020, and what else was I to do other than soak in as much knowledge as possible on the up-and-coming indie groove jam band from Connecticut. Since then, their arrow has continued to point in one direction, straight up, and new fans are entering the fold daily, with an emboldened fervor to do just what I did during lockdown; seep up all the light. Often times, as is typical with a band known for its propensity in the live setting, diving into the deep end can seem overwhelming. And that is where this list comes in.",
    "For those that are experiencing this for the first time, allow me to offer up various important pieces in the catalog that will help to fully immerse yourself into the fanbase and enhance your Goose experience. These offerings are both widely-released (across all streaming platforms) and harder to find material that range from live shows to studio efforts; all in the name of broadening your knowledge of the band that we have all found solace in for these few short years. Listed here in chronological order, there is no one-way street to determine the best course of action to work through the list. Choose your own adventure, and familiarize yourself with the importance of each. As always, stay Ted.",
    '(note: entries marked with an *asterisk are available across all streaming platforms. Concert listings that are not notated with an asterisk can be found, and heard, on the band\'s Bandcamp page. All entries are hyperlinked to the Bandcamp page for each release, respectively, where you can listen to each selection for free a few times over before hitting a paywall)',
  ],
}

export const GOOSE101_SECTIONS: Goose101Section[] = [
  {
    id: 1,
    title: "Moon Cabin",
    images: [{ src: "https://f4.bcbits.com/img/a2223100564_16.jpg", alt: "Moon Cabin Album Cover", href: "https://goosetheband.bandcamp.com/album/moon-cabin" }],
    paragraphs: [
      "Released on February 17, 2016, \"Moon Cabin\" was the first studio effort and introductory project for the band. This selection is key to understanding some of the older tracks and their history within the band's catalog, as all tracks are still in solid rotation in live setlists, and also allows us the opportunity to see how much the band has evolved since this album's release, mostly due to the personnel involved. Featuring Rick Mitarotonda on guitar, Trevor Weeks on bass, and Ben Atkind on drums, this album also includes former members Chris 'Doc' Enright on keys and backing vocals, as well as Peter Castaldi on rhythm guitar. We are also introduced to Goose cohorts Will Thresher (graphics and art) and Kenny Cash (mastering engineer and co-producer, Factory Underground) with this release.",
    ],
    youtubeIds: ["kasHUqpNWg8"],
  },
  {
    id: 2,
    title: "6/2/2018 Covington, KY",
    images: [{ src: "https://f4.bcbits.com/img/a0928804158_16.jpg", alt: "6/2/2018 Covington, KY Album Cover", href: "https://goosetheband.bandcamp.com/album/2018-06-02-covington-ky" }],
    paragraphs: [
      "\"Never miss a Covington show.\" A turn of phrase early fans may have heard multiple times over in their early touring years. Why? In February of 2018, the band played one-off dates 2 weeks apart from each other at The Octave, where they noticed their first true following (outside of their home turf in New England) begin to form. An exuberant handful of fans had grown familiar with the band's songs, singing along all the while, which led the band to booking its first ever 2-night run at a single venue. June 1-2, 2018. At this show, on Night 2, the band plays 2 songs in particular, each for the 2nd time in the band's history (this is the earliest known recording of each), which would go on to become the most sought after 'bust-outs' in their catalog. They have each only been played 10 times*, and only one other instance in the same setlist (see 8/22/21). These are Factory Fiction and Elmeg the Wise. From here on, the area spanning Louisville, KY to Cincinnati, OH has been considered a de facto 'home base' as a symbol of the original growth movement for the band.",
    ],
    youtubeIds: ["IWn6T8FQbjg"],
  },
  {
    id: 3,
    title: "7/27/2019 Peach Fest",
    images: [{ src: "https://f4.bcbits.com/img/a2948440918_16.jpg", alt: "7/27/2019 Peach Fest Album Cover", href: "https://goosetheband.bandcamp.com/album/2019-07-27-the-peach-music-festival-scranton-pa" }],
    paragraphs: [
      "As in any jam band's canon, early-career festival sets are not only imperative to fill a summer tour calendar, but more so a necessity to gain notoriety within the live music scene. Let's talk about Peach Fest 2019, where Goose (now a 4-piece band featuring Peter Anspach) would put together a set that would forever be known as their jumping off point amongst fans of the jam community. Covering the Grateful Dead's Mississippi Half-Step, and following it up with their hallmark Arcadia, the energy still portrayed by a rolling chair-bound Rick Mitarotonda blew away the afternoon crowd and unofficially put the band on the map. This was the first major shift in the band's presence within the ranks of the live music scene.",
    ],
    youtubeIds: ["hVfDTXbG-po"],
  },
  {
    id: 4,
    title: "Alive and Well*",
    images: [{ src: "https://f4.bcbits.com/img/a3148124516_16.jpg", alt: "Alive and Well Album Cover", href: "https://goosetheband.bandcamp.com/album/alive-and-well" }],
    paragraphs: [
      "Naturally, the band opted to try and capitalize on the momentum it had earned during the summer touring season, namely Peach Fest, and began to put together a compilation live album (that eventually released on April 10, 2020). Though the album was released in 2020 via Bandcamp and even garnered the vinyl treatment (the band's first), much of the recorded tracks were from live shows spanning Peach Fest (Arcadia) through the band's first notable month of live transformation, Fall 2019. Just as it is with any live band, there are specific time periods… seasons… months… that we can focus in on as saying \"the band was on fire during (fill in the blank here)\" time frame. This was that first big-time season of the band, which leads me to…",
    ],
  },
  {
    id: 5,
    title: "11/16/2019 Nietzsche's – Buffalo, NY*",
    images: [{ src: "https://f4.bcbits.com/img/a0497858179_16.jpg", alt: "11/16/2019 Nietzsche's Buffalo, NY Album Cover", href: "https://goosetheband.bandcamp.com/album/2019-11-16-nietzsches-buffalo-ny" }],
    paragraphs: [
      "In the middle of their Fall 2019 run, they played this show at Nietzsche's in Buffalo, New York. The band kept the arrow pointing up as this was the first official full-concert release on January 8, 2020, prior to the Alive and Well compilation release (which featured mostly recordings from earlier shows). Later in 2021, the band would re-master the sound, trim some of the track listing, and create a vinyl release from this show. At the time, and maybe still today, this is/was the preeminent version of Arcadia ever recorded. The show resembles this Fall 2019 run perfectly. Other Fall 2019 shows to check out are: 10/19 Cambridge, 10/25 Wilkes-Barre, and 11/10 Richmond.",
    ],
    youtubeIds: ["ZjfBeKfZlRg"],
  },
  {
    id: 6,
    title: "12/11/2019 The Bootleg – St. Louis, MO",
    images: [{ src: "https://f4.bcbits.com/img/a3179059967_16.jpg", alt: "12/11/2019 The Bootleg St. Louis, MO Album Cover", href: "https://goosetheband.bandcamp.com/album/2019-12-11-the-bootleg-st-louis-mo" }],
    paragraphs: [
      "Just as Fall 2019 is good throughout (although there are only a smattering of dates), December 2019 might be considered the band's first fully-realized month of touring. They kept raising the bar from the October/November shows and eventually hit a stride with 9 December dates that led them through Colorado and the Midwest before landing back home for Goosemas 2019. There are no bad shows in December 2019, but if you were to start with one, it would be the 12/11 show at the Bootleg. Most of these shows don't play like what the band is currently doing (as I write this in 2022). There's a little more leeway and covers to go around. But the energy and flow of this show in particular is one that I constantly find myself going back to. Other December 2019 shows to check out are: 12/6 Denver, 12/13 Covington (yep, back to Covington), and 12/14 Indianapolis.",
    ],
  },
  {
    id: 7,
    title: "Bingo Tour (Official Release)*",
    images: [{ src: "https://f4.bcbits.com/img/a0080650971_16.jpg", alt: "Bingo Tour Album Cover", href: "https://goosetheband.bandcamp.com/album/bingo-tour" }],
    paragraphs: [
      "One of the more remarkable accomplishments by this band was how it maneuvered around the pandemic year of 2020 and still managed to gain notoriety without really being able to put together a solid touring schedule. Enter Bingo Tour. With the band's meteoric rise and the way they were playing at the end of 2019, they were poised to bust 2020 wide open and reach heights unimagined. Then COVID-19 put a pause on any progress and successes to be had. So, in June of 2020, the band \"embarked\" on a virtual Bingo Tour: a 4-night event (with a 5th unplugged recording in a sheep pasture) in which they livestreamed shows from a 'secret' indoor location in their hometown of Norwalk, CT, during which their catalog was penned on bingo balls and pulled from a hopper in order to curate the setlists of each show, while also prompting such interstitials as \"20+ Minute Jam,\" \"no drums,\" or \"take a lap.\" In addition, fans played along at home on digital bingo cards, adding another interactive element to the shows. From these 4 shows came this compilation companion release titled Bingo Tour, which is available on all streaming platforms, although I highly recommend seeking out all 4 nights' individual shows on Bandcamp or Nugs to get the whole picture.",
      "Another important step in the band's looming explosion was show live-streams. While the first live-streamed show was from T's house on 3/15/2020 a few months prior, Bingo Tour was the first fully produced effort with the cast and crew that largely remains the same currently as the band continues to simulcast much of their concerts through various music streaming outlets. This also marks the introduction of the 5th member of the band, auxiliary drummer and multi-instrumentalist Jeff Arevalo. Bingo Tour was the first major accomplishment by the band that gained notoriety with write-ups in online publications like JamBase and L4LM.",
    ],
    youtubeIds: ["WDwKCVT4rQg"],
    links: [
      { label: "N1", href: "https://goosetheband.bandcamp.com/album/2020-06-19-goose-community-rec-center" },
      { label: "N2", href: "https://goosetheband.bandcamp.com/album/2020-06-20-goose-community-rec-center" },
      { label: "N3", href: "https://goosetheband.bandcamp.com/album/2020-06-26-goose-community-rec-center" },
      { label: "N4", href: "https://goosetheband.bandcamp.com/album/2020-06-27-goose-community-rec-center" },
      { label: "Sheep Set", href: "https://goosetheband.bandcamp.com/album/2020-06-28-sheep-set" },
    ],
  },
  {
    id: 8,
    title: "10/3/2020 Swanzey, NH*",
    images: [{ src: "https://f4.bcbits.com/img/a2338732178_16.jpg", alt: "10/3/2020 Swanzey, NH Album Cover", href: "https://goosetheband.bandcamp.com/album/20201003-swanzey-nh" }],
    paragraphs: [
      "As the reality of the immediate post-Covid world set in, and coming off of Bingo Tour's success with a virtual concert series, the band was in a position again where, while momentum was holding firm, they were forced to think outside the box. Introducing, the drive-in concert model. In the fall of 2020, the band embarked on a tour leading them through the northeast to hit as many drive-in set-ups as they could. Car radios were the source of the audience's sound, the windshield their own personal Goose Viewmaster. The shows that came from these 2020 dates were all ripe for the ever-growing base's fanaticism. Just as the band had done in previous years, all were released on Bandcamp shortly following the concerts' dates, save for 10/3 in Swanzey, NH (\"Schwazey\"). This show represented the middle date of the September-November drive-in tour, and was held for official release by the band (released March 5, 2021). A perfect representation of this 2020 post-Covid tour leg that brought the music back to the reeling fans, even if only a few, in 2020. All of these shows are worth checking out in my opinion, but start here.",
    ],
    youtubeIds: ["GnG0c08jTYA"],
  },
  {
    id: 9,
    title: "Night Lights (EP)*",
    images: [{ src: "https://f4.bcbits.com/img/a1944816514_16.jpg", alt: "Night Lights EP Album Cover", href: "https://goosetheband.bandcamp.com/album/night-lights" }],
    paragraphs: [
      "Forever flying under the radar of most of the band's catalog, you will find this nice little EP of studio cuts released in secret at midnight on the morning of Friday, October 30, 2020. In my opinion, each of the band's studio offerings is of elemental importance when a new fan becomes familiar with the band's catalog. But if you dig into this one, the song selection helps give us a history lesson. Each song on this EP, save for Yeti, was released as a single months prior to the EP's release, but each song was selected to be recorded by Goose for good cause. That is because four of these songs were originally written/played under bands NOT named Goose. Wysteria Lane and Butter Rum were songs first performed by the band Vasudo, which pre-dates Goose and features drummer Ben Atkind, guitarist Rick Mitarotonda, and bassist Trevor Weeks. This band's singer, keyboard player, and co-writer is Matt Campbell, and in 2021 the band came together, this time with the inclusion of Goose keyboardist Peter Anspach along with Jeff Arevalo replacing Ben on drums, to record and release a reggae album called \"Call It Louis\" (highly recommend). Speaking of Anspach, before coming on with Goose in 2017 (after the original incarnation's release of \"Moon Cabin\"), Anspach fronted a band named Great Blue, where he wrote Yeti and Time To Flee. Great Blue still performs with Peter at various stops along Goose tour or during off-tour seasons from time to time. All I Need, recorded for the EP in its speedier rendition, is a Goose original. Other Vasudo originals, now played by Goose, are Echo of a Rose, Factory Fiction, Flodown, Hot Tea, Rockdale, The Empress of Organos, Tumble, and Turbulence and the Night Rays. Other Great Blue songs now performed by Goose are Butterflies, Doc Brown, Jeff Engborg, Lily's Tiger, and Pancakes. This list is subject to additional songs from either band being brought back to life by Goose at any moment's notice.",
    ],
    youtubeIds: ["NSIqjAeqkgk"],
  },
  {
    id: 10,
    title: "Goosemas VII 12/11/2020",
    images: [{ src: "https://f4.bcbits.com/img/a4040117971_16.jpg", alt: "Goosemas VII 12/11/2020 Album Cover", href: "https://goosetheband.bandcamp.com/album/2020-12-11-goosemas-rockefeller-center-new-york-ny" }],
    paragraphs: [
      "Still dealing with a society in a pandemic-stricken lockdown, the band looked to pull off a version of their annual holiday celebration that has been a time-honored tradition dating back to the band's roots. In 2020, with the help of promoter and Relix publisher Peter Shapiro, they would be able to continue that streak with Goosemas VII (i.e., the 7th iteration of said yearly event), this time from the rooftop of Manhattan's Rockefeller Center. Donations from stream purchases reached upward of $45,000 towards two charities: NIVA's Save Our Stages supporting independent live venues in the pandemic, and a familiar music artist-nonprofit pairing Conscious Alliance, as some 60,000 viewers watched the Bryan Murphy-led production team's live stream from home and on mobile devices. The entire crew left their mark on the evening from seven stories up: Andrew Goedde on lights, sister Marta Goedde and Danny McDonald working the camera rigs, and Sam Bardani running sound along with Coach's (Jon Lombardi) presence made known throughout. You can even hear some of the hustle and bustle of the street traffic below in some of the audio captured from this show. The show featured the return of Elmeg The Wise, with its first time being played since the show previously mentioned at The Octave, 6/2/2018 in Covington. It was likely the most ambitious act to date from the band, and helped keep the lore and spirit of Goosemas alive and well even in the midst of the odd year that was 2020.",
    ],
    youtubeIds: ["XVuPWvbXeXA"],
  },
  {
    id: 11,
    title: "Ted Tapes 2021*",
    images: [{ src: "https://f4.bcbits.com/img/a4149988969_16.jpg", alt: "Ted Tapes 2021 Album Cover", href: "https://goosetheband.bandcamp.com/album/ted-tapes-2021" }],
    paragraphs: [
      "In early February 2021, the band released something that most seasoned fans were somewhat familiar with, but not to the extent and prowess of the tapes released here in 2021. What are Ted Tapes? Good question. If you frequent the band's live streams and are paying attention to the pre-show interludes and instrumental offerings during set break, then you've heard them. These are instrumental tracks, either recorded in rehearsals or even developed out of soundcheck jams, that eventually make their way to the public in this format, or on a Ted Tapes release. Various other forms of Ted Tapes had existed in smaller samplings up to this point, and are available on Bandcamp. What they represent is more of the band's deeper rooted creativity. Expanding boundaries. Exploring musical space. This sort of thing. The tracks that came together for \"Ted Tapes 2021\" appeased this appetite from the fans so much so that a few tracks are played at live shows (see Moby and Dragonfly), and the release is held sacred by those lucky fans that were keen enough to order the vinyl copy of this release. Aside from the Ted Tapes namesake, you will also find the band and its fans using the term 'Ted' as an adjective to describe their headier jams, almost as an inside joke. So… with that in mind… stay \"Ted\" out there…",
    ],
    youtubeIds: ["ScT9FXmTDOk"],
  },
  {
    id: 12,
    title: "Shenanigans Nite Club*",
    images: [{ src: "https://f4.bcbits.com/img/a1517447168_16.jpg", alt: "Shenanigans Nite Club Album Cover", href: "https://goosetheband.bandcamp.com/album/shenanigans-nite-club" }],
    paragraphs: [
      "On June 4, 2021, the band released what many would consider the band's 'first' official studio LP, \"Shenanigans Nite Club.\" This was the band's inaugural effort with the full 5-piece personnel that we know as 'Goose' today: Rick, Peter, Ben, Trevor, and Jeff under new management from 11e1even Group. Featuring original singles So Ready and Spirit of a Dark Horse, along with live stalwarts Madhuvan and Flodown, interluding jam tracks followed most songs that gave the album a jam-friendly vibe while allowing the band to craft their new and improved studio sound, namely the (dawn) track that follows SOS. These tracks would lay the groundwork for the band's reinvigoration towards working in the studio and even called for a movie release by the same name to accompany the title. From record to film, all projects associated with Shenanigans were largely self-produced, written, and mastered by familiar members of the crew and the band itself. With Kenny Cash again assisting in the recording process, the movie was written and directed by longtime friend of the band Will Thresher. It was an enterprising effort all-around.",
    ],
    youtubeIds: ["2gypxvKKZEw"],
  },
  {
    id: 13,
    title: "8/21-22/2021 Fred the Festival",
    images: [
      { src: "https://f4.bcbits.com/img/a2842840463_16.jpg", alt: "8/21/2021 Fred the Festival Album Cover", href: "https://goosetheband.bandcamp.com/album/2021-08-21-fred-the-festival-arrington-va" },
      { src: "https://f4.bcbits.com/img/a3457088491_16.jpg", alt: "8/22/2021 Fred the Festival Album Cover", href: "https://goosetheband.bandcamp.com/album/2021-08-22-fred-the-festival-arrington-va" },
    ],
    paragraphs: [
      "It's hard to look back at the summer of 2021 and pick just one show out of MANY that may be viewed as required listening. Therefore, I'm deciding to list Fred The Festival as the high-water mark of the tour, for a few reasons, which I will explain here while also listing some honorable mention summer stops that must garner an eventual listen by any new fan of the band. In August 2021, summer tour culminated in a 2-day festival at Lock'n Farm in Arrington, Virginia that was again put in place by Peter Shapiro as a means of filling the void in the Lock'n Farm summer line-up in a post-Covid tour season. The solution was for Lock'n to host a variety of smaller festivals hosted and curated by individual bands themselves, Goose being one of the bands to earn such an honor. This led to Fred The Festival. Featuring acts like Dr. Dog, Grateful Shred, Cory Wong, Dawes, and Hiss Golden Messenger, the bill also called on band members' side acts Vasudo (featuring Matt Campbell with Rick, Trevor, Peter, and Jeff), Orebolo (aka a-Goose-tic Trio, acoustic renditions of the catalog played by Jeff on standup bass with Rick and Peter), and ElephantProof (Ben's funk-fusion band featuring original Goose member Chris 'Doc' Enright). Peter also provided a morning solo acoustic set. Festival-goers were asked to participate in all sorts of summer-camp style games and activities, separated into teams represented by each member of the band and crew: Team Don (Peter), Team Ted (Rick and Coach), Team Fred (Ben and Jeff), and Team Larry (Trevor). Both nights featured guests from a number of bands involved, which included a Night 1 appearance from Taylor and Griffin Goldsmith from Dawes on This Old Sea and Don't Do It, and Night 2 appearances from Chris Enright on So Ready, along with Matt Campbell sitting in for a raucous Factory Fiction. Night 2 closed with an encore set of Travelers>Elmeg The Wise, making this only the 2nd show ever to see both Factory Fiction and Elmeg The Wise (6/2/18 being the other show). Overall, it was a very successful weekend that capped off an incredible summer tour and set up a short festival run before the 2021 Fall Tour kicked off. The only knock on this festival was that live streaming was not available. However, the band released a weekend-encapsulating film to mark the festival's success. Other summer 2021 shows to check out are: 5/4/21 Frederick, 5/28/21 Westville N2, 6/18-19/21 Legend Valley, and 7/9-10/21 Sculpture Park.",
    ],
    youtubeIds: ["nkhuV5BogNc"],
    links: [
      { label: "N1", href: "https://goosetheband.bandcamp.com/album/2021-08-21-fred-the-festival-arrington-va" },
      { label: "N2", href: "https://goosetheband.bandcamp.com/album/2021-08-22-fred-the-festival-arrington-va" },
    ],
  },
  {
    id: 14,
    title: "11/21/2021 Mission Ballroom",
    images: [{ src: "https://f4.bcbits.com/img/a4046687685_16.jpg", alt: "11/21/2021 Mission Ballroom Album Cover", href: "https://goosetheband.bandcamp.com/album/20211121-denver-co" }],
    paragraphs: [
      "In Fall 2021, the band made another extensive tour to areas of the country that were both familiar and unfamiliar. It was their first true run through the southeast that led them up through Texas and into Colorado to close out the tour here in Denver at the Mission Ballroom for 2 nights. The band opted for Night 1 to get the wide-release treatment, again for good cause. Not only because of the sweltering setlist, which included newer songs like The Old Man's Boat and the Vasudo original Rockdale, but also as a nod to the state of Colorado, which long maintained a special place in the band's heart. Prior to Goose's success, Rick's journey led him west, leaving his musical education and hometown in the northeast behind for a fresh perspective, landing him in Colorado. It was here that Rick became familiar with the Hare Krishna, which would influence the writing of Indian River and Madhuvan. Later, when the band began to gain its footing after his return to New England, they would circle Colorado as a second touring home, as we observe with the emphatic December 2019 run through the state, all the way through summer 2021 with back-to-back sold-out nights in July at Denver's Sculpture Park where the crowd included non-ticketed audience members trying to get a glimpse of the band from the adjacent parking garage. This leads us to the finale of fall tour here at Mission Ballroom, which now resembles a mid-way point in Colorado's placement in Goose lore. In 2022, the band culminated Dripfield's summer dates with two nights in Dillon before their Red Rocks debut, where the band would announce its first ever Goosemas event away from home as a 2-night event at Broomfield's 1st Bank Center. Thus, Colorado has solidified itself as a bucket-list destination for all Goose fans for years to come.",
    ],
    youtubeIds: ["bk87V4NbzQI"],
  },
  {
    id: 15,
    title: "Goosemas VIII 2/26/2022",
    images: [{ src: "https://f4.bcbits.com/img/a2171931402_16.jpg", alt: "Goosemas VIII 2/26/2022 Album Cover", href: "https://goosetheband.bandcamp.com/album/2022-02-26-goosemas-mohegan-sun-arena-uncasville-ct" }],
    paragraphs: [
      "Originally slated for December 18, 2021, Goosemas VIII proved to be one of the more disappointing delays for the band and its base as, once again, COVID-19 reared its ugly head. A member of the crew tested positive just days prior, forcing the band and management to make the decision to postpone the event to February 2022 in order to fit it into the venue's calendar. Fast forward to February 2022 at Mohegan Sun Arena, the band's first arena concert, where fans were treated to not 2, but 3 full sets. Acting as a stop-gap between winter 2022 tour legs, the band was already churning through 2022 with a renewed fervor. New songs were being added to the catalog at almost every significant stop on tour on a train bound for Goosemas. The forthcoming album \"Dripfield\" was waiting in the wings for its June release; new material was suddenly not a gripe from the band's older fans. At Goosemas, much of these newer, non-\"Dripfield\" songs were played in the opening sets, including Atlas Dogs, Silver Rising, Red Bird, and even the FTP version of the studio recorded Nina Simone cover Sinnerman. This led to the final set, where the band gifted its adoring audience with the first-time-played versions of \"Dripfield\" tracks Hungersite and Dripfield, following the already road-tested lead single from the album Borne. The first 3 tracks from the new album, in album order, followed by their opus, Arcadia. The band went on to tour these new tunes through the March leg of winter tour, giving us many shows to reference for excellent new material to set up the rest of the touring year. Some of these shows include: 1/30/22 San Francisco, 2/7/22 Bozeman, 3/10/22 Cleveland, and winter tour closer 3/12/22 Philadelphia, among others.",
    ],
    youtubeIds: ["6aTgpTmbhNo"],
  },
  {
    id: 16,
    title: "3/12/2022 Philadelphia, PA*",
    images: [{ src: "https://i.scdn.co/image/ab67616d0000b273253b1c5565c307631a2c15a4", alt: "3/12/2022 Philadelphia, PA Album Cover", href: "https://open.spotify.com/album/56W0z84fx0AD87mq4LyFjb" }],
    paragraphs: [
      "Flying high from the energy of Goosemas and armed with the new 'Dripfield suite' of songs that had debuted at the re-scheduled date, the band made short work of their early March run through the remainder of what was still deemed 'Winter Tour 2022.' Making their way through 7 cities in just 12 days (with many 2-nighters mixed in) the band was operating in a space that can only now be seen as the next truly great month in their short history, similar to those previously mentioned in this list, if only with just 10 shows in this span. EVERY show on this epic 12-day run is worth a listen, but it all culminated in Philadelphia for the tour's closing 2-night stand, just a few weeks after Goosemas, before stopping down for over a month before journeying out onto the Dripfield Tour. In Philly the band gave the fans a show equivalent only to a grand finale to the fireworks that preceded in that month; complete with a whopping 5 tunes that tracked at over 20:00 in length, including classics like All I Need and the much sought after Factory Fiction, along with new additions Red Bird and Hungersite. Because of the seismic weight of this show in the band's explosive 2022, it was rewarded by the band with an official release on all streaming platforms on September 28th, 2022 as a primer for the fall's continuation of the Dripfield Tour through the south. Start here in the catalog of March shows before working your way through these few (list to follow) and on through the rest of the offerings from March 2022: 3/1 Washington DC, 3/5 Nashville N2, 3/10 Cleveland.",
    ],
    youtubeIds: ["2FUDirVzZ50"],
  },
  {
    id: 17,
    title: "Dripfield*",
    images: [{ src: "https://f4.bcbits.com/img/a0238290447_16.jpg", alt: "Dripfield Album Cover", href: "https://goosetheband.bandcamp.com/album/dripfield-2" }],
    paragraphs: [
      "Heading into June 2022, the momentum and energy surrounding the band could not have been higher. The band's first appearance at Radio City Music Hall was on the books for later in the month to accompany the June 24th release of what is largely seen as their sophomore studio album, \"Dripfield,\" the band's most ambitious studio effort to date. Unlike \"Shenanigans Nite Club,\" this album was not a band-centric project, as they opted to give the production nod to D. James Goodwin. Recorded and mixed at Goodwin's Isokon studio in Woodstock, New York, the band prioritized the need to differentiate themselves from other jam bands and record old and new material as the indie-groove band they self-describe themselves to be. The resulting \"Dripfield\" appealed to both veteran and unseasoned fans alike, while bringing newer ears into the fold with the latest singles Borne, Hungersite, and Dripfield. Featuring horn sections, alternate instrumentation, and fresh takes on older tested material like Arrow and The Whales, the album was a success and renewed the band's thirst to provide a fresh perspective from the studio.",
    ],
    youtubeIds: ["_bl-Izuc68g"],
  },
  {
    id: 18,
    title: "6/24-25/2022 Radio City Music Hall*",
    images: [{ src: "https://f4.bcbits.com/img/a2627276996_16.jpg", alt: "6/24-25/2022 Radio City Music Hall Album Cover", href: "https://goosetheband.bandcamp.com/album/live-at-radio-city-music-hall" }],
    paragraphs: [
      "On Friday, June 24th, on the day \"Dripfield\" was released, the band opened its first of a two-night run on their inaugural visit to Radio City Music Hall in New York City. To this point, it was the band's most anticipated day in its young history. Each show was to take advantage of the late curfew opportunity by featuring 3 sets of music (the first of which would be played in an acoustic setting for each night). On Night 1, the band played a de facto album release show, featuring the accompanying horn section on tracks Hot Tea and Arrow played as they were recorded for \"Dripfield,\" along with special guest, producer D. James Goodwin. The band would play material from all across their expanded catalog. The night was a resounding success. Rumblings of yet another special guest carried overnight and into the next day at various band-sanctioned autograph and merchandising events amongst the fan base, and photos even surfaced online of said guest's personal equipment being wheeled into the venue. As Night 2 unfolded, anticipation was at an all-time high. Set 3 kicked off with Rick's new original Silver Rising before Peter stopped things down to announce Phish's Trey Anastasio to the stage. To this point, it had been well documented amongst the convergent Phish and Goose fan base that Trey was a fan of the band, amidst further conjecture of his taking great interest in the band. Trey accompanied the band for the rehearsed \"Dripfield\" single Hungersite, and sang the opening verse to the band's trademark Arcadia to follow. He would maintain his post for the closing run of the set, through Dripfield and The Empress of Organos before the encore closer that also included the night's previous guest, Father John Misty, on vocals for The Beatles' Tomorrow Never Knows. This is likely to remain the most significant moment in the band's history for years to come. The band would later collectively announce a run of shows in November 2022 alongside the Trey Anastasio Band.",
      "On Friday, June 9, 2023, the band released a Limited Edition Vinyl Box Set of this 2-night stand of 2,500 copies, along with a re-mastered wide-release on all streaming platforms. This will maintain its place in Goose history as one of the more iconic moments of the band's career.",
    ],
    youtubeIds: ["nHR_guYzB20"],
    links: [
      { label: "N1", href: "https://goosetheband.bandcamp.com/album/2022-06-24-radio-city-music-hall-new-york-ny" },
      { label: "N2", href: "https://goosetheband.bandcamp.com/album/2022-06-25-radio-city-music-hall-new-york-ny" },
    ],
  },
  {
    id: 19,
    title: "Orebolo – Volume 1",
    images: [{ src: "https://i.scdn.co/image/ab67616d0000b273d530c9747c16001c38a936bf", alt: "Orebolo – Volume 1 Album Cover", href: "https://open.spotify.com/album/5beENvy5EI5VUuajIKr9LA" }],
    paragraphs: [
      "Formerly known under the less official moniker 'aGoosetic Trio,' Orebolo first made their appearance at 2021's Fred Fest as an acoustic iteration of the band that was on the bill for an afternoon set on the last day of the festival. Now booking separate dates throughout the year when the full band is off tour, Rick, Peter, and Jeff set out to create a following of their own, a path cut and supported mostly by Goose loyalists that might be fortunate enough to see certain show dates pop up in their area. Playing only 6 shows total in 2022, the band put together a compilation set that would warrant vinyl treatment to go along with a wide streaming platform release. With selection taken from these mid-year shows, along with a few December 2021 shows, this release encompasses the intimacy of these shows, and the unique acoustic take on Goose tunes, as well as numbers from the more traditional musical lexicon, as Rick and Peter pair their acoustic guitars with Jeff's standup double-bass. All said Orebolo shows are available on Bandcamp and Nugs, and have even been featured as video streaming artists to Nugs subscribers as the collective Goose, and now Orebolo, continue to make their mark on the live music scene.",
    ],
    youtubeIds: ["Om_7XRC0nmQ"],
  },
  {
    id: 20,
    title: "11/17/2022 Fairfax, VA",
    images: [{ src: "https://f4.bcbits.com/img/a4246920250_16.jpg", alt: "11/17/2022 Fairfax, VA Album Cover", href: "https://goosetheband.bandcamp.com/album/2022-11-17-eagle-bank-arena-fairfax-va" }],
    paragraphs: [
      "Far be it from \"Dripfield\" to get the 'special guest' treatment during the album's coming out party, as referenced above, than to have another situation evolve less than 5 months later. Fast forward to November 2022. The Fall Dripfield tour had come and gone, and the highly anticipated 8-date tour accompanying the Trey Anastasio Band (no doubt bred from the relationship garnered back at Radio City) was in full swing on this 6th show in Fairfax, Virginia. With a sweltering opening Arrow before leading into the often overlooked Seekers suite, they gave us only the 2nd ever version of yet another new song titled Thatch, which had been written and developed on this very 'TABoose' tour. The band finished their 90-minute set strong with yet another landmark performance of Arcadia before calling on Trey to make his now customary guest appearance for Hungersite and Tumble. Setlist and performances aside (as arguably the best show of the tour to date), this night would wind up having marked ramifications in the jam music world, as later in the night during TAB's performance, Trey called upon bluegrass guitar wizard Billy Strings to provide support, which led to a Carini (Phish) encore that had the Eagle Bank Arena stage chock full of inherent badassery with both full bands and Billy Strings playing the crowd out the door. It is this night that we see our first ever new-age triumvirate taking stage with Trey, Rick, and Billy all donning their electric jam machines to give the live music fanbase a night it would not soon forget. However, only minutes after this grandest of finales, the band leveraged the momentum to release our next item on this list…",
    ],
  },
  {
    id: 21,
    title: "Undecided (EP)*",
    images: [{ src: "https://f4.bcbits.com/img/a3138437016_16.jpg", alt: "Undecided EP Album Cover", href: "https://goosetheband.bandcamp.com/album/undecided" }],
    paragraphs: [
      "As midnight struck on the night that the band shared the stage with the Trey Anastasio Band and Billy Strings, the band was quick to release a new EP that had only been whispered about amongst some of the fanbase. The unannounced release would be titled \"Undecided\" and consist of 4 very familiar tracks. All I Need, while previously released in a much speedier version on the \"Night Lights\" EP, is first out of the gate here. The Peter Anspach original Elizabeth follows before the now recognizable slower arrangement of Tumble takes center stage. Lastly, Undecided, which we've come to know as Bob Don over the years, finishes things off in what is a very obvious extension of the \"Dripfield\" studio sessions. With little known about the story behind these studio cuts, what we do know is that the 3 tracks written by Rick were done so very early on in his songwriting career, as a teenager. All 4 tracks have producer D. James Goodwin's fingerprints all over them, as it is now safe to say that his influence during the band's time in his Isokon studio was so meaningful to the band's development that they continued to record these vaunted road-tested tracks, under Goodwin's treatment, after much of the \"Dripfield\" album had been laid down and recorded.",
    ],
    youtubeIds: ["dN1Xy1xYvjA"],
  },
  {
    id: 22,
    title: "12/16/2022 Broomfield, CO and 12/31/22 Cincinnati, OH*",
    images: [
      { src: "https://i.scdn.co/image/ab67616d0000b273cfb015078b4c348084e4e7a0", alt: "12/16/2022 Broomfield, CO Album Cover", href: "https://open.spotify.com/album/1w84PLyaJmP3k0MYb8XAe8" },
      { src: "https://i.scdn.co/image/ab67616d0000b273ebeb78d2eca27bcbb27f3fdc", alt: "12/31/22 Cincinnati, OH Album Cover", href: "https://open.spotify.com/album/5OFrEUUfSOFsk1mIgyQXD5" },
    ],
    paragraphs: [
      "After the fall tour alongside the Trey Anastasio Band, the band set forth for a handful of shows in December to close out the momentous calendar year of 2022. The fan base was granted 4 more full band shows in the forms of the traditional Goosemas celebration, now a two-night affair and the first outside of their New England home as they played the Denver suburb of Broomfield. As a nod to their fans and history alike, the celebration even included an extravagant holiday ornament vending area in the foyer where fans could submit song requests on said tree decorations to act as bingo balls for the band to pull randomly on stage out of Coach's big bag strategically placed at the foot of Peter's keyboard rig, paying homage to Bingo Tour.",
      "The second 2-night run occurred again as a feel-good tip-of-the-hat to the original fanbase in and around the Ohio and Kentucky border region. A new fixture on tour, the New Year's Eve run landed in Cincinnati in 2022, acting as a reunion with the nearby Covington, KY area of the Midwest, one of the original fan hubs for the emerging indie groove sensation prior to their breakout. Ringing in the new year at midnight with a raucous rendition of Madhuvan, the band intertwined its jam staple with the traditional celebratory anthem of Auld Lang Syne, accompanied by a massive balloon drop within the Andrew J Brady Center.",
      "These shows continually pulled from the band's newfound growing catalog as a great mix of classic and fresh tunes alike, as 2022 saw the biggest catalog expansion, a whopping 18 new songs from the beginning of the year until the end, from Atlas Dogs to Thatch, all spanning the works from fleshed out tunes from the new 'Dripfield' album to road-written days-old debuts. Because of the impact of the year's events, and the further growth of the fan base, both 2-night stands in December garnered official releases across all streaming platforms. The first night in Broomfield, 12/16, would be the first ever officially released offering originating from a Goosemas show. Not to be outdone, the NYE show in Cincinnati would also be granted the same treatment, but also be offered as the latest vinyl release in the growing collection of physical media from the band, only the second full show to be released in the format, the first being the Buffalo show from 2019.",
    ],
    youtubeIds: ["BA3BIoIbHa8", "hK-BkTl02Mo"],
    links: [
      { label: "Goosemas N1", href: "https://goosetheband.bandcamp.com/album/2022-12-16-goosemas-ix-1stbank-center-broomfield-co" },
      { label: "Goosemas N2", href: "https://goosetheband.bandcamp.com/album/2022-12-17-goosemas-ix-1stbank-center-broomfield-co" },
      { label: "Cincinnati N1", href: "https://goosetheband.bandcamp.com/album/2022-12-30-andrew-j-brady-center-cincinnati-oh" },
      { label: "Cincinnati N2", href: "https://goosetheband.bandcamp.com/album/2022-12-31-andrew-j-brady-center-cincinnati-oh" },
    ],
  },
  {
    id: 23,
    title: "Live at the Salt Shed*",
    images: [{ src: "https://f4.bcbits.com/img/a1270118742_16.jpg", alt: "Live at the Salt Shed Album Cover", href: "https://goosetheband.bandcamp.com/album/live-at-the-salt-shed" }],
    paragraphs: [
      "With the new year in full swing, an extensive 2023 spring tour was to kick off with a host of markedly legendary venues added, both old and new. Spring of 2023 began the rise of ticket demand at smaller venues, and each show was bound to be a packed house, especially when considering the prospects of a 5-night residency at the historic Capital Theatre and a 3-night weekend stand at Nashville's Ryman Auditorium. Returning to the Midwest, however, set the band up for a new experience that would prove to be just as special as those mentioned before. Enter Chicago's newest destination venue, the Salt Shed. Opened in 2022, this venue was once the over 100-year home of Morton Salt, serving as an operational base for the iconic company. Now, backed by the history of the edifice, the stage was set for a truly spectacular 2-night mid-tour run as the band made their way from the southeast, up and around the country to the west coast on spring tour. With a variety of their original tunes mixed in with some stellar cover performances, the two nights represented a massive swath of the band's now extensive collection of songs, including new in 2023 tracks like the radio-friendly Lead Up and the energetic funky rhythms of Feel It Now. The highlight of the two-night stand would be the 30+ minute Hungersite. It would all culminate in a first of its kind official live release featuring both nights' 29 tracks, and also includes a very 'Ted Tapes'-like Chicago Soundcheck Jam that proved to many loyal followers that the band had not forgotten about the importance of gifting the fans their instrumental improvisational jams from time to time. The cover art is also the first time we are treated to a colorized piece by Goose's now in-house release artist and friend, Johnny Lovering.",
    ],
    youtubeIds: ["9z3hgct0-Wg"],
  },
  {
    id: 24,
    title: "7/7/2023 SPAC, Saratoga Springs, NY",
    images: [{ src: "https://f4.bcbits.com/img/a0453132882_16.jpg", alt: "7/7/2023 SPAC, Saratoga Springs, NY Album Cover", href: "https://goosetheband.bandcamp.com/album/2023-07-07-saratoga-performing-arts-center-saratoga-springs-ny" }],
    paragraphs: [
      "During a festival-laden summer tour of 2023, coming off a very busy spring tour earlier that year, the band relied heavily on the bigger crowds at multi-day festivals to continue their upward trajectory. Most of the festivals had them as top billing acts, playing mostly 2-set performances. There were, however, a handful of dedicated, headlining shows that were scheduled intermittently throughout the summer run, the last of which being their most ambitious booking to date. Enter the infamous venue in Saratoga Springs, New York: SPAC (Saratoga Performing Arts Center). Known primarily for hosting premier weekends during major touring bands' illustrious summer tours, SPAC offered Goose a measuring stick opportunity to see just how large their cachet really was at this point in their growth. Leading up to the show, tickets were relatively easy to come by as the SPAC lawn offered much real estate for those seeking to be a part of the festivities as the event grew nearer. While not completely sold out, rumors of a crowd reaching upwards of 12,000 attendees began to swirl a day prior to the event, largely due to a venue security guard named Larry that somebody had credited with the statement via social media. Suddenly, it was on! The scene was abuzz. Even if said claims were just shy of actuality, this would still wind up being Goose's biggest crowd to date. And it was. Estimating an outdoor crowd of closer to 10,500 fans, the lawn was well stocked with both first-timers and long-timers, and the band stepped up to the plate, releasing the horses with a monstrous first set that included 15+ minute versions of 3 songs consecutively: Animal, Red Bird, and SOS. Set two would contain 22+ minute versions of crowd favorites old and new, with The Empress of Organos opening the set and Thatch residing in the middle of the frame. The encore closer was what many had anticipated, but not nearly in the form that took shape, as the band closed out the night with a nearly 20-minute version of longtime rarity Factory Fiction. The last dedicated show of summer tour was one for the record books, and spoke to just how well-received the still young band could actually be in maintaining a lengthy summer tour of outdoor amphitheaters across the country.",
    ],
    youtubeIds: ["HAkc_RH9_bo"],
  },
]
