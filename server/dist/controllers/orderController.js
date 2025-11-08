"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrderController = createOrderController;
const http_status_codes_1 = require("http-status-codes");
const mongoose_1 = __importDefault(require("mongoose"));
const zod_1 = require("zod");
const models_1 = require("../models");
const orderValidation_1 = require("../validation/orderValidation");
const { Types } = mongoose_1.default;
const formatValidationError = (error) => ({
    message: "Validation error",
    status: http_status_codes_1.StatusCodes.BAD_REQUEST,
    errors: error.issues.map((err) => ({
        field: err.path.join("."),
        message: err.message,
    })),
});
const formatError = (message, status = http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR) => ({
    message,
    status,
});
function createOrderController() {
    const getBookCheckout = async (req, res) => {
        try {
            const { userId } = req.user;
            const { id: bookId } = orderValidation_1.idParamsSchema.parse(req.params);
            // Find the book and ensure it's published
            const book = await models_1.Book.findById(bookId).populate("writerId");
            if (!book) {
                return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json(formatError("Book not found"));
            }
            if (book.status !== "published") {
                return res.status(http_status_codes_1.StatusCodes.FORBIDDEN).json(formatError("Book is not available for purchase"));
            }
            // Type assertion for populated writer
            const writer = book.writerId;
            // Check if user already purchased this book
            const existingOrder = await models_1.Order.findOne({
                userId: new Types.ObjectId(userId),
                bookId: new Types.ObjectId(bookId),
                status: "paid",
            });
            const response = {
                book: {
                    id: book._id.toString(),
                    title: book.title,
                    description: book.description,
                    price: book.price,
                    coverImage: book.coverImage,
                },
                writer: {
                    id: writer._id.toString(),
                    username: writer.username,
                    profile: writer.profile,
                    bio: writer.bio,
                    avatar: writer.avatar,
                },
                isPurchased: !!existingOrder,
            };
            res.status(http_status_codes_1.StatusCodes.OK).json(response);
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json(formatValidationError(error));
            }
            console.error("Error getting book checkout:", error);
            res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json(formatError("Failed to get checkout information"));
        }
    };
    const createOrder = async (req, res) => {
        try {
            const { userId } = req.user;
            const { bookId } = orderValidation_1.createOrderSchema.parse(req.body);
            // Find the book and ensure it's published
            const book = await models_1.Book.findById(bookId);
            if (!book) {
                return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json(formatError("Book not found"));
            }
            if (book.status !== "published") {
                return res.status(http_status_codes_1.StatusCodes.FORBIDDEN).json(formatError("Book is not available for purchase"));
            }
            // Check if user already has a paid order for this book
            const existingPaidOrder = await models_1.Order.findOne({
                userId: new Types.ObjectId(userId),
                bookId: new Types.ObjectId(bookId),
                status: "paid",
            });
            if (existingPaidOrder) {
                return res.status(http_status_codes_1.StatusCodes.CONFLICT).json(formatError("You have already purchased this book"));
            }
            // Check for existing pending order and update it, or create new one
            let order = await models_1.Order.findOne({
                userId: new Types.ObjectId(userId),
                bookId: new Types.ObjectId(bookId),
                status: "pending",
            });
            if (order) {
                // Update existing pending order with current price
                order.price = book.price;
                await order.save();
            }
            else {
                // Create new order
                order = new models_1.Order({
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
            res.status(http_status_codes_1.StatusCodes.CREATED).json({
                id: order._id.toString(),
                bookId: order.bookId.toString(),
                writerId: order.writerId.toString(),
                price: order.price,
                status: order.status,
                clientSecret: `pi_${order._id.toString()}_secret_${Date.now()}`, // Placeholder for Stripe
                createdAt: order.createdAt.toISOString(),
                updatedAt: order.updatedAt.toISOString(),
            });
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json(formatValidationError(error));
            }
            console.error("Error creating order:", error);
            res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json(formatError("Failed to create order"));
        }
    };
    const getUserOrders = async (req, res) => {
        try {
            const { userId } = req.user;
            const { page = 1, limit = 10 } = orderValidation_1.paginationQuerySchema.parse(req.query);
            const skip = (page - 1) * limit;
            const orders = await models_1.Order.find({ userId: new Types.ObjectId(userId) })
                .populate("bookId")
                .populate("writerId")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);
            const total = await models_1.Order.countDocuments({ userId: new Types.ObjectId(userId) });
            const orderResponses = orders.map((order) => {
                const book = order.bookId;
                const writer = order.writerId;
                return {
                    id: order._id.toString(),
                    book: {
                        id: book._id.toString(),
                        title: book.title,
                        coverImage: book.coverImage,
                    },
                    writer: {
                        id: writer._id.toString(),
                        username: writer.username,
                    },
                    price: order.price,
                    status: order.status,
                    createdAt: order.createdAt.toISOString(),
                    updatedAt: order.updatedAt.toISOString(),
                };
            });
            res.status(http_status_codes_1.StatusCodes.OK).json({
                orders: orderResponses,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            });
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json(formatValidationError(error));
            }
            console.error("Error getting user orders:", error);
            res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json(formatError("Failed to get orders"));
        }
    };
    const getUserPurchases = async (req, res) => {
        try {
            const { userId } = req.user;
            const { page = 1, limit = 10 } = orderValidation_1.paginationQuerySchema.parse(req.query);
            const skip = (page - 1) * limit;
            const orders = await models_1.Order.find({
                userId: new Types.ObjectId(userId),
                status: "paid",
            })
                .populate("bookId")
                .populate("writerId")
                .sort({ updatedAt: -1 })
                .skip(skip)
                .limit(limit);
            const total = await models_1.Order.countDocuments({
                userId: new Types.ObjectId(userId),
                status: "paid",
            });
            const purchaseResponses = orders.map((order) => {
                const book = order.bookId;
                const writer = order.writerId;
                return {
                    id: book._id.toString(),
                    title: book.title,
                    description: book.description,
                    price: order.price,
                    coverImage: book.coverImage,
                    writer: {
                        id: writer._id.toString(),
                        username: writer.username,
                        profile: writer.profile,
                        bio: writer.bio,
                        avatar: writer.avatar,
                    },
                    purchasedAt: order.updatedAt.toISOString(),
                };
            });
            res.status(http_status_codes_1.StatusCodes.OK).json({
                purchases: purchaseResponses,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            });
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json(formatValidationError(error));
            }
            console.error("Error getting user purchases:", error);
            res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json(formatError("Failed to get purchases"));
        }
    };
    const handleStripeWebhook = async (req, res) => {
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
            res.status(http_status_codes_1.StatusCodes.OK).json({ received: true });
        }
        catch (error) {
            console.error("Error handling Stripe webhook:", error);
            res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json(formatError("Webhook handler failed"));
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
//# sourceMappingURL=orderController.js.map