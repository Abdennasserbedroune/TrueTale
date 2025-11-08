import { Request, Response } from "express";
export declare function createMarketplaceController(): {
    getMarketplaceBooks: (req: Request, res: Response) => Promise<void>;
    searchMarketplaceBooks: (req: Request, res: Response) => Promise<void>;
    filterMarketplaceBooks: (req: Request, res: Response) => Promise<void>;
    getTrendingBooks: (req: Request, res: Response) => Promise<void>;
    getCategories: (req: Request, res: Response) => Promise<void>;
};
//# sourceMappingURL=marketplaceController.d.ts.map