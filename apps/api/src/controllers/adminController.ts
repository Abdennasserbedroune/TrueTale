import express from "express";
import { Order, User, Book, Review } from "@truetale/db";
import Stripe from "stripe";
import { logger } from "../lib/logger";

export class AdminController {
  private requireAdmin(req: express.Request) {
    const roles = (req as any).user?.roles || [];
    const role = (req as any).user?.role;
    
    // Check if user is admin (either in roles array or role field)
    const isAdmin = roles.includes('admin') || role === 'admin';
    if (!isAdmin) {
      throw new Error('Admin access required');
    }
  }

  // User Management
  async listUsers(req: express.Request, res: express.Response) {
    try {
      this.requireAdmin(req);

      const { q, limit = '20', offset = '0' } = req.query;
      const query: any = {};

      if (q) {
        query.$or = [
          { username: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } },
        ];
      }

      const limitNum = Math.min(parseInt(limit as string) || 20, 100);
      const offsetNum = Math.max(parseInt(offset as string) || 0, 0);

      const [users, total] = await Promise.all([
        User.find(query)
          .select('-password')
          .limit(limitNum)
          .skip(offsetNum)
          .lean(),
        User.countDocuments(query),
      ]);

      logger.info('Admin listed users', {
        adminId: (req as any).user?.id,
        query: q,
        total,
      });

      res.json({ data: users, total });
    } catch (err: any) {
      logger.error('Failed to list users', { error: err.message });
      res.status(err.message === 'Admin access required' ? 403 : 500).json({ 
        error: err.message 
      });
    }
  }

  async banUser(req: express.Request, res: express.Response) {
    try {
      this.requireAdmin(req);

      const { id } = req.params;
      const { reason } = req.body;

      if (!reason || reason.trim().length === 0) {
        return res.status(400).json({ error: 'Ban reason is required' });
      }

      const user = await User.findByIdAndUpdate(
        id,
        { isBanned: true, banReason: reason },
        { new: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      logger.warn('User banned', {
        adminId: (req as any).user?.id,
        bannedUserId: id,
        reason,
      });

      res.json({ message: 'User banned successfully', user });
    } catch (err: any) {
      logger.error('Failed to ban user', { error: err.message });
      res.status(err.message === 'Admin access required' ? 403 : 500).json({ 
        error: err.message 
      });
    }
  }

  async unbanUser(req: express.Request, res: express.Response) {
    try {
      this.requireAdmin(req);

      const { id } = req.params;

      const user = await User.findByIdAndUpdate(
        id,
        { isBanned: false, banReason: null },
        { new: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      logger.info('User unbanned', {
        adminId: (req as any).user?.id,
        unbannedUserId: id,
      });

      res.json({ message: 'User unbanned successfully', user });
    } catch (err: any) {
      logger.error('Failed to unban user', { error: err.message });
      res.status(err.message === 'Admin access required' ? 403 : 500).json({ 
        error: err.message 
      });
    }
  }

  // Content Moderation
  async removeBook(req: express.Request, res: express.Response) {
    try {
      this.requireAdmin(req);

      const { id } = req.params;
      const book = await Book.findByIdAndDelete(id);

      if (!book) {
        return res.status(404).json({ error: 'Book not found' });
      }

      logger.warn('Book removed by admin', {
        adminId: (req as any).user?.id,
        bookId: id,
        bookTitle: book.title,
      });

      res.json({ message: 'Book removed successfully' });
    } catch (err: any) {
      logger.error('Failed to remove book', { error: err.message });
      res.status(err.message === 'Admin access required' ? 403 : 500).json({ 
        error: err.message 
      });
    }
  }

  async removeReview(req: express.Request, res: express.Response) {
    try {
      this.requireAdmin(req);

      const { id } = req.params;
      const review = await Review.findByIdAndDelete(id);

      if (!review) {
        return res.status(404).json({ error: 'Review not found' });
      }

      logger.warn('Review removed by admin', {
        adminId: (req as any).user?.id,
        reviewId: id,
      });

      res.json({ message: 'Review removed successfully' });
    } catch (err: any) {
      logger.error('Failed to remove review', { error: err.message });
      res.status(err.message === 'Admin access required' ? 403 : 500).json({ 
        error: err.message 
      });
    }
  }

  // Order Management
  async listOrders(req: express.Request, res: express.Response) {
    try {
      this.requireAdmin(req);

      const { status, limit = '20', offset = '0' } = req.query;
      const query: any = {};

      if (status) {
        query.status = status;
      }

      const limitNum = Math.min(parseInt(limit as string) || 20, 100);
      const offsetNum = Math.max(parseInt(offset as string) || 0, 0);

      const [orders, total] = await Promise.all([
        Order.find(query)
          .populate('buyerId', 'email username')
          .populate('writerId', 'email username')
          .populate('bookId', 'title')
          .limit(limitNum)
          .skip(offsetNum)
          .sort({ createdAt: -1 })
          .lean(),
        Order.countDocuments(query),
      ]);

      logger.info('Admin listed orders', {
        adminId: (req as any).user?.id,
        status,
        total,
      });

      res.json({ data: orders, total });
    } catch (err: any) {
      logger.error('Failed to list orders', { error: err.message });
      res.status(err.message === 'Admin access required' ? 403 : 500).json({ 
        error: err.message 
      });
    }
  }

  async refundOrder(req: express.Request, res: express.Response) {
    try {
      this.requireAdmin(req);

      const { id } = req.params;
      const order = await Order.findById(id);

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      if (order.status !== 'paid') {
        return res.status(400).json({ 
          error: 'Only paid orders can be refunded' 
        });
      }

      // Process refund via Stripe
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecretKey) {
        throw new Error('Stripe secret key not configured');
      }

      const stripe = new Stripe(stripeSecretKey);

      await stripe.refunds.create({
        payment_intent: order.stripePaymentIntentId,
      });

      // Update order status
      order.status = 'refunded';
      await order.save();

      logger.warn('Order refunded by admin', {
        adminId: (req as any).user?.id,
        orderId: id,
        amount: order.amountCents,
      });

      res.json({ message: 'Order refunded successfully', order });
    } catch (err: any) {
      logger.error('Failed to refund order', { error: err.message });
      res.status(err.message === 'Admin access required' ? 403 : 500).json({ 
        error: err.message 
      });
    }
  }

  // Platform Settings & Reports
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
