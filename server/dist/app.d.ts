import { Express } from "express";
import { EnvConfig } from "./config/env";
import { TokenService } from "./utils/tokenService";
import { FeedService } from "./utils/feedService";
export declare function createApp(config: EnvConfig): {
    app: Express;
    tokenService: TokenService;
    feedService: FeedService;
};
//# sourceMappingURL=app.d.ts.map