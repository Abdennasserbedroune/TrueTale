import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import Stripe from "stripe";
import AWS from "aws-sdk";
import { ZodError } from "zod";
import { Book, Order, User, IBook, IOrder, IUser } from "@truetale/db";
import { createOrderSchema, paginationQuerySchema, idParamsSchema } from "../validation/orderValidation";
import { EnvConfig } from "../config/env";

const { Types } = mongoose;

type ValidationIssue = {
  field: string;
  message: string;
};

type ValidationErrorResponse = {
  message: string;
  errors: ValidationIssue[];
  status: number;
};

type ErrorResponse = {
  message: string;
  status: number;
};

type CheckoutResponse = {
  book: {
    id: string;
    title: string;
    description: string;
    price: number;
    coverImage?: string;
  };
  writer: {
    id: string;
    username: string;
    profile?: string;
    bio?: string;
    avatar?: string;
  };
  isPurchased: boolean;
};

type OrderResponse = {
  id: string;
  book: {
    id: string;
    title: string;
    coverImage?: string;
  };
  writer: {
    id: string;
    username: string;
  };
  price: number;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type PurchaseResponse = {
  id: string;
  title: string;
  description: string;
  price: number;
  coverImage?: string;
  writer: {
    id: string;
    username: string;
    profile?: string;
    bio?: string;
    avatar?: string;
  };
  purchasedAt: string;
  downloadUrl?: string;
};

const formatValidationError = (error: ZodError): ValidationErrorResponse => ({
  message: "Validation error",
  status: StatusCodes.BAD_REQUEST,
  errors: error.issues.map((err) => ({
    field: err.path.join("."),
    message: err.message,
  })),
});

const formatError = (message: string, status: number = StatusCodes.INTERNAL_SERVER_ERROR): ErrorResponse => ({
  message,
  status,
});

export function createOrderController(config: EnvConfig) {
  const stripe = new Stripe(config.stripeSecretKey || "", { apiVersion: "2025-11-17.clover" });
  const s3 = new AWS.S3({
    accessKeyId: config.awsAccessKeyId,
    secretAccessKey: config.awsSecretAccessKey,
    region: config.awsRegion,
  });

  const getBookCheckout = async (req: Request, res: Response) => {
    try {
      const { userId } = req.user!;
      const { id: bookId } = idParamsSchema.parse(req.params);

      const book = await Book.findById(bookId).populate("authorId");
      if (!book) {
        return res.status(StatusCodes.NOT_FOUND).json(formatError("Book not found"));
      }

      if (book.status !== "published") {
        return res.status(StatusCodes.FORBIDDEN).json(formatError("Book is not available for purchase"));
      }

      const writer = (book.authorId as any) as IUser;

      const existingOrder = await Order.findOne({
        userId: new Types.ObjectId(userId),
        bookId: new Types.ObjectId(bookId),
        status: "paid",
      });

      const response: CheckoutResponse = {
        book: {
          id: (book._id as any).toString(),
          title: book.title,
          description: book.description,
          price: book.priceCents / 100,
          coverImage: book.coverUrl || book.coverImage,
        },
        writer: {
          id: (writer._id as any).toString(),
          username: writer.username,
          profile: writer.profile,
          bio: writer.bio,
          avatar: writer.avatar,
        },
        isPurchased: !!existingOrder,
      };

      res.status(StatusCodes.OK).json(response);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(StatusCodes.BAD_REQUEST).json(formatValidationError(error));
      }
      console.error("Error getting book checkout:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(formatError("Failed to get checkout information"));
    }
  };

  const createOrder = async (req: Request, res: Response) => {
    try {
      const { userId } = req.user!;
      const { bookId } = createOrderSchema.parse(req.body);

      const book = await Book.findById(bookId);
      if (!book) {
        return res.status(StatusCodes.NOT_FOUND).json(formatError("Book not found"));
      }

      if (book.status !== "published") {
        return res.status(StatusCodes.FORBIDDEN).json(formatError("Book is not available for purchase"));
      }

      const existingPaidOrder = await Order.findOne({
        userId: new Types.ObjectId(userId),
        bookId: new Types.ObjectId(bookId),
        status: "paid",
      });

      if (existingPaidOrder) {
        return res.status(StatusCodes.CONFLICT).json(formatError("You have already purchased this book"));
      }

      const platformFeePercent = config.platformFeePercent / 100;
      const platformFeeCents = Math.round(book.priceCents * platformFeePercent);
      const sellerProceedsCents = book.priceCents - platformFeeCents;

      const paymentIntent = await stripe.paymentIntents.create({
        amount: book.priceCents,
        currency: book.currency.toLowerCase(),
        metadata: {
          bookId: bookId.toString(),
          userId: userId.toString(),
          writerId: book.authorId.toString(),
        },
      });

      let order = await Order.findOne({
        userId: new Types.ObjectId(userId),
        bookId: new Types.ObjectId(bookId),
        status: "pending",
      });

      if (order) {
        order.price = book.priceCents / 100;
        order.amountCents = book.priceCents;
        order.currency = book.currency;
        order.stripePaymentIntentId = paymentIntent.id;
        order.platformFeeCents = platformFeeCents;
        order.sellerProceedsCents = sellerProceedsCents;
        await order.save();
      } else {
        order = new Order({
          userId: new Types.ObjectId(userId),
          bookId: new Types.ObjectId(bookId),
          writerId: book.authorId,
          price: book.priceCents / 100,
          amountCents: book.priceCents,
          currency: book.currency,
          stripePaymentIntentId: paymentIntent.id,
          status: "pending",
          platformFeeCents,
          sellerProceedsCents,
        });
        await order.save();
      }

      res.status(StatusCodes.CREATED).json({
        orderId: (order._id as any).toString(),
        clientSecret: paymentIntent.client_secret,
        amountCents: book.priceCents,
        bookTitle: book.title,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(StatusCodes.BAD_REQUEST).json(formatValidationError(error));
      }
      console.error("Error creating order:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(formatError("Failed to create order"));
    }
  };

  const getOrder = async (req: Request, res: Response) => {
    try {
      const { id } = idParamsSchema.parse(req.params);

      const order = await Order.findById(id).populate("bookId", "title");
      if (!order) {
        return res.status(StatusCodes.NOT_FOUND).json(formatError("Order not found"));
      }

      res.status(StatusCodes.OK).json(order);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(StatusCodes.BAD_REQUEST).json(formatValidationError(error));
      }
      console.error("Error fetching order:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(formatError("Failed to fetch order"));
    }
  };

  const handlePaymentSucceeded = async (paymentIntent: Stripe.PaymentIntent) => {
    const order = await Order.findOneAndUpdate(
      { stripePaymentIntentId: paymentIntent.id, status: "pending" },
      { status: "paid", updatedAt: new Date() },
      { new: true }
    );

    if (!order) return;

    const book = await Book.findById(order.bookId);
    if (!book || !book.files.length) return;

    const file = book.files.find(f => f.type !== "sample") || book.files[0];
    if (!file) return;

    let downloadUrl = "";
    if (config.awsS3Bucket && config.awsAccessKeyId) {
      const s3Key = file.url.split("/").slice(-1)[0];
      downloadUrl = s3.getSignedUrl("getObject", {
        Bucket: config.awsS3Bucket,
        Key: s3Key,
        Expires: 24 * 60 * 60,
      });
    } else {
      downloadUrl = file.url;
    }

    await Order.updateOne(
      { _id: order._id },
      {
        downloadUrl,
        downloadUrlExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      }
    );

    await Book.updateOne({ _id: order.bookId }, { $inc: { "stats.sales": 1 } });
  };

  const handleStripeWebhook = async (req: Request, res: Response) => {
    const sig = req.headers["stripe-signature"];
    if (!sig) {
      return res.status(StatusCodes.BAD_REQUEST).json(formatError("Missing Stripe signature"));
    }

    let event: Stripe.Event;

    try {
      if (config.stripeWebhookSecret) {
        event = stripe.webhooks.constructEvent(
          req.body,
          sig as string,
          config.stripeWebhookSecret
        );
      } else {
        console.warn("Stripe webhook secret not configured, skipping signature validation");
        event = JSON.parse(req.body.toString());
      }
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(StatusCodes.BAD_REQUEST).json(formatError(`Webhook error: ${err.message}`));
    }

    try {
      switch (event.type) {
        case "payment_intent.succeeded": {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          await handlePaymentSucceeded(paymentIntent);
          break;
        }
        case "payment_intent.payment_failed": {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          await Order.updateOne(
            { stripePaymentIntentId: paymentIntent.id },
            { status: "failed" }
          );
          break;
        }
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.status(StatusCodes.OK).json({ received: true });
    } catch (error) {
      console.error("Webhook processing failed:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(formatError("Webhook processing failed"));
    }
  };

  const getUserOrders = async (req: Request, res: Response) => {
    try {
      const { userId } = req.user!;
      const { page = 1, limit = 10 } = paginationQuerySchema.parse(req.query);

      const skip = (page - 1) * limit;

      const orders = await Order.find({ userId: new Types.ObjectId(userId) })
        .populate("bookId")
        .populate("writerId")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Order.countDocuments({ userId: new Types.ObjectId(userId) });

      const orderResponses: OrderResponse[] = orders.map((order) => {
        const book = (order.bookId as any) as IBook;
        const writer = (order.writerId as any) as IUser;
        return {
          id: (order._id as any).toString(),
          book: {
            id: (book._id as any).toString(),
            title: book.title,
            coverImage: book.coverUrl || book.coverImage,
          },
          writer: {
            id: (writer._id as any).toString(),
            username: writer.username,
          },
          price: order.price,
          status: order.status,
          createdAt: order.createdAt.toISOString(),
          updatedAt: order.updatedAt.toISOString(),
        };
      });

      res.status(StatusCodes.OK).json({
        orders: orderResponses,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(StatusCodes.BAD_REQUEST).json(formatValidationError(error));
      }
      console.error("Error getting user orders:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(formatError("Failed to get orders"));
    }
  };

  const getUserPurchases = async (req: Request, res: Response) => {
    try {
      const { userId } = req.user!;
      const { page = 1, limit = 10 } = paginationQuerySchema.parse(req.query);

      const skip = (page - 1) * limit;

      const orders = await Order.find({
        userId: new Types.ObjectId(userId),
        status: "paid",
      })
        .populate("bookId")
        .populate("writerId")
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Order.countDocuments({
        userId: new Types.ObjectId(userId),
        status: "paid",
      });

      const purchaseResponses: PurchaseResponse[] = orders.map((order) => {
        const book = (order.bookId as any) as IBook;
        const writer = (order.writerId as any) as IUser;
        return {
          id: (book._id as any).toString(),
          title: book.title,
          description: book.description,
          price: order.price,
          coverImage: book.coverUrl || book.coverImage,
          writer: {
            id: (writer._id as any).toString(),
            username: writer.username,
            profile: writer.profile,
            bio: writer.bio,
            avatar: writer.avatar,
          },
          purchasedAt: order.updatedAt.toISOString(),
          downloadUrl: order.downloadUrl,
        };
      });

      res.status(StatusCodes.OK).json({
        purchases: purchaseResponses,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(StatusCodes.BAD_REQUEST).json(formatValidationError(error));
      }
      console.error("Error getting user purchases:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(formatError("Failed to get purchases"));
    }
  };

  const getSellerOrders = async (req: Request, res: Response) => {
    try {
      const { userId } = req.user!;
      const { page = 1, limit = 10 } = paginationQuerySchema.parse(req.query);

      const skip = (page - 1) * limit;

      const orders = await Order.find({ writerId: new Types.ObjectId(userId), status: "paid" })
        .populate("bookId", "title")
        .populate("userId", "name email username")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Order.countDocuments({ writerId: new Types.ObjectId(userId), status: "paid" });

      res.status(StatusCodes.OK).json({
        data: orders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(StatusCodes.BAD_REQUEST).json(formatValidationError(error));
      }
      console.error("Error getting seller orders:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(formatError("Failed to fetch seller orders"));
    }
  };

  const getSellerEarnings = async (req: Request, res: Response) => {
    try {
      const { userId } = req.user!;

      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);

      const [totalStats, monthlyStats] = await Promise.all([
        Order.aggregate([
          { $match: { writerId: new Types.ObjectId(userId), status: "paid" } },
          { $group: { _id: null, total: { $sum: "$sellerProceedsCents" }, count: { $sum: 1 } } },
        ]),
        Order.aggregate([
          {
            $match: {
              writerId: new Types.ObjectId(userId),
              status: "paid",
              createdAt: { $gte: thisMonth },
            },
          },
          { $group: { _id: null, total: { $sum: "$sellerProceedsCents" }, count: { $sum: 1 } } },
        ]),
      ]);

      const pendingOrders = await Order.countDocuments({ writerId: new Types.ObjectId(userId), status: "pending" });

      res.status(StatusCodes.OK).json({
        totalEarnings: totalStats[0]?.total || 0,
        totalSales: totalStats[0]?.count || 0,
        monthlyEarnings: monthlyStats[0]?.total || 0,
        monthlySales: monthlyStats[0]?.count || 0,
        pendingOrders,
      });
    } catch (error) {
      console.error("Error getting seller earnings:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(formatError("Failed to fetch earnings"));
    }
  };

  return {
    getBookCheckout,
    createOrder,
    getOrder,
    getUserOrders,
    getUserPurchases,
    getSellerOrders,
    getSellerEarnings,
    handleStripeWebhook,
  };
}
