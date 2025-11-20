import express from "express";
import { dashboardService } from "../services/dashboardService";
import { User } from "@truetale/db";

export class DashboardController {
  async getSummary(req: express.Request, res: express.Response) {
    try {
      const sellerId = (req as any).user?.userId;
      if (!sellerId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const stats = await dashboardService.getSellerStats(sellerId);
      res.json(stats);
    } catch (err) {
      console.error("Error fetching dashboard summary:", err);
      res.status(500).json({ error: "Failed to fetch dashboard" });
    }
  }

  async getRevenueChart(req: express.Request, res: express.Response) {
    try {
      const sellerId = (req as any).user?.userId;
      if (!sellerId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { months = "12" } = req.query;
      const monthsNum = Math.min(Math.max(parseInt(months as string) || 12, 1), 24);
      const data = await dashboardService.getRevenueHistory(sellerId, monthsNum);

      res.json(data);
    } catch (err) {
      console.error("Error fetching revenue chart:", err);
      res.status(500).json({ error: "Failed to fetch chart data" });
    }
  }

  async getTopBooks(req: express.Request, res: express.Response) {
    try {
      const sellerId = (req as any).user?.userId;
      if (!sellerId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { limit = "5" } = req.query;
      const limitNum = Math.min(Math.max(parseInt(limit as string) || 5, 1), 20);
      const books = await dashboardService.getTopBooks(sellerId, limitNum);

      res.json(books);
    } catch (err) {
      console.error("Error fetching top books:", err);
      res.status(500).json({ error: "Failed to fetch top books" });
    }
  }

  async getRecentOrders(req: express.Request, res: express.Response) {
    try {
      const sellerId = (req as any).user?.userId;
      if (!sellerId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { limit = "10", offset = "0" } = req.query;
      const limitNum = Math.min(parseInt(limit as string) || 10, 100);
      const offsetNum = Math.max(parseInt(offset as string) || 0, 0);

      const orders = await dashboardService.getRecentOrders(
        sellerId,
        limitNum,
        offsetNum
      );

      res.json(orders);
    } catch (err) {
      console.error("Error fetching recent orders:", err);
      res.status(500).json({ error: "Failed to fetch recent orders" });
    }
  }

  async getPayoutHistory(req: express.Request, res: express.Response) {
    try {
      const sellerId = (req as any).user?.userId;
      if (!sellerId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { limit = "20", offset = "0" } = req.query;
      const limitNum = Math.min(parseInt(limit as string) || 20, 100);
      const offsetNum = Math.max(parseInt(offset as string) || 0, 0);

      const result = await dashboardService.getPayoutHistory(
        sellerId,
        limitNum,
        offsetNum
      );

      res.json(result);
    } catch (err) {
      console.error("Error fetching payout history:", err);
      res.status(500).json({ error: "Failed to fetch payout history" });
    }
  }

  async getPayoutInfo(req: express.Request, res: express.Response) {
    try {
      const sellerId = (req as any).user?.userId;
      if (!sellerId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const user = await User.findById(sellerId).select("payoutSettings stripeAccountId stripeOnboardingComplete");
      const payout = await dashboardService.calculatePendingPayout(sellerId);

      res.json({
        ...payout,
        settings: user?.payoutSettings || { frequency: "weekly", minimumThreshold: 5000 },
        stripeConnected: !!user?.stripeAccountId,
        stripeOnboardingComplete: user?.stripeOnboardingComplete || false,
      });
    } catch (err) {
      console.error("Error fetching payout info:", err);
      res.status(500).json({ error: "Failed to fetch payout info" });
    }
  }

  async updatePayoutSettings(req: express.Request, res: express.Response) {
    try {
      const sellerId = (req as any).user?.userId;
      if (!sellerId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { frequency, minimumThreshold } = req.body;

      // Validate frequency
      const validFrequencies = ["daily", "weekly", "monthly"];
      if (frequency && !validFrequencies.includes(frequency)) {
        return res.status(400).json({ error: "Invalid frequency value" });
      }

      // Validate minimum threshold
      if (minimumThreshold !== undefined) {
        const threshold = parseInt(minimumThreshold);
        if (isNaN(threshold) || threshold < 0) {
          return res.status(400).json({ error: "Invalid minimum threshold" });
        }
      }

      const updateFields: any = {};
      if (frequency) {
        updateFields["payoutSettings.frequency"] = frequency;
      }
      if (minimumThreshold !== undefined) {
        updateFields["payoutSettings.minimumThreshold"] = parseInt(minimumThreshold);
      }

      const user = await User.findByIdAndUpdate(
        sellerId,
        { $set: updateFields },
        { new: true }
      ).select("payoutSettings");

      res.json(user?.payoutSettings);
    } catch (err) {
      console.error("Error updating payout settings:", err);
      res.status(500).json({ error: "Failed to update settings" });
    }
  }
}

export const dashboardController = new DashboardController();
