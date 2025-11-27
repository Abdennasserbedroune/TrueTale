import express from "express";
import { Order, User, Book } from "@truetale/db";

export class AdminController {
  async getPlatformSettings(req: express.Request, res: express.Response) {
    try {
      // In production, store these in a Settings collection
      const settings = {
        platformFeePercent: parseFloat(process.env.PLATFORM_FEE_PERCENT || "10"),
        minimumPayoutAmount: 5000, // cents
        payoutFrequency: "weekly",
      };

      res.json(settings);
    } catch (err) {
      console.error("Error fetching platform settings:", err);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  }

  async updatePlatformFee(req: express.Request, res: express.Response) {
    try {
      const roles = (req as any).user?.roles || [];
      const role = (req as any).user?.role;

      // Check if user is admin (either in roles array or role field)
      const isAdmin = roles.includes("admin") || role === "admin";
      if (!isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { feePercent } = req.body;

      if (feePercent === undefined || feePercent === null) {
        return res.status(400).json({ error: "Fee percent is required" });
      }

      const fee = parseFloat(feePercent);
      if (isNaN(fee) || fee < 0 || fee > 100) {
        return res.status(400).json({ error: "Fee must be between 0 and 100%" });
      }

      // In production, update database Settings collection
      // For now, just return the updated value
      // Note: This won't actually persist in env vars, but demonstrates the API

      res.json({
        platformFeePercent: fee,
        message: "Platform fee updated successfully",
      });
    } catch (err) {
      console.error("Error updating platform fee:", err);
      res.status(500).json({ error: "Failed to update fee" });
    }
  }

  async getEarningsReport(req: express.Request, res: express.Response) {
    try {
      const roles = (req as any).user?.roles || [];
      const role = (req as any).user?.role;

      // Check if user is admin (either in roles array or role field)
      const isAdmin = roles.includes("admin") || role === "admin";
      if (!isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const [totalEarnings, platformEarnings, sellerEarnings] = await Promise.all([
        Order.aggregate([
          { $match: { status: "paid" } },
          { $group: { _id: null, total: { $sum: "$amountCents" } } },
        ]),
        Order.aggregate([
          { $match: { status: "paid" } },
          { $group: { _id: null, total: { $sum: "$platformFeeCents" } } },
        ]),
        Order.aggregate([
          { $match: { status: "paid" } },
          { $group: { _id: null, total: { $sum: "$sellerProceedsCents" } } },
        ]),
      ]);

      const totalOrders = await Order.countDocuments({ status: "paid" });
      const totalUsers = await User.countDocuments();
      const totalBooks = await Book.countDocuments({ isDraft: false });

      res.json({
        totalGrossRevenue: totalEarnings[0]?.total || 0,
        platformFeeRevenue: platformEarnings[0]?.total || 0,
        sellerPayouts: sellerEarnings[0]?.total || 0,
        totalOrders,
        totalUsers,
        totalBooks,
      });
    } catch (err) {
      console.error("Error generating earnings report:", err);
      res.status(500).json({ error: "Failed to generate report" });
    }
  }

  async getTopSellers(req: express.Request, res: express.Response) {
    try {
      const roles = (req as any).user?.roles || [];
      const role = (req as any).user?.role;

      // Check if user is admin (either in roles array or role field)
      const isAdmin = roles.includes("admin") || role === "admin";
      if (!isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { limit = "10" } = req.query;
      const limitNum = Math.min(parseInt(limit as string) || 10, 50);

      const topSellers = await Order.aggregate([
        { $match: { status: "paid" } },
        {
          $group: {
            _id: "$writerId",
            totalRevenue: { $sum: "$amountCents" },
            totalSales: { $sum: 1 },
            platformFees: { $sum: "$platformFeeCents" },
          },
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: limitNum },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: "$user" },
        {
          $project: {
            username: "$user.username",
            name: "$user.name",
            email: "$user.email",
            totalRevenue: 1,
            totalSales: 1,
            platformFees: 1,
          },
        },
      ]);

      res.json(topSellers);
    } catch (err) {
      console.error("Error fetching top sellers:", err);
      res.status(500).json({ error: "Failed to fetch top sellers" });
    }
  }
}

export const adminController = new AdminController();
