import { CodingLevel } from "../src/generated/prisma/enums";

export const members = [
  {
    id: crypto.randomUUID(),
    name: "John",
    email: "john@gmail",
    githubUsername: "john-coder",
    orgName: "hello world",
    joinReason: "open-source",
    codingLevel: CodingLevel.intermediate,
  },
  {
    id: crypto.randomUUID(),
    name: "Doe",
    email: "doe@gmail",
    githubUsername: "doe-coder",
    orgName: "hello-world",
    joinReason: "learning",
    codingLevel: CodingLevel.beginner,
  },
  {
    id: crypto.randomUUID(),
    name: "Jane",
    email: "jane@gmail",
    githubUsername: "jane-coder",
    orgName: "hello",
    joinReason: "documenting",
    codingLevel: CodingLevel.advanced,
  },
  ...Array.from({ length: 30 }, (_, index) => {
    const number = index + 1;
    return {
      id: crypto.randomUUID(),
      name: `Community Member ${number}`,
      email: `community-member-${number}@gmail.com`,
      githubUsername: `community-member-${number}`,
      orgName: `Open Source Group ${number}`,
      joinReason:
        number % 3 === 0
          ? "networking"
          : number % 2 === 0
            ? "learning"
            : "open-source",
      codingLevel:
        number % 3 === 0
          ? CodingLevel.advanced
          : number % 2 === 0
            ? CodingLevel.intermediate
            : CodingLevel.beginner,
    };
  }),
];

export const projects = [
  {
    id: crypto.randomUUID(),
    slug: crypto.randomUUID(),
    repoOwner: "OSK",
    repoName: "OSK",
    imageUrl: "https://www.pic-profile/4543",
    imagePublicId: "4349",
    tagline: "unknown",
    category: "web-app",
    maintainer: "DOE",
    langColor: "RED",
    ghLanguage: "TypeScript",
    ghTopics: ["PWA", "OOP"],
  },
  {
    id: crypto.randomUUID(),
    slug: crypto.randomUUID(),
    repoOwner: "docksight",
    repoName: "docksight",
    imageUrl: "https://www.pic-profile/4540",
    imagePublicId: "49",
    tagline: "unknown",
    category: "application",
    maintainer: "JOHN",
    langColor: "BLUE",
    ghLanguage: "TypeScript",
    ghTopics: ["docker", "go", "websockets"],
  },
  ...Array.from({ length: 30 }, (_, index) => {
    const number = index + 1;
    return {
      id: crypto.randomUUID(),
      slug: `community-project-${number}`,
      repoOwner: `community-owner-${number}`,
      repoName: `community-project-${number}`,
      imageUrl: `https://www.pic-profile/community-${number}`,
      imagePublicId: `community-project-${number}`,
      tagline: `A community open-source project ${number}`,
      category: number % 2 === 0 ? "application" : "web-app",
      maintainer: `Community Member ${number}`,
      langColor: number % 2 === 0 ? "BLUE" : "RED",
      ghLanguage: number % 3 === 0 ? "JavaScript" : "TypeScript",
      ghTopics:
        number % 2 === 0 ? ["open-source", "community"] : ["typescript", "web"],
    };
  }),
];

export const events = [
  {
    id: crypto.randomUUID(),
    title: "open-source brunch",
    imageUrl: "https://www.pic-profile/45",
    imagePublicId: "9",
    description: "meeting and  having good times!",
    category: "connect-event",
    location: "Kigali Hotel",
    date: new Date(),
    speakers: ["John", "Jane", "smith"],
  },
  {
    id: crypto.randomUUID(),
    title: "product launch",
    imageUrl: "https://www.pic-profile/11",
    imagePublicId: "29",
    description: "Launching products",
    category: "launch-event",
    location: "Norskeen",
    date: new Date(),
    speakers: ["John", "Jane", "smith"],
  },
  ...Array.from({ length: 30 }, (_, index) => {
    const number = index + 1;
    return {
      id: crypto.randomUUID(),
      title: `Community Event ${number}`,
      imageUrl: `https://www.pic-profile/event-${number}`,
      imagePublicId: `community-event-${number}`,
      description: `An open-source community event for builders and contributors, edition ${number}.`,
      category: number % 2 === 0 ? "launch-event" : "connect-event",
      location: number % 2 === 0 ? "Norskeen" : "Kigali Hotel",
      date: new Date(Date.now() + number * 24 * 60 * 60 * 1000),
      speakers: [`Speaker ${number}`, "John", "Jane"],
    };
  }),
];
