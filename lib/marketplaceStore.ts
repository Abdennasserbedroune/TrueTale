import { createHash, randomUUID } from "crypto";
import {
  fileAssets as fileAssetSeed,
  purchaseSeed,
  works as worksSeed,
  writers,
} from "@/data/sampleData";
import {
  AggregatedWork,
  BuyerLibraryEntry,
  FileAssetWithData,
  MarketplaceMetadata,
  PurchaseRecord,
  PublicationStatus,
  WritingWork,
} from "@/types";

export interface FileAssetInput {
  filename: string;
  contentType: string;
  base64Data: string;
}

export interface ListingConfiguration {
  title: string;
  synopsis: string;
  tags: string[];
  priceCents: number;
  inventory: number | null;
}

interface MarketplaceState {
  works: WritingWork[];
  fileAssets: Map<string, FileAssetWithData>;
  purchases: PurchaseRecord[];
}

const writerLookup = new Map(writers.map((writer) => [writer.id, writer] as const));

function cloneMarketplace(marketplace?: MarketplaceMetadata): MarketplaceMetadata | undefined {
  if (!marketplace) return undefined;
  return {
    ...marketplace,
    tags: marketplace.tags ? [...marketplace.tags] : undefined,
  };
}

function cloneWork(work: WritingWork): WritingWork {
  return {
    ...work,
    genres: [...work.genres],
    interests: [...work.interests],
    marketplace: cloneMarketplace(work.marketplace),
  };
}

function cloneAsset(asset: FileAssetWithData): FileAssetWithData {
  return { ...asset };
}

function clonePurchase(purchase: PurchaseRecord): PurchaseRecord {
  return { ...purchase };
}

function createInitialState(): MarketplaceState {
  const works = worksSeed.map(cloneWork);
  const fileAssets = new Map<string, FileAssetWithData>();
  fileAssetSeed.forEach((asset) => {
    fileAssets.set(asset.id, cloneAsset(asset));
  });
  const purchases = purchaseSeed.map(clonePurchase);
  return { works, fileAssets, purchases };
}

const state: MarketplaceState = createInitialState();

export function resetMarketplaceState(): void {
  const fresh = createInitialState();
  state.works = fresh.works;
  state.fileAssets = fresh.fileAssets;
  state.purchases = fresh.purchases;
}

function buildAggregatedWork(work: WritingWork): AggregatedWork {
  const writer = writerLookup.get(work.writerId);
  if (!writer) {
    throw new Error(`Writer ${work.writerId} not found`);
  }

  return {
    ...cloneWork(work),
    writer,
  };
}

export function listAllWorks(): WritingWork[] {
  return state.works.map(cloneWork);
}

export function listAggregatedWorks(): AggregatedWork[] {
  return state.works.map(buildAggregatedWork);
}

export function getAggregatedWorkBySlug(slug: string): AggregatedWork | undefined {
  const work = state.works.find((entry) => entry.slug === slug);
  return work ? buildAggregatedWork(work) : undefined;
}

export function getWorkById(workId: string): WritingWork | undefined {
  const work = state.works.find((entry) => entry.id === workId);
  return work ? cloneWork(work) : undefined;
}

function requireWork(workId: string): WritingWork {
  const work = state.works.find((entry) => entry.id === workId);
  if (!work) {
    throw new Error(`Work ${workId} not found`);
  }
  return work;
}

function ensureMarketplace(work: WritingWork): MarketplaceMetadata {
  if (!work.marketplace) {
    work.marketplace = {
      status: "draft",
      tags: [],
    };
  }
  if (!work.marketplace.tags) {
    work.marketplace.tags = [];
  }
  return work.marketplace;
}

export function registerFileAsset(workId: string, input: FileAssetInput): FileAssetWithData {
  const work = requireWork(workId);
  const marketplace = ensureMarketplace(work);

  const dataSize = Buffer.from(input.base64Data, "base64").length;
  const checksum = createHash("sha256").update(input.base64Data).digest("hex");
  const asset: FileAssetWithData = {
    id: `asset-${randomUUID()}`,
    workId,
    filename: input.filename,
    contentType: input.contentType,
    size: dataSize,
    checksum,
    createdAt: new Date().toISOString(),
    base64Data: input.base64Data,
  };

  state.fileAssets.set(asset.id, asset);
  marketplace.fileAssetId = asset.id;

  return cloneAsset(asset);
}

export function finalizeWork(workId: string): AggregatedWork {
  const work = requireWork(workId);
  const marketplace = ensureMarketplace(work);

  if (!marketplace.fileAssetId) {
    throw new Error("Cannot finalize a work without an uploaded file asset");
  }

  marketplace.status = "finalized";
  return buildAggregatedWork(work);
}

function normaliseInventoryValue(value: number | null | undefined): number | null | undefined {
  if (value === null || value === undefined) return value;
  return Math.max(0, Math.floor(value));
}

export function configureListing(workId: string, config: ListingConfiguration): AggregatedWork {
  const work = requireWork(workId);
  const marketplace = ensureMarketplace(work);

  if (!marketplace.fileAssetId) {
    throw new Error("Attach a file asset before configuring the listing");
  }

  marketplace.listingTitle = config.title;
  marketplace.listingSynopsis = config.synopsis;
  marketplace.tags = [...config.tags];
  marketplace.priceCents = config.priceCents;

  const previousTotal = normaliseInventoryValue(marketplace.inventoryTotal);
  const previousAvailable = normaliseInventoryValue(marketplace.inventoryAvailable);
  const sold =
    typeof previousTotal === "number" && typeof previousAvailable === "number"
      ? Math.max(0, previousTotal - previousAvailable)
      : 0;

  if (config.inventory === null) {
    marketplace.inventoryTotal = null;
    marketplace.inventoryAvailable = null;
  } else {
    const total = normaliseInventoryValue(config.inventory) ?? 0;
    marketplace.inventoryTotal = total;
    marketplace.inventoryAvailable = Math.max(0, total - sold);
  }

  return buildAggregatedWork(work);
}

function assertPublishable(marketplace: MarketplaceMetadata): void {
  if (!marketplace.fileAssetId) {
    throw new Error("A published listing must reference a file asset");
  }
  if (typeof marketplace.priceCents !== "number" || marketplace.priceCents <= 0) {
    throw new Error("A published listing must include a positive price");
  }
}

export function publishWork(workId: string): AggregatedWork {
  const work = requireWork(workId);
  const marketplace = ensureMarketplace(work);

  assertPublishable(marketplace);

  if (marketplace.inventoryTotal !== null && marketplace.inventoryAvailable === undefined) {
    marketplace.inventoryAvailable = marketplace.inventoryTotal;
  }

  marketplace.status = "published";
  marketplace.publishedAt = marketplace.publishedAt ?? new Date().toISOString();

  return buildAggregatedWork(work);
}

export function listPublishedCatalogue(): AggregatedWork[] {
  return state.works
    .filter((work) => {
      const marketplace = work.marketplace;
      if (!marketplace || marketplace.status !== "published") return false;
      if (marketplace.inventoryTotal === null) return true;
      const available = marketplace.inventoryAvailable ?? marketplace.inventoryTotal ?? 0;
      return available > 0;
    })
    .map(buildAggregatedWork);
}

function deriveBuyerId(buyerEmail: string): string {
  return buyerEmail.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export function createPendingPurchase(options: {
  workId: string;
  buyerEmail: string;
  stripeSessionId: string;
  amountCents: number;
}): PurchaseRecord {
  const work = requireWork(options.workId);
  const marketplace = ensureMarketplace(work);

  if (marketplace.status !== "published") {
    throw new Error("Only published works can be purchased");
  }
  if (!marketplace.priceCents || marketplace.priceCents <= 0) {
    throw new Error("Published listings require a price");
  }
  if (marketplace.inventoryTotal !== null) {
    const available = marketplace.inventoryAvailable ?? marketplace.inventoryTotal;
    if (available <= 0) {
      throw new Error("This listing is out of inventory");
    }
  }

  const purchase: PurchaseRecord = {
    id: `purchase-${randomUUID()}`,
    workId: options.workId,
    buyerEmail: options.buyerEmail,
    buyerId: deriveBuyerId(options.buyerEmail),
    stripeSessionId: options.stripeSessionId,
    status: "pending",
    createdAt: new Date().toISOString(),
    amountCents: options.amountCents,
    downloadCount: 0,
  };

  state.purchases.push(purchase);
  return clonePurchase(purchase);
}

export function markPurchaseCompleted(sessionId: string, token?: string): PurchaseRecord {
  const purchase = state.purchases.find((entry) => entry.stripeSessionId === sessionId);
  if (!purchase) {
    throw new Error(`No pending purchase for session ${sessionId}`);
  }

  if (purchase.status === "completed") {
    return clonePurchase(purchase);
  }

  purchase.status = "completed";
  purchase.fulfilledAt = new Date().toISOString();
  purchase.downloadToken = token ?? randomUUID();
  purchase.downloadCount = purchase.downloadCount ?? 0;

  const work = requireWork(purchase.workId);
  const marketplace = ensureMarketplace(work);

  if (marketplace.inventoryTotal !== null) {
    const available = marketplace.inventoryAvailable ?? marketplace.inventoryTotal;
    if (available <= 0) {
      throw new Error("Inventory exhausted while completing purchase");
    }
    marketplace.inventoryAvailable = available - 1;
  }

  marketplace.purchaseCount = (marketplace.purchaseCount ?? 0) + 1;

  return clonePurchase(purchase);
}

export function getPurchaseById(purchaseId: string): PurchaseRecord | undefined {
  const purchase = state.purchases.find((entry) => entry.id === purchaseId);
  return purchase ? clonePurchase(purchase) : undefined;
}

export function listPurchasesForBuyer(buyerEmail: string): PurchaseRecord[] {
  const normalised = buyerEmail.trim().toLowerCase();
  return state.purchases
    .filter((purchase) => purchase.buyerEmail.trim().toLowerCase() === normalised)
    .map(clonePurchase);
}

export function getAssetById(assetId: string): FileAssetWithData | undefined {
  const asset = state.fileAssets.get(assetId);
  return asset ? cloneAsset(asset) : undefined;
}

export function recordDownload(purchaseId: string): PurchaseRecord {
  const purchase = state.purchases.find((entry) => entry.id === purchaseId);
  if (!purchase) {
    throw new Error(`Purchase ${purchaseId} not found`);
  }
  if (purchase.status !== "completed") {
    throw new Error("Only fulfilled purchases can be downloaded");
  }

  purchase.downloadCount = (purchase.downloadCount ?? 0) + 1;
  return clonePurchase(purchase);
}

export function buildBuyerLibrary(buyerEmail: string): BuyerLibraryEntry[] {
  const completed = listPurchasesForBuyer(buyerEmail).filter((purchase) => purchase.status === "completed");

  return completed
    .map((purchase) => {
      const work = requireWork(purchase.workId);
      const aggregated = buildAggregatedWork(work);
      if (!purchase.downloadToken) {
        return null;
      }
      return {
        purchaseId: purchase.id,
        work: aggregated,
        downloadUrl: `/api/marketplace/purchases/${purchase.id}/download?token=${purchase.downloadToken}`,
        downloadCount: purchase.downloadCount ?? 0,
        fulfilledAt: purchase.fulfilledAt ?? purchase.createdAt,
      } satisfies BuyerLibraryEntry;
    })
    .filter((entry): entry is BuyerLibraryEntry => Boolean(entry));
}

export function updateMarketplaceStatus(workId: string, status: PublicationStatus): AggregatedWork {
  const work = requireWork(workId);
  const marketplace = ensureMarketplace(work);
  marketplace.status = status;
  return buildAggregatedWork(work);
}
