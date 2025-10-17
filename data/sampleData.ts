import {
  AggregatedWork,
  DashboardNotification,
  DirectMessage,
  MarketplaceEvent,
  WorkComment,
  WriterProfile,
  WritingWork,
} from "@/types";

export const writers: WriterProfile[] = [
  {
    id: "writer-aria",
    slug: "aria-sullivan",
    name: "Aria Sullivan",
    tagline: "Speculative fiction author exploring climate futures",
    bio: "Aria blends climate science with lyrical storytelling to explore resilient futures and the communities that build them.",
    avatar: "/avatars/aria.svg",
    location: "Portland, OR",
    website: "https://ariawrites.example.com",
    socials: {
      twitter: "aria_writes",
      instagram: "aria.sullivan.stories",
    },
    interests: ["climate fiction", "collaborations", "serialized works"],
    genres: ["Science Fiction", "Cli-Fi", "Short Stories"],
    featuredWorks: ["work-tidal-dreams", "work-seedling-symphony"],
    network: {
      followers: ["writer-jules", "writer-nova", "writer-ronin"],
      following: ["writer-jules", "writer-nova"],
    },
    messagingPreference: "followers",
  },
  {
    id: "writer-jules",
    slug: "jules-fern",
    name: "Jules Fern",
    tagline: "Mystery novelist uncovering the ghosts of forgotten cities",
    bio: "Jules writes slow-burn mysteries and interactive fiction, inviting readers to decode puzzles woven throughout sprawling urban legends.",
    avatar: "/avatars/jules.svg",
    location: "Chicago, IL",
    socials: {
      twitter: "julesfern",
      linkedin: "jules-fern",
    },
    interests: ["interactive fiction", "collaboration", "research exchange"],
    genres: ["Mystery", "Thriller", "Interactive"],
    featuredWorks: ["work-echo-vault", "work-clockwork-viaduct"],
    network: {
      followers: ["writer-aria", "writer-nova"],
      following: ["writer-aria", "writer-nova", "writer-ronin"],
    },
    messagingPreference: "anyone",
  },
  {
    id: "writer-nova",
    slug: "nova-kim",
    name: "Nova Kim",
    tagline: "Poet laureate of the digital wilds",
    bio: "Nova explores intimacy, technology, and diasporic identity through immersive poetry collections and multimedia chapbooks.",
    avatar: "/avatars/nova.svg",
    location: "Seattle, WA",
    website: "https://novaverse.poetry",
    socials: {
      twitter: "novakim",
      instagram: "nova.poetics",
    },
    interests: ["multimedia", "spoken word", "collaborations"],
    genres: ["Poetry", "Speculative", "Essays"],
    featuredWorks: ["work-synaptic-gardens"],
    network: {
      followers: ["writer-aria", "writer-jules"],
      following: ["writer-aria"],
    },
    messagingPreference: "mutuals",
  },
  {
    id: "writer-ronin",
    slug: "ronin-gale",
    name: "Ronin Gale",
    tagline: "Solarpunk journalist chronicling community innovation",
    bio: "Ronin reports on grassroots resilience projects around the world and experiments with collaborative worldbuilding labs.",
    avatar: "/avatars/ronin.svg",
    location: "Austin, TX",
    website: "https://solarpunk.report",
    socials: {
      twitter: "roninreports",
      instagram: "ronin.gale",
    },
    interests: ["worldbuilding", "reportage", "community organizing"],
    genres: ["Journalism", "Non-fiction", "Solarpunk"],
    featuredWorks: ["work-radical-horizon"],
    network: {
      followers: ["writer-aria"],
      following: ["writer-aria", "writer-jules"],
    },
    messagingPreference: "followers",
  },
];

export const works: WritingWork[] = [
  {
    id: "work-tidal-dreams",
    slug: "tidal-dreams",
    writerId: "writer-aria",
    title: "Tidal Dreams",
    summary:
      "A serialized climate fiction saga following three generations of ocean engineers rebuilding floating cities.",
    excerpt:
      "The tides listened to Mira the way cities once listened to storms—equally afraid and electrified.",
    genres: ["Science Fiction", "Cli-Fi"],
    interests: ["climate fiction", "serialized works"],
    publishedAt: "2024-09-12T08:00:00.000Z",
    updatedAt: "2024-09-28T04:00:00.000Z",
    status: "published",
    readingTimeMinutes: 18,
    popularityScore: 92,
    recommendationsScore: 87,
    likes: 340,
    bookmarks: 198,
  },
  {
    id: "work-seedling-symphony",
    slug: "seedling-symphony",
    writerId: "writer-aria",
    title: "Seedling Symphony",
    summary:
      "A short story about community choirs that help forests adapt to rapid climate shifts.",
    excerpt: "They tuned their voices to sap flow, humming chlorophyll lullabies.",
    genres: ["Cli-Fi", "Short Stories"],
    interests: ["climate fiction", "community"],
    publishedAt: "2024-06-20T16:00:00.000Z",
    updatedAt: "2024-07-15T11:00:00.000Z",
    status: "published",
    readingTimeMinutes: 12,
    popularityScore: 74,
    recommendationsScore: 81,
    likes: 210,
    bookmarks: 122,
  },
  {
    id: "work-echo-vault",
    slug: "echo-vault",
    writerId: "writer-jules",
    title: "Echo Vault",
    summary:
      "An interactive noir mystery where readers unlock clues hidden across multiple timelines.",
    excerpt: "The vault only opened when the city slept and the ghosts clocked in.",
    genres: ["Mystery", "Interactive"],
    interests: ["interactive fiction", "puzzle"],
    publishedAt: "2024-10-01T20:00:00.000Z",
    updatedAt: "2024-10-10T10:00:00.000Z",
    status: "published",
    readingTimeMinutes: 25,
    popularityScore: 88,
    recommendationsScore: 90,
    likes: 402,
    bookmarks: 260,
  },
  {
    id: "work-clockwork-viaduct",
    slug: "clockwork-viaduct",
    writerId: "writer-jules",
    title: "Clockwork Viaduct",
    summary:
      "A slow-burn thriller about an archivist who discovers a conspiracy hidden in public transit maps.",
    excerpt: "Every train delay was a breadcrumb in the conspiracy's ledger.",
    genres: ["Mystery", "Thriller"],
    interests: ["urban myths", "slow burn"],
    publishedAt: "2024-05-11T14:00:00.000Z",
    updatedAt: "2024-08-18T18:00:00.000Z",
    status: "published",
    readingTimeMinutes: 30,
    popularityScore: 80,
    recommendationsScore: 72,
    likes: 310,
    bookmarks: 187,
  },
  {
    id: "work-synaptic-gardens",
    slug: "synaptic-gardens",
    writerId: "writer-nova",
    title: "Synaptic Gardens",
    summary:
      "A multimedia poetry chapbook exploring digital rituals, intimacy, and ecological dreaming.",
    excerpt: "We planted motherboards in the soil and called it communion.",
    genres: ["Poetry", "Speculative"],
    interests: ["multimedia", "spoken word"],
    publishedAt: "2024-08-05T09:00:00.000Z",
    updatedAt: "2024-09-20T23:00:00.000Z",
    status: "published",
    readingTimeMinutes: 15,
    popularityScore: 69,
    recommendationsScore: 85,
    likes: 178,
    bookmarks: 240,
  },
  {
    id: "work-radical-horizon",
    slug: "radical-horizon",
    writerId: "writer-ronin",
    title: "Radical Horizon",
    summary:
      "Investigative feature on solarpunk co-ops prototyping grid-independent infrastructure.",
    excerpt:
      "Their grid was a patchwork of reclaimed parts and borrowed sunlight, stitched together with trust.",
    genres: ["Journalism", "Solarpunk"],
    interests: ["worldbuilding", "community"],
    publishedAt: "2024-09-01T12:00:00.000Z",
    updatedAt: "2024-09-25T18:00:00.000Z",
    status: "published",
    readingTimeMinutes: 20,
    popularityScore: 71,
    recommendationsScore: 77,
    likes: 156,
    bookmarks: 133,
  },
  {
    id: "work-ember-letters",
    slug: "ember-letters",
    writerId: "writer-nova",
    title: "Ember Letters",
    summary:
      "An upcoming collection of speculative epistolary poems shared as weekly drafts.",
    excerpt: "Each letter smoldered differently, depending on who's memory it carried.",
    genres: ["Poetry", "Speculative"],
    interests: ["serialized works", "collaborations"],
    publishedAt: "2024-10-25T00:00:00.000Z",
    updatedAt: "2024-10-11T19:00:00.000Z",
    status: "draft",
    readingTimeMinutes: 8,
    popularityScore: 55,
    recommendationsScore: 68,
    likes: 34,
    bookmarks: 92,
  },
  {
    id: "work-harbor-light",
    slug: "harbor-light",
    writerId: "writer-ronin",
    title: "Harbor Light",
    summary:
      "A collaborative worldbuilding draft documenting floating seed libraries across Pacific communities.",
    excerpt: "Every lantern held a seed story, ready for the next port.",
    genres: ["Solarpunk", "Journalism"],
    interests: ["worldbuilding", "community"],
    publishedAt: "2024-11-02T12:00:00.000Z",
    updatedAt: "2024-10-13T15:00:00.000Z",
    status: "draft",
    readingTimeMinutes: 16,
    popularityScore: 48,
    recommendationsScore: 62,
    likes: 26,
    bookmarks: 88,
  },
];

export const comments: WorkComment[] = [
  {
    id: "comment-1",
    workId: "work-tidal-dreams",
    authorId: "writer-jules",
    body: "The intergenerational thread is so compelling—chapter three is my favorite yet!",
    createdAt: "2024-10-10T14:30:00.000Z",
  },
  {
    id: "comment-2",
    workId: "work-tidal-dreams",
    authorId: "writer-nova",
    body: "Would you be open to pairing this with soundscapes? I have some ocean field recordings we could experiment with.",
    createdAt: "2024-10-11T09:10:00.000Z",
  },
  {
    id: "comment-3",
    workId: "work-echo-vault",
    authorId: "writer-aria",
    body: "That rotating cipher puzzle on page 4 blew my mind. Any plans for a second season?",
    createdAt: "2024-10-12T20:45:00.000Z",
  },
  {
    id: "comment-4",
    workId: "work-radical-horizon",
    authorId: "writer-jules",
    body: "Love how you centered community voices—especially the section on localized microgrids.",
    createdAt: "2024-10-13T16:20:00.000Z",
  },
];

const baseTimestamp = Date.now();

export const directMessages: DirectMessage[] = [
  {
    id: "msg-1",
    threadId: "writer-aria__writer-jules",
    senderId: "writer-aria",
    receiverId: "writer-jules",
    body: "Hey Jules! Thanks for the note on Tidal Dreams—do you want early access to the next installment?",
    createdAt: new Date(baseTimestamp - 1000 * 60 * 35).toISOString(),
    read: true,
  },
  {
    id: "msg-2",
    threadId: "writer-aria__writer-jules",
    senderId: "writer-jules",
    receiverId: "writer-aria",
    body: "Absolutely! I'd love to swap editing notes if you're open to it.",
    createdAt: new Date(baseTimestamp - 1000 * 60 * 27).toISOString(),
    read: true,
  },
  {
    id: "msg-3",
    threadId: "writer-aria__writer-nova",
    senderId: "writer-aria",
    receiverId: "writer-nova",
    body: "Nova, your idea about the soundscapes is brilliant. Let's collaborate next week?",
    createdAt: new Date(baseTimestamp - 1000 * 60 * 18).toISOString(),
    read: false,
  },
  {
    id: "msg-4",
    threadId: "writer-aria__writer-ronin",
    senderId: "writer-ronin",
    receiverId: "writer-aria",
    body: "Aria, your floats research aligns with my next feature. Can we schedule a quick call?",
    createdAt: new Date(baseTimestamp - 1000 * 60 * 8).toISOString(),
    read: false,
  },
];

export const scheduledMessages: { message: DirectMessage; delayMs: number }[] = [
  {
    message: {
      id: "msg-5",
      threadId: "writer-aria__writer-jules",
      senderId: "writer-jules",
      receiverId: "writer-aria",
      body: "Just sent over my annotated notes—excited to hear your thoughts!",
      createdAt: new Date(baseTimestamp + 1000 * 60 * 2).toISOString(),
      read: false,
    },
    delayMs: 1000 * 30,
  },
  {
    message: {
      id: "msg-6",
      threadId: "writer-aria__writer-nova",
      senderId: "writer-nova",
      receiverId: "writer-aria",
      body: "Next Wednesday works great. I'll draft a shared mood board before then!",
      createdAt: new Date(baseTimestamp + 1000 * 60 * 3).toISOString(),
      read: false,
    },
    delayMs: 1000 * 60,
  },
];

export const notifications: DashboardNotification[] = [
  {
    id: "notif-1",
    type: "comment",
    actorId: "writer-jules",
    subjectId: "work-tidal-dreams",
    createdAt: new Date(baseTimestamp - 1000 * 60 * 50).toISOString(),
    summary: "Jules commented on Tidal Dreams",
  },
  {
    id: "notif-2",
    type: "marketplace",
    actorId: "writer-ronin",
    subjectId: "work-radical-horizon",
    createdAt: new Date(baseTimestamp - 1000 * 60 * 120).toISOString(),
    summary: "Radical Horizon was featured in Solarpunk Weekly",
  },
  {
    id: "notif-3",
    type: "message",
    actorId: "writer-nova",
    subjectId: "writer-aria",
    createdAt: new Date(baseTimestamp - 1000 * 60 * 15).toISOString(),
    summary: "Nova sent you a new message",
  },
];

export const marketplaceEvents: MarketplaceEvent[] = [
  {
    id: "event-1",
    workId: "work-tidal-dreams",
    createdAt: new Date(baseTimestamp - 1000 * 60 * 90).toISOString(),
    type: "featured",
    description: "Tidal Dreams highlighted in Weekly Futures spotlight",
  },
  {
    id: "event-2",
    workId: "work-echo-vault",
    createdAt: new Date(baseTimestamp - 1000 * 60 * 240).toISOString(),
    type: "new-work",
    description: "Echo Vault launched its interactive finale challenge",
  },
  {
    id: "event-3",
    workId: "work-radical-horizon",
    createdAt: new Date(baseTimestamp - 1000 * 60 * 360).toISOString(),
    type: "milestone",
    description: "Radical Horizon reached 100 community bookmarks",
  },
];

export function withWriter(work: WritingWork): AggregatedWork {
  const writer = writers.find((entry) => entry.id === work.writerId);
  if (!writer) {
    throw new Error(`No writer found for work ${work.id}`);
  }

  return {
    ...work,
    writer,
  };
}

export const aggregatedWorks: AggregatedWork[] = works.map(withWriter);
