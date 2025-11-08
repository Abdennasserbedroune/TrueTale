import { Request, Response } from "express";
export declare function createOrderController(): {
    getBookCheckout: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    createOrder: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    getUserOrders: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    getUserPurchases: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    handleStripeWebhook: (req: Request, res: Response) => Promise<void>;
};
//# sourceMappingURL=orderController.d.ts.map