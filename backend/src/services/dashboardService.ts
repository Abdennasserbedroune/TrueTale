import { Order, User, Book, Payout } from "@truetale/db";
import mongoose from "mongoose";

export class DashboardService {
  async getSellerStats(sellerId: string) {
    const ObjectId = mongoose.Types.ObjectId;

    // Total revenue
    const totalRevenue = await Order.aggregate([
      { $match: { writerId: new ObjectId(sellerId), status: "paid" } },
      { $group: { _id: null, total: { $sum: "$sellerProceedsCents" } } },
    ]);

    // Revenue this month
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthlyRevenue = await Order.aggregate([
      {
        $match: {
          writerId: new ObjectId(sellerId),
          status: "paid",
          createdAt: { $gte: monthStart },
        },
      },
      { $group: { _id: null, total: { $sum: "$sellerProceedsCents" } } },
    ]);

    // Total sales count
    const totalSales = await Order.countDocuments({
      writerId: new ObjectId(sellerId),
      status: "paid",
    });

    // Active listings
    const activeListings = await Book.countDocuments({
      authorId: new ObjectId(sellerId),
      isDraft: false,
    });

    return {
      totalRevenueCents: totalRevenue[0]?.total || 0,
      monthlyRevenueCents: monthlyRevenue[0]?.total || 0,
      totalSales,
      activeListings,
    };
  }

  async getRevenueHistory(sellerId: string, monthsBack: number = 12) {
    const ObjectId = mongoose.Types.ObjectId;
    const data = [];

    for (let i = monthsBack - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      date.setDate(1);
      date.setHours(0, 0, 0, 0);

      const nextMonth = new Date(date);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      const result = await Order.aggregate([
        {
          $match: {
            writerId: new ObjectId(sellerId),
            status: "paid",
            createdAt: { $gte: date, $lt: nextMonth },
          },
        },
        { $group: { _id: null, total: { $sum: "$sellerProceedsCents" } } },
      ]);

      data.push({
        month: date.toISOString().slice(0, 7),
        revenue: result[0]?.total || 0,
      });
    }

    return data;
  }

  async getTopBooks(sellerId: string, limit: number = 5) {
    const ObjectId = mongoose.Types.ObjectId;

    return await Order.aggregate([
      { $match: { writerId: new ObjectId(sellerId), status: "paid" } },
      {
        $group: {
          _id: "$bookId",
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: "$sellerProceedsCents" },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "books",
          localField: "_id",
          foreignField: "_id",
          as: "book",
        },
      },
      { $unwind: "$book" },
      {
        $project: {
          title: "$book.title",
          slug: "$book.slug",
          totalSales: 1,
          totalRevenue: 1,
        },
      },
    ]);
  }

  async getRecentOrders(
    sellerId: string,
    limit: number = 10,
    offset: number = 0
  ) {
    const ObjectId = mongoose.Types.ObjectId;

    return await Order.aggregate([
      { $match: { writerId: new ObjectId(sellerId), status: "paid" } },
      { $sort: { createdAt: -1 } },
      { $skip: offset },
      { $limit: limit },
      {
        $lookup: {
          from: "books",
          localField: "bookId",
          foreignField: "_id",
          as: "book",
        },
      },
      { $unwind: "$book" },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "buyer",
        },
      },
      { $unwind: "$buyer" },
      {
        $project: {
          bookTitle: "$book.title",
          bookSlug: "$book.slug",
          buyerName: "$buyer.name",
          buyerUsername: "$buyer.username",
          amountCents: 1,
          sellerProceedsCents: 1,
          status: 1,
          createdAt: 1,
        },
      },
    ]);
  }

  async getPayoutHistory(
    sellerId: string,
    limit: number = 20,
    offset: number = 0
  ) {
    const ObjectId = mongoose.Types.ObjectId;

    const payouts = await Payout.find({ sellerId: new ObjectId(sellerId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset);

    const total = await Payout.countDocuments({
      sellerId: new ObjectId(sellerId),
    });

    return {
      payouts,
      total,
      limit,
      offset,
    };
  }

  async calculatePendingPayout(sellerId: string) {
    const ObjectId = mongoose.Types.ObjectId;
    const MIN_THRESHOLD = 5000; // cents ($50)

    // Get all paid orders
    const orders = await Order.find({
      writerId: new ObjectId(sellerId),
      status: "paid",
    });

    // Get all payouts to see which orders were already paid out
    const payouts = await Payout.find({ sellerId: new ObjectId(sellerId) });
    const paidOutOrderIds = new Set(
      payouts.flatMap((p) => p.orderIds.map((id) => id.toString()))
    );

    // Calculate unpaid total
    const unpaidOrders = orders.filter(
      (o) => !paidOutOrderIds.has(o._id.toString())
    );
    const total = unpaidOrders.reduce((sum, o) => sum + (o.sellerProceedsCents || 0), 0);

    return {
      amountCents: total,
      eligible: total >= MIN_THRESHOLD,
      message:
        total < MIN_THRESHOLD
          ? `Reach $${(MIN_THRESHOLD / 100).toFixed(2)} to request payout`
          : "Ready to request payout",
      unpaidOrderCount: unpaidOrders.length,
    };
  }
}

export const dashboardService = new DashboardService();
