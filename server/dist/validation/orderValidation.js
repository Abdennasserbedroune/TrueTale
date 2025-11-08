"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.idParamsSchema = exports.createOrderSchema = exports.paginationQuerySchema = void 0;
const zod_1 = require("zod");
exports.paginationQuerySchema = zod_1.z.object({
    page: zod_1.z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: zod_1.z.string().optional().transform((val) => (val ? parseInt(val, 10) : 10)),
});
exports.createOrderSchema = zod_1.z.object({
    bookId: zod_1.z.string().min(1, "Book ID is required"),
});
exports.idParamsSchema = zod_1.z.object({
    id: zod_1.z.string().min(1, "ID is required"),
});
//# sourceMappingURL=orderValidation.js.map