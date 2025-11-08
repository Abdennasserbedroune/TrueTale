"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Book = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const bookSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
    },
    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2000,
    },
    writerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    category: {
        type: String,
        required: true,
        trim: true,
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    coverImage: {
        type: String,
        trim: true,
    },
    status: {
        type: String,
        enum: ["draft", "published"],
        default: "draft",
        required: true,
    },
    genres: {
        type: [String],
        required: true,
        validate: {
            validator: function (genres) {
                return genres.length > 0 && genres.length <= 10;
            },
            message: "A book must have between 1 and 10 genres",
        },
    },
    language: {
        type: String,
        required: true,
        trim: true,
        default: "English",
    },
    pages: {
        type: Number,
        required: true,
        min: 1,
    },
    averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
    },
    reviewCount: {
        type: Number,
        default: 0,
        min: 0,
    },
    publishedAt: {
        type: Date,
    },
}, {
    timestamps: true,
});
// Compound indexes
bookSchema.index({ status: 1, publishedAt: -1 });
bookSchema.index({ price: 1 });
bookSchema.index({ price: -1 });
bookSchema.index({ status: 1, averageRating: -1 });
bookSchema.index({ status: 1, reviewCount: -1 });
bookSchema.index({ status: 1, category: 1, publishedAt: -1 });
bookSchema.index({ status: 1, language: 1, publishedAt: -1 });
// Text search index for title and description
bookSchema.index({ title: "text", description: "text" });
// Pre-save hook to set publishedAt when status changes to published
bookSchema.pre("save", function (next) {
    if (this.isModified("status") && this.status === "published" && !this.publishedAt) {
        this.publishedAt = new Date();
    }
    next();
});
exports.Book = mongoose_1.default.model("Book", bookSchema);
//# sourceMappingURL=Book.js.map