"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReaderController = createReaderController;
const http_status_codes_1 = require("http-status-codes");
const mongoose_1 = __importDefault(require("mongoose"));
const models_1 = require("../models");
const readerValidation_1 = require("../validation/readerValidation");
const { Types } = mongoose_1.default;
const formatValidationError = (error) => ({
    message: "Validation error",
    status: http_status_codes_1.StatusCodes.BAD_REQUEST,
    errors: error.errors.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
    })),
});
const sendErrorResponse = (res, error) => {
    res.status(error.status).json(error);
};
const isValidObjectId = (value) => Types.ObjectId.isValid(value);
const serializeProfile = (user) => ({
    id: user._id.toString(),
    email: user.email,
    username: user.username,
    role: user.role,
    profile: user.profile,
    bio: user.bio,
    avatar: user.avatar,
    socials: user.socials,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
});
const buildWriterSummary = (writer, followersCount, publishedBooks, fallbackId) => ({
    id: writer ? writer._id.toString() : fallbackId ?? "",
    username: writer?.username ?? "Unknown writer",
    profile: writer?.profile ?? null,
    bio: writer?.bio ?? null,
    avatar: writer?.avatar ?? null,
    followersCount,
    ...(typeof publishedBooks === "number" ? { publishedBooks } : {}),
});
const buildReviewResponse = (review, user) => {
    let derivedUser = user;
    if (!derivedUser) {
        const reviewUser = review.userId;
        if (typeof reviewUser === "string") {
            derivedUser = { id: reviewUser, username: "" };
        }
        else if (reviewUser instanceof mongoose_1.default.Types.ObjectId) {
            derivedUser = { id: reviewUser.toString(), username: "" };
        }
        else {
            const populatedUser = reviewUser;
            const populatedId = populatedUser._id instanceof mongoose_1.default.Types.ObjectId
                ? populatedUser._id.toString()
                : String(populatedUser._id);
            derivedUser = {
                id: populatedId,
                username: populatedUser.username ?? "",
                avatar: populatedUser.avatar ?? null,
            };
        }
    }
    const responseUser = derivedUser ?? { id: "", username: "" };
    return {
        id: review._id.toString(),
        rating: review.rating,
        reviewText: review.reviewText,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
        user: responseUser,
    };
};
async function recalculateBookAggregates(bookId) {
    const stats = await models_1.Review.aggregate([
        { $match: { bookId } },
        {
            $group: {
                _id: "$bookId",
                averageRating: { $avg: "$rating" },
                reviewCount: { $sum: 1 },
            },
        },
    ]);
    const computedStats = stats[0];
    const averageRating = computedStats ? Math.round(computedStats.averageRating * 100) / 100 : 0;
    const reviewCount = computedStats ? computedStats.reviewCount : 0;
    await models_1.Book.findByIdAndUpdate(bookId, {
        averageRating,
        reviewCount,
    });
}
function createReaderController(feedService) {
    const listBooks = async (req, res) => {
        try {
            const parseResult = readerValidation_1.browseBooksQuerySchema.safeParse(req.query);
            if (!parseResult.success) {
                res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json(formatValidationError(parseResult.error));
                return;
            }
            const { page, limit, search, category, genre, writerId, minRating, maxRating, minPrice, maxPrice, sort, } = parseResult.data;
            const match = { status: "published" };
            if (search) {
                match.$or = [
                    { title: { $regex: search, $options: "i" } },
                    { description: { $regex: search, $options: "i" } },
                ];
            }
            if (category) {
                match.category = category;
            }
            if (genre) {
                match.genres = { $in: [genre] };
            }
            if (writerId) {
                match.writerId = new Types.ObjectId(writerId);
            }
            if (minRating !== undefined || maxRating !== undefined) {
                const ratingFilter = {};
                if (minRating !== undefined) {
                    ratingFilter.$gte = minRating;
                }
                if (maxRating !== undefined) {
                    ratingFilter.$lte = maxRating;
                }
                match.averageRating = ratingFilter;
            }
            if (minPrice !== undefined || maxPrice !== undefined) {
                const priceFilter = {};
                if (minPrice !== undefined) {
                    priceFilter.$gte = minPrice;
                }
                if (maxPrice !== undefined) {
                    priceFilter.$lte = maxPrice;
                }
                match.price = priceFilter;
            }
            const sortOptions = {
                recent: { publishedAt: -1, createdAt: -1 },
                rating_desc: { averageRating: -1, reviewCount: -1, publishedAt: -1 },
                rating_asc: { averageRating: 1, publishedAt: -1 },
                price_desc: { price: -1, publishedAt: -1 },
                price_asc: { price: 1, publishedAt: -1 },
            };
            const sortSpec = sortOptions[sort] ?? sortOptions.recent;
            const skip = (page - 1) * limit;
            const [books, total] = await Promise.all([
                models_1.Book.find(match).sort(sortSpec).skip(skip).limit(limit),
                models_1.Book.countDocuments(match),
            ]);
            const writerIds = Array.from(new Set(books.map((book) => book.writerId.toString())));
            const writerObjectIds = writerIds.map((id) => new Types.ObjectId(id));
            const [writers, followerCounts] = await Promise.all([
                writerObjectIds.length
                    ? models_1.User.find({ _id: { $in: writerObjectIds } })
                    : Promise.resolve([]),
                writerObjectIds.length
                    ? models_1.Follow.aggregate([
                        { $match: { followingId: { $in: writerObjectIds } } },
                        {
                            $group: {
                                _id: "$followingId",
                                count: { $sum: 1 },
                            },
                        },
                    ])
                    : Promise.resolve([]),
            ]);
            const writersMap = new Map(writers.map((writer) => [writer._id.toString(), writer]));
            const followerCountsMap = new Map(followerCounts.map((entry) => [entry._id.toString(), entry.count]));
            const data = books.map((book) => {
                const writer = writersMap.get(book.writerId.toString()) ?? null;
                const followersCount = followerCountsMap.get(book.writerId.toString()) ?? 0;
                return {
                    id: book._id.toString(),
                    title: book.title,
                    description: book.description,
                    category: book.category,
                    price: book.price,
                    coverImage: book.coverImage,
                    genres: book.genres,
                    language: book.language,
                    pages: book.pages,
                    averageRating: book.averageRating,
                    reviewCount: book.reviewCount,
                    publishedAt: book.publishedAt,
                    writer: buildWriterSummary(writer, followersCount, undefined, book.writerId.toString()),
                };
            });
            const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
            res.status(http_status_codes_1.StatusCodes.OK).json({
                data,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages,
                },
            });
        }
        catch (error) {
            console.error("[READER] List books error:", error);
            sendErrorResponse(res, {
                message: "Failed to fetch books",
                status: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    };
    const getBookDetail = async (req, res) => {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            sendErrorResponse(res, {
                message: "Invalid book id",
                status: http_status_codes_1.StatusCodes.BAD_REQUEST,
            });
            return;
        }
        const parseResult = readerValidation_1.paginationQuerySchema.safeParse(req.query);
        if (!parseResult.success) {
            res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json(formatValidationError(parseResult.error));
            return;
        }
        const { page, limit } = parseResult.data;
        try {
            const book = await models_1.Book.findOne({ _id: id, status: "published" });
            if (!book) {
                sendErrorResponse(res, {
                    message: "Book not found",
                    status: http_status_codes_1.StatusCodes.NOT_FOUND,
                });
                return;
            }
            const [writer, followersCount, publishedBooks] = await Promise.all([
                models_1.User.findById(book.writerId),
                models_1.Follow.countDocuments({ followingId: book.writerId }),
                models_1.Book.countDocuments({ writerId: book.writerId, status: "published" }),
            ]);
            const [reviews, stats, distribution] = await Promise.all([
                models_1.Review.find({ bookId: book._id })
                    .populate("userId", "username avatar")
                    .sort({ createdAt: -1 })
                    .skip((page - 1) * limit)
                    .limit(limit),
                models_1.Review.aggregate([
                    { $match: { bookId: book._id } },
                    {
                        $group: {
                            _id: "$bookId",
                            averageRating: { $avg: "$rating" },
                            reviewCount: { $sum: 1 },
                        },
                    },
                ]),
                models_1.Review.aggregate([
                    { $match: { bookId: book._id } },
                    {
                        $group: {
                            _id: "$rating",
                            count: { $sum: 1 },
                        },
                    },
                ]),
            ]);
            const statsDoc = stats[0];
            const reviewCount = statsDoc ? statsDoc.reviewCount : 0;
            const averageRating = statsDoc ? Math.round(statsDoc.averageRating * 100) / 100 : 0;
            const distributionMap = {
                "1": 0,
                "2": 0,
                "3": 0,
                "4": 0,
                "5": 0,
            };
            distribution.forEach((entry) => {
                distributionMap[String(entry._id)] = entry.count;
            });
            const reviewData = reviews.map((review) => {
                const reviewer = review.userId;
                return buildReviewResponse(review, {
                    id: reviewer._id.toString(),
                    username: reviewer.username,
                    avatar: reviewer.avatar,
                });
            });
            const totalPages = reviewCount === 0 ? 0 : Math.ceil(reviewCount / limit);
            res.status(http_status_codes_1.StatusCodes.OK).json({
                book: {
                    id: book._id.toString(),
                    title: book.title,
                    description: book.description,
                    category: book.category,
                    price: book.price,
                    coverImage: book.coverImage,
                    genres: book.genres,
                    language: book.language,
                    pages: book.pages,
                    averageRating: book.averageRating,
                    reviewCount: book.reviewCount,
                    publishedAt: book.publishedAt,
                    writer: buildWriterSummary(writer ?? null, followersCount, publishedBooks, book.writerId.toString()),
                },
                reviews: {
                    data: reviewData,
                    pagination: {
                        page,
                        limit,
                        total: reviewCount,
                        totalPages,
                    },
                    stats: {
                        averageRating,
                        reviewCount,
                        distribution: distributionMap,
                    },
                },
            });
        }
        catch (error) {
            console.error("[READER] Get book detail error:", error);
            sendErrorResponse(res, {
                message: "Failed to fetch book",
                status: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    };
    const upsertReview = async (req, res) => {
        if (!req.user) {
            sendErrorResponse(res, {
                message: "Authentication required",
                status: http_status_codes_1.StatusCodes.UNAUTHORIZED,
            });
            return;
        }
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            sendErrorResponse(res, {
                message: "Invalid book id",
                status: http_status_codes_1.StatusCodes.BAD_REQUEST,
            });
            return;
        }
        const parseResult = readerValidation_1.reviewMutationSchema.safeParse(req.body);
        if (!parseResult.success) {
            res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json(formatValidationError(parseResult.error));
            return;
        }
        const { rating, reviewText } = parseResult.data;
        try {
            const book = await models_1.Book.findOne({ _id: id, status: "published" });
            if (!book) {
                sendErrorResponse(res, {
                    message: "Book not found",
                    status: http_status_codes_1.StatusCodes.NOT_FOUND,
                });
                return;
            }
            const userId = new Types.ObjectId(req.user.userId);
            if (book.writerId.equals(userId)) {
                sendErrorResponse(res, {
                    message: "Writers cannot review their own books",
                    status: http_status_codes_1.StatusCodes.FORBIDDEN,
                });
                return;
            }
            const existingReview = await models_1.Review.findOne({ userId, bookId: book._id });
            let review = existingReview;
            let created = false;
            if (review) {
                review.rating = rating;
                review.reviewText = reviewText;
            }
            else {
                review = new models_1.Review({
                    userId,
                    bookId: book._id,
                    rating,
                    reviewText,
                });
                created = true;
            }
            await review.save();
            if (created) {
                await feedService.record("review_created", {
                    userId: req.user.userId,
                    targetId: book._id.toString(),
                    metadata: { rating },
                });
            }
            const status = created ? http_status_codes_1.StatusCodes.CREATED : http_status_codes_1.StatusCodes.OK;
            res.status(status).json({
                review: buildReviewResponse(review, {
                    id: req.user.userId,
                    username: req.user.username,
                }),
                message: created ? "Review created" : "Review updated",
            });
        }
        catch (error) {
            console.error("[READER] Upsert review error:", error);
            sendErrorResponse(res, {
                message: "Failed to save review",
                status: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    };
    const getUserReviews = async (req, res) => {
        if (!req.user) {
            sendErrorResponse(res, {
                message: "Authentication required",
                status: http_status_codes_1.StatusCodes.UNAUTHORIZED,
            });
            return;
        }
        const parseResult = readerValidation_1.paginationQuerySchema.safeParse(req.query);
        if (!parseResult.success) {
            res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json(formatValidationError(parseResult.error));
            return;
        }
        const { page, limit } = parseResult.data;
        const userId = new Types.ObjectId(req.user.userId);
        try {
            const [reviews, total] = await Promise.all([
                models_1.Review.find({ userId })
                    .populate("bookId", "title coverImage status writerId averageRating reviewCount")
                    .sort({ createdAt: -1 })
                    .skip((page - 1) * limit)
                    .limit(limit),
                models_1.Review.countDocuments({ userId }),
            ]);
            const data = reviews.map((review) => {
                const bookDoc = review.bookId;
                const bookSummary = bookDoc
                    ? {
                        id: bookDoc._id.toString(),
                        title: bookDoc.title,
                        coverImage: bookDoc.coverImage,
                        status: bookDoc.status,
                        writerId: bookDoc.writerId.toString(),
                        averageRating: bookDoc.averageRating,
                        reviewCount: bookDoc.reviewCount,
                    }
                    : null;
                return {
                    ...buildReviewResponse(review, {
                        id: req.user.userId,
                        username: req.user.username,
                    }),
                    book: bookSummary,
                };
            });
            const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
            res.status(http_status_codes_1.StatusCodes.OK).json({
                data,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages,
                },
            });
        }
        catch (error) {
            console.error("[READER] Get user reviews error:", error);
            sendErrorResponse(res, {
                message: "Failed to fetch reviews",
                status: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    };
    const updateReview = async (req, res) => {
        if (!req.user) {
            sendErrorResponse(res, {
                message: "Authentication required",
                status: http_status_codes_1.StatusCodes.UNAUTHORIZED,
            });
            return;
        }
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            sendErrorResponse(res, {
                message: "Invalid review id",
                status: http_status_codes_1.StatusCodes.BAD_REQUEST,
            });
            return;
        }
        const parseResult = readerValidation_1.updateReviewSchema.safeParse(req.body);
        if (!parseResult.success) {
            res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json(formatValidationError(parseResult.error));
            return;
        }
        try {
            const review = await models_1.Review.findById(id);
            if (!review) {
                sendErrorResponse(res, {
                    message: "Review not found",
                    status: http_status_codes_1.StatusCodes.NOT_FOUND,
                });
                return;
            }
            if (review.userId.toString() !== req.user.userId) {
                sendErrorResponse(res, {
                    message: "You do not have access to this review",
                    status: http_status_codes_1.StatusCodes.FORBIDDEN,
                });
                return;
            }
            const updates = parseResult.data;
            if (Object.prototype.hasOwnProperty.call(updates, "rating")) {
                review.rating = updates.rating;
            }
            if (Object.prototype.hasOwnProperty.call(updates, "reviewText")) {
                review.reviewText = updates.reviewText;
            }
            await review.save();
            res.status(http_status_codes_1.StatusCodes.OK).json({
                review: buildReviewResponse(review, {
                    id: req.user.userId,
                    username: req.user.username,
                }),
            });
        }
        catch (error) {
            console.error("[READER] Update review error:", error);
            sendErrorResponse(res, {
                message: "Failed to update review",
                status: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    };
    const deleteReview = async (req, res) => {
        if (!req.user) {
            sendErrorResponse(res, {
                message: "Authentication required",
                status: http_status_codes_1.StatusCodes.UNAUTHORIZED,
            });
            return;
        }
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            sendErrorResponse(res, {
                message: "Invalid review id",
                status: http_status_codes_1.StatusCodes.BAD_REQUEST,
            });
            return;
        }
        try {
            const review = await models_1.Review.findById(id);
            if (!review) {
                sendErrorResponse(res, {
                    message: "Review not found",
                    status: http_status_codes_1.StatusCodes.NOT_FOUND,
                });
                return;
            }
            if (review.userId.toString() !== req.user.userId) {
                sendErrorResponse(res, {
                    message: "You do not have access to this review",
                    status: http_status_codes_1.StatusCodes.FORBIDDEN,
                });
                return;
            }
            const bookId = review.bookId;
            await review.deleteOne();
            await recalculateBookAggregates(bookId);
            res.status(http_status_codes_1.StatusCodes.NO_CONTENT).send();
        }
        catch (error) {
            console.error("[READER] Delete review error:", error);
            sendErrorResponse(res, {
                message: "Failed to delete review",
                status: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    };
    const followWriter = async (req, res) => {
        if (!req.user) {
            sendErrorResponse(res, {
                message: "Authentication required",
                status: http_status_codes_1.StatusCodes.UNAUTHORIZED,
            });
            return;
        }
        const { writerId } = req.params;
        if (!isValidObjectId(writerId)) {
            sendErrorResponse(res, {
                message: "Invalid writer id",
                status: http_status_codes_1.StatusCodes.BAD_REQUEST,
            });
            return;
        }
        try {
            const writer = await models_1.User.findById(writerId);
            if (!writer) {
                sendErrorResponse(res, {
                    message: "Writer not found",
                    status: http_status_codes_1.StatusCodes.NOT_FOUND,
                });
                return;
            }
            if (writer.role !== "writer") {
                sendErrorResponse(res, {
                    message: "Target user is not a writer",
                    status: http_status_codes_1.StatusCodes.BAD_REQUEST,
                });
                return;
            }
            const followerId = new Types.ObjectId(req.user.userId);
            const followingId = writer._id;
            if (followerId.equals(followingId)) {
                sendErrorResponse(res, {
                    message: "You cannot follow yourself",
                    status: http_status_codes_1.StatusCodes.BAD_REQUEST,
                });
                return;
            }
            const session = await mongoose_1.default.startSession();
            let created = false;
            try {
                await session.withTransaction(async () => {
                    const existingFollow = await models_1.Follow.findOne({
                        followerId,
                        followingId,
                    }).session(session);
                    if (existingFollow) {
                        return;
                    }
                    const follow = new models_1.Follow({
                        followerId,
                        followingId,
                    });
                    await follow.save({ session });
                    created = true;
                    await feedService.record("follow_created", {
                        userId: req.user.userId,
                        targetId: followingId.toString(),
                    }, session);
                });
            }
            finally {
                await session.endSession();
            }
            const followersCount = await models_1.Follow.countDocuments({ followingId });
            res.status(http_status_codes_1.StatusCodes.OK).json({
                message: created ? "Followed writer" : "Already following writer",
                following: true,
                followersCount,
            });
        }
        catch (error) {
            console.error("[READER] Follow writer error:", error);
            sendErrorResponse(res, {
                message: "Failed to follow writer",
                status: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    };
    const unfollowWriter = async (req, res) => {
        if (!req.user) {
            sendErrorResponse(res, {
                message: "Authentication required",
                status: http_status_codes_1.StatusCodes.UNAUTHORIZED,
            });
            return;
        }
        const { writerId } = req.params;
        if (!isValidObjectId(writerId)) {
            sendErrorResponse(res, {
                message: "Invalid writer id",
                status: http_status_codes_1.StatusCodes.BAD_REQUEST,
            });
            return;
        }
        try {
            const followerId = new Types.ObjectId(req.user.userId);
            const followingId = new Types.ObjectId(writerId);
            const session = await mongoose_1.default.startSession();
            let removed = false;
            try {
                await session.withTransaction(async () => {
                    const follow = await models_1.Follow.findOne({ followerId, followingId }).session(session);
                    if (!follow) {
                        return;
                    }
                    await follow.deleteOne({ session });
                    removed = true;
                    await feedService.record("follow_removed", {
                        userId: req.user.userId,
                        targetId: followingId.toString(),
                    }, session);
                });
            }
            finally {
                await session.endSession();
            }
            const followersCount = await models_1.Follow.countDocuments({ followingId });
            res.status(http_status_codes_1.StatusCodes.OK).json({
                message: removed ? "Unfollowed writer" : "You are not following this writer",
                following: false,
                followersCount,
            });
        }
        catch (error) {
            console.error("[READER] Unfollow writer error:", error);
            sendErrorResponse(res, {
                message: "Failed to unfollow writer",
                status: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    };
    const getFollowing = async (req, res) => {
        if (!req.user) {
            sendErrorResponse(res, {
                message: "Authentication required",
                status: http_status_codes_1.StatusCodes.UNAUTHORIZED,
            });
            return;
        }
        try {
            const followerId = new Types.ObjectId(req.user.userId);
            const follows = await models_1.Follow.find({ followerId })
                .populate("followingId", "username profile bio avatar role")
                .sort({ createdAt: -1 });
            const writerIds = Array.from(new Set(follows
                .map((follow) => {
                const writer = follow.followingId;
                return writer?.role === "writer" ? writer._id.toString() : null;
            })
                .filter((id) => Boolean(id))));
            const writerObjectIds = writerIds.map((id) => new Types.ObjectId(id));
            const followerCounts = writerObjectIds.length
                ? await models_1.Follow.aggregate([
                    { $match: { followingId: { $in: writerObjectIds } } },
                    {
                        $group: {
                            _id: "$followingId",
                            count: { $sum: 1 },
                        },
                    },
                ])
                : [];
            const followerCountsMap = new Map(followerCounts.map((entry) => [entry._id.toString(), entry.count]));
            const data = follows
                .map((follow) => follow.followingId)
                .filter((writer) => writer?.role === "writer")
                .map((writer) => ({
                writer: buildWriterSummary(writer, followerCountsMap.get(writer._id.toString()) ?? 0),
            }));
            res.status(http_status_codes_1.StatusCodes.OK).json({
                data,
                total: data.length,
            });
        }
        catch (error) {
            console.error("[READER] Get following error:", error);
            sendErrorResponse(res, {
                message: "Failed to fetch following list",
                status: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    };
    const getProfile = async (req, res) => {
        if (!req.user) {
            sendErrorResponse(res, {
                message: "Authentication required",
                status: http_status_codes_1.StatusCodes.UNAUTHORIZED,
            });
            return;
        }
        try {
            const user = await models_1.User.findById(req.user.userId);
            if (!user) {
                sendErrorResponse(res, {
                    message: "Profile not found",
                    status: http_status_codes_1.StatusCodes.NOT_FOUND,
                });
                return;
            }
            const [followersCount, followingCount, reviewsCount] = await Promise.all([
                models_1.Follow.countDocuments({ followingId: user._id }),
                models_1.Follow.countDocuments({ followerId: user._id }),
                models_1.Review.countDocuments({ userId: user._id }),
            ]);
            res.status(http_status_codes_1.StatusCodes.OK).json({
                profile: serializeProfile(user),
                stats: {
                    followers: followersCount,
                    following: followingCount,
                    reviews: reviewsCount,
                },
            });
        }
        catch (error) {
            console.error("[READER] Get profile error:", error);
            sendErrorResponse(res, {
                message: "Failed to fetch profile",
                status: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    };
    const updateProfile = async (req, res) => {
        if (!req.user) {
            sendErrorResponse(res, {
                message: "Authentication required",
                status: http_status_codes_1.StatusCodes.UNAUTHORIZED,
            });
            return;
        }
        const parseResult = readerValidation_1.readerProfileUpdateSchema.safeParse(req.body);
        if (!parseResult.success) {
            res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json(formatValidationError(parseResult.error));
            return;
        }
        try {
            const user = await models_1.User.findById(req.user.userId);
            if (!user) {
                sendErrorResponse(res, {
                    message: "Profile not found",
                    status: http_status_codes_1.StatusCodes.NOT_FOUND,
                });
                return;
            }
            const updates = { ...parseResult.data };
            if (req.user.role === "writer" && Object.prototype.hasOwnProperty.call(updates, "profile")) {
                delete updates.profile;
            }
            if (Object.prototype.hasOwnProperty.call(updates, "profile")) {
                user.profile = updates.profile ?? user.profile;
            }
            if (Object.prototype.hasOwnProperty.call(updates, "bio")) {
                user.bio = updates.bio ?? user.bio;
            }
            if (Object.prototype.hasOwnProperty.call(updates, "avatar")) {
                user.avatar = updates.avatar ?? user.avatar;
            }
            if (Object.prototype.hasOwnProperty.call(updates, "socials")) {
                user.socials = updates.socials;
            }
            await user.save();
            res.status(http_status_codes_1.StatusCodes.OK).json({
                profile: serializeProfile(user),
            });
        }
        catch (error) {
            console.error("[READER] Update profile error:", error);
            sendErrorResponse(res, {
                message: "Failed to update profile",
                status: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    };
    return {
        listBooks,
        getBookDetail,
        upsertReview,
        getUserReviews,
        updateReview,
        deleteReview,
        followWriter,
        unfollowWriter,
        getFollowing,
        getProfile,
        updateProfile,
    };
}
//# sourceMappingURL=readerController.js.map