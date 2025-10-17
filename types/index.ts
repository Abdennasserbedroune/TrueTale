export type MessagingPreference = "anyone" | "followers" | "mutuals";

export interface WriterProfile {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  bio: string;
  avatar?: string;
  location?: string;
  website?: string;
  socials?: {
    twitter?: string;
    linkedin?: string;
    instagram?: string;
  };
  interests: string[];
  genres: string[];
  featuredWorks: string[];
  network: {
    followers: string[];
    following: string[];
  };
  messagingPreference: MessagingPreference;
}

export type WorkStatus = "published" | "draft";

export type PublicationStatus = "draft" | "finalized" | "published";

export interface MarketplaceMetadata {
  status: PublicationStatus;
  listingTitle?: string;
  listingSynopsis?: string;
  tags?: string[];
  priceCents?: number;
  fileAssetId?: string;
  inventoryTotal?: number | null;
  inventoryAvailable?: number | null;
  publishedAt?: string;
  purchaseCount?: number;
}

export interface WritingWork {
  id: string;
  slug: string;
  writerId: string;
  title: string;
  summary: string;
  excerpt: string;
  genres: string[];
  interests: string[];
  publishedAt: string;
  updatedAt: string;
  status: WorkStatus;
  readingTimeMinutes: number;
  popularityScore: number;
  recommendationsScore: number;
  likes: number;
  bookmarks: number;
  marketplace?: MarketplaceMetadata;
}

export interface FileAsset {
  id: string;
  workId: string;
  filename: string;
  contentType: string;
  size: number;
  checksum: string;
  createdAt: string;
}

export interface FileAssetWithData extends FileAsset {
  base64Data: string;
}

export type PurchaseStatus = "pending" | "completed";

export interface PurchaseRecord {
  id: string;
  workId: string;
  buyerEmail: string;
  buyerId: string;
  stripeSessionId: string;
  status: PurchaseStatus;
  createdAt: string;
  amountCents: number;
  downloadToken?: string;
  fulfilledAt?: string;
  downloadCount: number;
}

export interface WorkComment {
  id: string;
  workId: string;
  authorId: string;
  body: string;
  createdAt: string;
  parentId?: string;
}

export interface DirectMessage {
  id: string;
  threadId: string;
  senderId: string;
  receiverId: string;
  body: string;
  createdAt: string;
  read: boolean;
}

export type NotificationType = "comment" | "message" | "marketplace";

export interface DashboardNotification {
  id: string;
  type: NotificationType;
  actorId: string;
  subjectId: string;
  createdAt: string;
  summary: string;
}

export interface MarketplaceEvent {
  id: string;
  workId: string;
  createdAt: string;
  type: "new-work" | "featured" | "milestone";
  description: string;
}

export interface AggregatedWork extends WritingWork {
  writer: WriterProfile;
}

export interface BuyerLibraryEntry {
  purchaseId: string;
  work: AggregatedWork;
  downloadUrl: string;
  downloadCount: number;
  fulfilledAt: string;
}

export type DraftVisibility = "private" | "shared" | "public";

export interface DraftAttachment {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  uploadedAt: string;
  dataUrl?: string;
}

export interface DraftRevision {
  id: string;
  draftId: string;
  authorId: string;
  titleSnapshot: string;
  content: string;
  createdAt: string;
  autosave: boolean;
  note?: string;
}

export type DraftCommentPlacement = "inline" | "sidebar";

export interface DraftWorkspaceComment {
  id: string;
  draftId: string;
  authorId: string;
  body: string;
  createdAt: string;
  placement: DraftCommentPlacement;
  quote?: string | null;
}

export interface DraftSummary {
  id: string;
  title: string;
  ownerId: string;
  visibility: DraftVisibility;
  sharedWith: string[];
  createdAt: string;
  updatedAt: string;
  preview: string;
  attachments: DraftAttachment[];
}

export interface DraftWorkspace extends DraftSummary {
  content: string;
  revisions: DraftRevision[];
  comments: DraftWorkspaceComment[];
}

export interface DraftDiffSegment {
  type: "unchanged" | "added" | "removed";
  text: string;
}

export interface DraftComparisonView {
  base: DraftRevision;
  target: DraftRevision;
  segments: DraftDiffSegment[];
}
