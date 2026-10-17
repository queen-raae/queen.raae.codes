interface SiteMetadata {
  siteUrl: string;
  siteName: string;
  siteTagline: string;
  siteDescription: string;
  siteLang: string;
  siteSocialImage: string;
  siteSocialImageAlt: string;
  siteTwitterCreator: string;
  siteSocialMedia: string[];
}

const siteMetadata: SiteMetadata = {
  siteUrl: "https://queen.raae.codes",
  siteName: "Queen Raae",
  siteTagline: "A developer's logbook, kept in Oslo",
  siteDescription:
    "I’m Benedicte (Queen) Raae. My co-captain Ola, our Pirate Princess and I run Lilly Labs, a small dev studio in the old family factory we also call home. Located in cosy Rodeløkka, Oslo, Norway.",
  siteLang: "en",
  siteSocialImage: "/raae.jpg",
  siteSocialImageAlt: "Queen Raae holding a laptop in front of her gallery wall",
  siteTwitterCreator: "@raae",
  siteSocialMedia: ["https://github.com/queen-raae", "https://twitter.com/raae", "https://www.youtube.com/QueenRaae"],
};

export default siteMetadata;
