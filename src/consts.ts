import type { Site, Metadata, Socials } from "@types";

export const SITE: Site = {
  NAME: "Gabriel Melo",
  EMAIL: "gabrielpresb@gmail.com",
  NUM_POSTS_ON_HOMEPAGE: 3,
  NUM_WORKS_ON_HOMEPAGE: 2,
  NUM_PROJECTS_ON_HOMEPAGE: 3,
};

export const HOME: Metadata = {
  TITLE: "Home",
  DESCRIPTION: "A blog where i dump all my thoughts",
};

export const BLOG: Metadata = {
  TITLE: "Blog",
  DESCRIPTION: "A blog where i dump all my thoughts",
};

export const WORK: Metadata = {
  TITLE: "Work",
  DESCRIPTION: "Where I have worked and what I have done.",
};

export const PROJECTS: Metadata = {
  TITLE: "Projects",
  DESCRIPTION:
    "A collection of my projects, with links to repositories and demos.",
};

export const SOCIALS: Socials = [
  { NAME: "twitter", HREF: "https://x.com/gabrielmeloc2" },
  {
    NAME: "github",
    HREF: "https://github.com/gabrielmeloc22",
  },
  {
    NAME: "linkedin",
    HREF: "https://linkedin.com/in/gabrielmeloc",
  },
];
