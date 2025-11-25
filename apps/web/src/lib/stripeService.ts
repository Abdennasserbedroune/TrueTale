import type Stripe from "stripe";
import { randomUUID } from "crypto";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

type CheckoutSessionPayload = {
  workId: string;
  workTitle: string;
  priceCents: number;
  buyerEmail: string;
  successUrl: string;
  cancelUrl: string;
};

type CheckoutSessionResult = {
  id: string;
  url: string;
};

class StripeService {
  private readonly stripe?: Stripe;
  private readonly mode: "live" | "test";

  constructor() {
    if (stripeSecretKey) {
      // Lazy require to avoid bundling Stripe in test mode when not needed.
      // eslint-disable-next-line @typescript-eslint/no-var-requires -- dynamic import for optional dependency
      const StripeConstructor = require("stripe") as typeof Stripe;
      this.stripe = new StripeConstructor(stripeSecretKey, {
        apiVersion: "2025-11-17.clover",
      });
      this.mode = "live";
    } else {
      this.mode = "test";
    }
  }

  getMode(): "live" | "test" {
    return this.mode;
  }

  async createCheckoutSession(payload: CheckoutSessionPayload): Promise<CheckoutSessionResult> {
    if (this.stripe) {
      const session = await this.stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: payload.buyerEmail,
        metadata: {
          workId: payload.workId,
          buyerEmail: payload.buyerEmail,
        },
        success_url: payload.successUrl,
        cancel_url: payload.cancelUrl,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "usd",
              unit_amount: payload.priceCents,
              product_data: {
                name: payload.workTitle,
              },
            },
          },
        ],
      });

      if (!session.url) {
        throw new Error("Stripe did not return a checkout session URL");
      }

      return { id: session.id, url: session.url };
    }

    const sessionId = `cs_test_${randomUUID()}`;
    return {
      id: sessionId,
      url: `https://checkout.stripe.test/session/${sessionId}`,
    };
  }

  constructEvent(signature: string | undefined, payload: Buffer): unknown {
    if (this.stripe && webhookSecret) {
      return this.stripe.webhooks.constructEvent(payload, signature ?? "", webhookSecret);
    }

    try {
      return JSON.parse(payload.toString("utf8"));
    } catch (error) {
      throw new Error("Invalid webhook payload");
    }
  }
}

export const stripeService = new StripeService();
export type { CheckoutSessionPayload, CheckoutSessionResult };
