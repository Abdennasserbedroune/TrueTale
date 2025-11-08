import { Request, Response } from "express";
import { FeedService } from "../utils/feedService";
export declare function createReaderController(feedService: FeedService): {
    listBooks: (req: Request, res: Response) => Promise<void>;
    getBookDetail: (req: Request, res: Response) => Promise<void>;
    upsertReview: (req: Request, res: Response) => Promise<void>;
    getUserReviews: (req: Request, res: Response) => Promise<void>;
    updateReview: (req: Request, res: Response) => Promise<void>;
    deleteReview: (req: Request, res: Response) => Promise<void>;
    followWriter: (req: Request, res: Response) => Promise<void>;
    unfollowWriter: (req: Request, res: Response) => Promise<void>;
    getFollowing: (req: Request, res: Response) => Promise<void>;
    getProfile: (req: Request, res: Response) => Promise<void>;
    updateProfile: (req: Request, res: Response) => Promise<void>;
};
//# sourceMappingURL=readerController.d.ts.map