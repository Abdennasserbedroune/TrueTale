import { Request, Response } from "express";
import { FeedService } from "../utils/feedService";
export declare function createWriterController(feedService: FeedService): {
    createBook: (req: Request, res: Response) => Promise<void>;
    updateBook: (req: Request, res: Response) => Promise<void>;
    deleteBook: (req: Request, res: Response) => Promise<void>;
    getBooks: (req: Request, res: Response) => Promise<void>;
    getDrafts: (req: Request, res: Response) => Promise<void>;
    createDraft: (req: Request, res: Response) => Promise<void>;
    updateDraft: (req: Request, res: Response) => Promise<void>;
    deleteDraft: (req: Request, res: Response) => Promise<void>;
    getStories: (req: Request, res: Response) => Promise<void>;
    createStory: (req: Request, res: Response) => Promise<void>;
    deleteStory: (req: Request, res: Response) => Promise<void>;
    getProfile: (req: Request, res: Response) => Promise<void>;
    updateProfile: (req: Request, res: Response) => Promise<void>;
};
//# sourceMappingURL=writerController.d.ts.map