import { stripeService } from "@/lib/stripeService";
import {
  buildBuyerLibrary,
  configureListing,
  FileAssetInput,
  getAssetById,
  getPurchaseById,
  getWorkById,
  listPublishedCatalogue,
  markPurchaseCompleted,
  registerFileAsset,
  recordDownload,
  resetMarketplaceState,
  createPendingPurchase,
  finalizeWork,
  ListingConfiguration,
  publishWork,
} from "@/lib/marketplaceStore";
import { BuyerLibraryEntry, FileAssetWithData, PurchaseRecord } from "@/types";

export function uploadAsset(workId: string, asset: FileAssetInput): FileAssetWithData {
  return registerFileAsset(workId, asset);
}

export function finalizeListing(workId: string) {
  return finalizeWork(workId);
}

export function updateListing(workId: string, config: ListingConfiguration) {
  return configureListing(workId, config);
}

export function publishListing(workId: string) {
  return publishWork(workId);
}

export function listCatalogue() {
  return listPublishedCatalogue();
}

export async function startCheckoutSession(options: {
  workId: string;
  buyerEmail: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const work = getWorkById(options.workId);
  if (!work) {
    throw new Error("Work not found");
  }

  const marketplace = work.marketplace;
  if (!marketplace || marketplace.status !== "published" || !marketplace.priceCents) {
    throw new Error("Work is not available for purchase");
  }

  const session = await stripeService.createCheckoutSession({
    workId: work.id,
    workTitle: marketplace.listingTitle ?? work.title,
    priceCents: marketplace.priceCents,
    buyerEmail: options.buyerEmail,
    successUrl: options.successUrl,
    cancelUrl: options.cancelUrl,
  });

  const purchase = createPendingPurchase({
    workId: work.id,
    buyerEmail: options.buyerEmail,
    stripeSessionId: session.id,
    amountCents: marketplace.priceCents,
  });

  return {
    checkoutSessionId: session.id,
    checkoutUrl: session.url,
    purchase,
  };
}

export async function handleStripeWebhook(payload: Buffer, signature?: string) {
  const event = stripeService.constructEvent(signature, payload) as {
    type?: string;
    data?: { object?: { id?: string } };
  };

  if (!event || !event.type) {
    throw new Error("Invalid Stripe webhook event");
  }

  if (event.type === "checkout.session.completed") {
    const sessionId = event.data?.object?.id;
    if (!sessionId) {
      throw new Error("Checkout session completed event missing identifier");
    }
    markPurchaseCompleted(sessionId);
  }
}

export function getBuyerLibrary(buyerEmail: string): BuyerLibraryEntry[] {
  return buildBuyerLibrary(buyerEmail);
}

export function getPurchaseDownload(purchaseId: string, token: string) {
  const purchase = getPurchaseById(purchaseId);
  if (!purchase) {
    throw new Error("Purchase not found");
  }
  if (purchase.status !== "completed") {
    throw new Error("Purchase is not fulfilled");
  }
  if (purchase.downloadToken !== token) {
    throw new Error("Invalid download token");
  }

  const work = getWorkById(purchase.workId);
  if (!work || !work.marketplace?.fileAssetId) {
    throw new Error("Work asset is unavailable");
  }
  const asset = getAssetById(work.marketplace.fileAssetId);
  if (!asset) {
    throw new Error("File asset not found");
  }

  const updatedPurchase: PurchaseRecord = recordDownload(purchaseId);

  return {
    asset,
    purchase: updatedPurchase,
    work,
  };
}

export function resetMarketplace() {
  resetMarketplaceState();
}
