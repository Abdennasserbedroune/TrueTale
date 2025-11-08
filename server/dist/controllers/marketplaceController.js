"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMarketplaceController = createMarketplaceController;
const http_status_codes_1 = require("http-status-codes");
const mongoose_1 = __importDefault(require("mongoose"));
const models_1 = require("../models");
const marketplaceCache_1 = require("../utils/marketplaceCache");
const marketplaceValidation_1 = require("../validation/marketplaceValidation");
const { Types } = mongoose_1.default;
const formatValidationError = (error) => ({
    message: "Validation error",
    status: http_status_codes_1.StatusCodes.BAD_REQUEST,
    errors: error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
    })),
});
const sendErrorResponse = (res, error) => {
    res.status(error.status).json({
        message: error.message,
        status: error.status,
    });
};
function buildWriterSummary(writer, followersCount, publishedBooks, fallbackId) {
    if (!writer) {
        return {
            id: fallbackId ?? "",
            username: "Unknown Writer",
            profile: null,
            bio: null,
            avatar: null,
            followersCount,
            publishedBooks,
        };
    }
    return {
        id: writer._id.toString(),
        username: writer.username,
        profile: writer.profile ?? null,
        bio: writer.bio ?? null,
        avatar: writer.avatar ?? null,
        followersCount,
        publishedBooks,
    };
}
function createMarketplaceController() {
    // GET /api/marketplace - paginated list of published books, default sort by newest
    const getMarketplaceBooks = async (req, res) => {
        try {
            const parseResult = marketplaceValidation_1.marketplacePaginationSchema.safeParse(req.query);
            if (!parseResult.success) {
                res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json(formatValidationError(parseResult.error));
                return;
            }
            const { page, limit } = parseResult.data;
            const match = { status: "published" };
            const sortSpec = { publishedAt: -1, createdAt: -1 };
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
            const items = books.map((book) => {
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
            const response = {
                items,
                page,
                totalPages,
                total,
            };
            res.status(http_status_codes_1.StatusCodes.OK).json(response);
        }
        catch (error) {
            console.error("[MARKETPLACE] Get marketplace books error:", error);
            sendErrorResponse(res, {
                message: "Failed to fetch marketplace books",
                status: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    };
    // GET /api/marketplace/search?q= - MongoDB text search across title/description/genres with relevance sorting
    const searchMarketplaceBooks = async (req, res) => {
        try {
            const parseResult = marketplaceValidation_1.marketplaceSearchSchema.safeParse(req.query);
            if (!parseResult.success) {
                res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json(formatValidationError(parseResult.error));
                return;
            }
            const { q: query, page, limit } = parseResult.data;
            const match = {
                status: "published",
                $text: { $search: query },
            };
            const skip = (page - 1) * limit;
            const [books, total] = await Promise.all([
                models_1.Book.find(match, { score: { $meta: "textScore" } })
                    .sort({ score: { $meta: "textScore" } })
                    .skip(skip)
                    .limit(limit),
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
            const items = books.map((book) => {
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
            const response = {
                items,
                page,
                totalPages,
                total,
            };
            res.status(http_status_codes_1.StatusCodes.OK).json(response);
        }
        catch (error) {
            console.error("[MARKETPLACE] Search marketplace books error:", error);
            sendErrorResponse(res, {
                message: "Failed to search marketplace books",
                status: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    };
    // GET /api/marketplace/filter - supporting combined filters and sort options
    const filterMarketplaceBooks = async (req, res) => {
        try {
            const parseResult = marketplaceValidation_1.marketplaceFilterSchema.safeParse(req.query);
            if (!parseResult.success) {
                res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json(formatValidationError(parseResult.error));
                return;
            }
            const { page, limit, category, minPrice, maxPrice, minRating, language, publishedAfter, publishedBefore, sort, } = parseResult.data;
            const match = { status: "published" };
            if (category) {
                match.category = category;
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
            if (minRating !== undefined) {
                match.averageRating = { $gte: minRating };
            }
            if (language) {
                match.language = language;
            }
            if (publishedAfter || publishedBefore) {
                const dateFilter = {};
                if (publishedAfter) {
                    dateFilter.$gte = publishedAfter;
                }
                if (publishedBefore) {
                    dateFilter.$lte = publishedBefore;
                }
                match.publishedAt = dateFilter;
            }
            const sortOptions = {
                newest: { publishedAt: -1, createdAt: -1 },
                "most-reviewed": { reviewCount: -1, publishedAt: -1 },
                "highest-rated": { averageRating: -1, reviewCount: -1, publishedAt: -1 },
                "price-asc": { price: 1, publishedAt: -1 },
                "price-desc": { price: -1, publishedAt: -1 },
            };
            const sortSpec = sortOptions[sort] ?? sortOptions.newest;
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
            const items = books.map((book) => {
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
            const response = {
                items,
                page,
                totalPages,
                total,
            };
            res.status(http_status_codes_1.StatusCodes.OK).json(response);
        }
        catch (error) {
            console.error("[MARKETPLACE] Filter marketplace books error:", error);
            sendErrorResponse(res, {
                message: "Failed to filter marketplace books",
                status: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    };
    // GET /api/marketplace/trending - top-rated/most-reviewed books within recent timeframe
    const getTrendingBooks = async (req, res) => {
        try {
            const parseResult = marketplaceValidation_1.marketplaceTrendingSchema.safeParse(req.query);
            if (!parseResult.success) {
                res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json(formatValidationError(parseResult.error));
                return;
            }
            const { days, limit } = parseResult.data;
            // Create cache key based on parameters
            const cacheKey = `trending:${days}:${limit}`;
            // Try to get from cache first
            const cached = marketplaceCache_1.marketplaceCache.get(cacheKey);
            if (cached) {
                res.status(http_status_codes_1.StatusCodes.OK).json(cached);
                return;
            }
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);
            const pipeline = [
                {
                    $match: {
                        status: "published",
                        publishedAt: { $gte: cutoffDate },
                        averageRating: { $gte: 4.0 },
                        reviewCount: { $gte: 5 },
                    },
                },
                {
                    $addFields: {
                        trendingScore: {
                            $add: [
                                { $multiply: ["$averageRating", 10] },
                                { $multiply: ["$reviewCount", 2] },
                                { $divide: [{ $subtract: [new Date(), "$publishedAt"] }, 1000 * 60 * 60 * 24] },
                            ],
                        },
                    },
                },
                { $sort: { trendingScore: -1, averageRating: -1, reviewCount: -1 } },
                { $limit: limit },
            ];
            const books = await models_1.Book.aggregate(pipeline);
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
            const items = books.map((book) => {
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
            const response = { items };
            // Cache the result for 10 minutes
            marketplaceCache_1.marketplaceCache.set(cacheKey, response, 10 * 60 * 1000);
            res.status(http_status_codes_1.StatusCodes.OK).json(response);
        }
        catch (error) {
            console.error("[MARKETPLACE] Get trending books error:", error);
            sendErrorResponse(res, {
                message: "Failed to fetch trending books",
                status: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    };
    // GET /api/marketplace/categories - returning distinct categories/genres from published books
    const getCategories = async (req, res) => {
        try {
            // Try to get from cache first
            const cached = marketplaceCache_1.marketplaceCache.get("categories");
            if (cached) {
                res.status(http_status_codes_1.StatusCodes.OK).json(cached);
                return;
            }
            const [categories, genres] = await Promise.all([
                models_1.Book.distinct("category", { status: "published" }),
                models_1.Book.aggregate([
                    { $match: { status: "published" } },
                    { $unwind: "$genres" },
                    { $group: { _id: "$genres", count: { $sum: 1 } } },
                    { $sort: { count: -1 } },
                    { $project: { name: "$_id", count: 1, _id: 0 } },
                ]),
            ]);
            const response = {
                categories: categories.sort(),
                genres,
            };
            // Cache the result for 15 minutes
            marketplaceCache_1.marketplaceCache.set("categories", response, 15 * 60 * 1000);
            res.status(http_status_codes_1.StatusCodes.OK).json(response);
        }
        catch (error) {
            console.error("[MARKETPLACE] Get categories error:", error);
            sendErrorResponse(res, {
                message: "Failed to fetch categories",
                status: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    };
    return {
        getMarketplaceBooks,
        searchMarketplaceBooks,
        filterMarketplaceBooks,
        getTrendingBooks,
        getCategories,
    };
}
//# sourceMappingURL=marketplaceController.js.map