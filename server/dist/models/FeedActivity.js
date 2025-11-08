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
exports.FeedActivity = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const feedActivitySchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    activityType: {
        type: String,
        enum: [
            "book_published",
            "review_created",
            "follow_created",
            "follow_removed",
            "story_published",
            "draft_created",
        ],
        required: true,
    },
    targetId: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
    },
    metadata: {
        type: mongoose_1.Schema.Types.Mixed,
        default: {},
    },
}, {
    timestamps: true,
});
// Compound index for user activity feed queries
feedActivitySchema.index({ userId: 1, createdAt: -1 });
// Index for activity type queries
feedActivitySchema.index({ activityType: 1, createdAt: -1 });
// Static method to get user feed
feedActivitySchema.statics.getUserFeed = function (userId, page = 1, limit = 20, activityTypes) {
    const query = {
        userId,
    };
    if (activityTypes && activityTypes.length > 0) {
        query.activityType = { $in: activityTypes };
    }
    return this.find(query)
        .populate("userId", "username avatar")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);
};
// Static method to create activity
feedActivitySchema.statics.createActivity = function (userId, activityType, targetId, metadata) {
    return this.create({
        userId,
        activityType,
        targetId,
        metadata: metadata || {},
    });
};
// Static method to get activities by target
feedActivitySchema.statics.getActivitiesByTarget = function (targetId, activityType) {
    const query = { targetId };
    if (activityType) {
        query.activityType = activityType;
    }
    return this.find(query).populate("userId", "username avatar").sort({ createdAt: -1 }).limit(50);
};
exports.FeedActivity = mongoose_1.default.model("FeedActivity", feedActivitySchema);
//# sourceMappingURL=FeedActivity.js.map