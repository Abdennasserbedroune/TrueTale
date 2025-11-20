import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import { ZodError } from "zod";
import { Book, Order, User, IBook, IOrder, IUser } from "../models";
import { createOrderSchema, paginationQuerySchema, idParamsSchema } from "../validation/authValidation";

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

export function createOrderController() {
  const getBookCheckout = async (req: Request, res: Response) => {
    try {
      const { userId } = req.user!;
      const { id: bookId } = idParamsSchema.parse(req.params);

      // Find the book and ensure it's published
      const book = await Book.findById(bookId).populate("writerId");
      if (!book) {
        return res.status(StatusCodes.NOT_FOUND).json(formatError("Book not found"));
      }

      if (book.status !== "published") {
        return res.status(StatusCodes.FORBIDDEN).json(formatError("Book is not available for purchase"));
      }

      // Type assertion for populated writer
      const writer = (book.writerId as any) as IUser;

      // Check if user already purchased this book
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
          price: book.price,
          coverImage: book.coverImage,
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

      // Find the book and ensure it's published
      const book = await Book.findById(bookId);
      if (!book) {
        return res.status(StatusCodes.NOT_FOUND).json(formatError("Book not found"));
      }

      if (book.status !== "published") {
        return res.status(StatusCodes.FORBIDDEN).json(formatError("Book is not available for purchase"));
      }

      // Check if user already has a paid order for this book
      const existingPaidOrder = await Order.findOne({
        userId: new Types.ObjectId(userId),
        bookId: new Types.ObjectId(bookId),
        status: "paid",
      });

      if (existingPaidOrder) {
        return res.status(StatusCodes.CONFLICT).json(formatError("You have already purchased this book"));
      }

      // Check for existing pending order and update it, or create new one
      let order = await Order.findOne({
        userId: new Types.ObjectId(userId),
        bookId: new Types.ObjectId(bookId),
        status: "pending",
      });

      if (order) {
        // Update existing pending order with current price
        order.price = book.price;
        await order.save();
      } else {
        // Create new order
        order = new Order({
          userId: new Types.ObjectId(userId),
          bookId: new Types.ObjectId(bookId),
          writerId: book.writerId,
          price: book.price,
          status: "pending",
        });
        await order.save();
      }

      // TODO: Add feed activity for purchase when order is paid
      // await feedService.record({
      //   userId: new Types.ObjectId(userId),
      //   type: "purchase_completed",
      //   metadata: {
      //     bookId: book._id,
      //     writerId: book.writerId,
      //     orderId: order._id,
      //   },
      // });

      res.status(StatusCodes.CREATED).json({
        id: (order._id as any).toString(),
        bookId: order.bookId.toString(),
        writerId: order.writerId.toString(),
        price: order.price,
        status: order.status,
        clientSecret: `pi_${(order._id as any).toString()}_secret_${Date.now()}`, // Placeholder for Stripe
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(StatusCodes.BAD_REQUEST).json(formatValidationError(error));
      }
      console.error("Error creating order:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(formatError("Failed to create order"));
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
            coverImage: book.coverImage,
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
          coverImage: book.coverImage,
          writer: {
            id: (writer._id as any).toString(),
            username: writer.username,
            profile: writer.profile,
            bio: writer.bio,
            avatar: writer.avatar,
          },
          purchasedAt: order.updatedAt.toISOString(),
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

  const handleStripeWebhook = async (req: Request, res: Response) => {
    try {
      // TODO: Implement Stripe signature validation
      // const signature = req.headers["stripe-signature"];
      // if (!signature) {
      //   return res.status(StatusCodes.BAD_REQUEST).json(formatError("Missing Stripe signature"));
      // }
      // 
      // const event = stripe.webhooks.constructEvent(
      //   req.body,
      //   signature,
      //   process.env.STRIPE_WEBHOOK_SECRET!
      // );

      // Log webhook payload for development
      console.log("Stripe webhook received:", {
        headers: req.headers,
        body: req.body,
      });

      // TODO: Handle different event types
      // switch (event.type) {
      //   case "payment_intent.succeeded":
      //     await handlePaymentSuccess(event.data.object);
      //     break;
      //   case "payment_intent.payment_failed":
      //     await handlePaymentFailure(event.data.object);
      //     break;
      //   default:
      //     console.log(`Unhandled event type: ${event.type}`);
      // }

      res.status(StatusCodes.OK).json({ received: true });
    } catch (error) {
      console.error("Error handling Stripe webhook:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(formatError("Webhook handler failed"));
    }
  };

  return {
    getBookCheckout,
    createOrder,
    getUserOrders,
    getUserPurchases,
    handleStripeWebhook,
  };
}