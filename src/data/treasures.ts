// Treasures: things Queen made that you can poke at, as lab notes. The podcast row is separate (src/lib/podcast.ts).
// `what` may hold a little HTML (a bold lead, a link). Words are Queen's own; don't rewrite them.
export interface TreasureAction {
  verb: string;
  href: string;
  // Shown after the verb for links that leave the site ("Visit usepow.app")
  domain?: string;
}

export interface Treasure {
  title: string;
  href?: string;
  what: string;
  when: string;
  why: string;
  actions: TreasureAction[];
  // Shown in place of actions when there is nowhere to go
  status?: string;
}

export const treasures: Treasure[] = [
  {
    title: "Is it Queen or AI?",
    href: "/is-it-queen-or-ai/",
    what: "Real quotes from the Slow &amp; Steady podcast next to ones an AI wrote in my voice. Guess which is which.",
    when: "2026",
    why: "Learn more about AI and setting up a voice skill based on transcripts from Slow & Steady.",
    actions: [{ verb: "Play", href: "/is-it-queen-or-ai/" }],
  },
  {
    title: "POW!",
    href: "https://usepow.app",
    what: "<b>The Privacy-First Menstrual Cycle Journal.</b> Your data never leaves your browser. Launched 8&nbsp;March 2020.",
    when: "2019",
    why: "I needed to know how one makes an app that cannot leak your data.",
    actions: [{ verb: "Visit", href: "https://usepow.app", domain: "usepow.app" }],
  },
  {
    title: "The Varsom app",
    what: "The first app version of varsom.no. It was also a test of their docs and API developer experience.",
    when: "2013–2019",
    why: "Give users a better phone experience and the option to be notified.",
    actions: [],
    status: "No longer live",
  },
  {
    title: "Kompetansemål",
    href: "https://kompetansemål.no",
    what: "The Norwegian school competency goals in plainer language, with an easier overview.",
    when: "2026",
    why: "I could not for the life of me get an overview on the official site. Luckily, there’s an API.",
    actions: [{ verb: "Visit", href: "https://kompetansemål.no", domain: "kompetansemål.no" }],
  },
  {
    title: "Fashion Tweeks",
    href: "https://fashiontweeks.com",
    what: "Recreated fashion billboards with my friends and me as models. Ended up on the front page of VG in my bikini.",
    when: "2012",
    why: "I wondered what fashion billboards would look like if my friends or I were the models?!?",
    actions: [{ verb: "Visit", href: "https://fashiontweeks.com", domain: "fashiontweeks.com" }],
  },
  {
    title: "Queen Raae on YouTube",
    href: "https://www.youtube.com/@queenraae",
    what: "Piraty live streams and videos, since 2021.",
    when: "Since 2021",
    why: "The thought of live streaming scared me half to death and I mocked it as a concept, a sure sign it needed to be done.",
    actions: [{ verb: "Watch on", href: "https://www.youtube.com/@queenraae", domain: "youtube.com/@queenraae" }],
  },
  {
    title: "Data in the Wild",
    href: "https://datainthewild.fm",
    what: 'A podcast exploring data modelling in real-life indie hacker software, sponsored by <a href="https://xata.io">Xata</a>.',
    when: "2023–2024",
    why: "We wanted to learn more about data modelling and podcasting. Xata had the same goal.",
    actions: [{ verb: "Listen on", href: "https://datainthewild.fm", domain: "datainthewild.fm" }],
  },
  {
    title: "Prune your Follows",
    href: "https://pruneyourfollows.com",
    what: "A web app to help you unfollow folks on Twitter to get a better timeline experience built with Xata.",
    when: "2022–2023",
    why: "Test Xata’s developer experience while live streaming.",
    actions: [{ verb: "Visit", href: "https://pruneyourfollows.com", domain: "pruneyourfollows.com" }],
  },
  {
    title: "Lillygram",
    what: "Let you send Instagram photos as proper monthly physical letters to your loved ones.",
    when: "2013–2015",
    why: "How could we include the less digital among us?",
    actions: [],
    status: "No longer live",
  },
];
