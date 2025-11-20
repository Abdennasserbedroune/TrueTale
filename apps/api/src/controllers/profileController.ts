import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { User, Follow, Book } from "@truetale/db";
import mongoose from "mongoose";
import crypto from "crypto";

export class ProfileController {
  async getPublicProfile(req: Request, res: Response): Promise<void> {
    try {
      const { username } = req.params;

      const user = await User.findOne({ username }).select(
        "-password -email -resetToken -verificationToken -refreshTokens -stripeAccountId -payoutSettings -notificationPreferences -deletionRequestedAt"
      );

      if (!user) {
        res.status(StatusCodes.NOT_FOUND).json({
          message: "User not found",
          status: StatusCodes.NOT_FOUND,
        });
        return;
      }

      const [followersCount, followingCount, bookCount] = await Promise.all([
        Follow.countDocuments({ followingId: user._id }),
        Follow.countDocuments({ followerId: user._id }),
        Book.countDocuments({ writerId: user._id, status: "published" }),
      ]);

      res.status(StatusCodes.OK).json({
        ...user.toObject(),
        followers: followersCount,
        following: followingCount,
        bookCount,
      });
    } catch (error) {
      console.error("Error fetching public profile:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Failed to fetch profile",
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async getPrivateProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          message: "Unauthorized",
          status: StatusCodes.UNAUTHORIZED,
        });
        return;
      }

      const user = await User.findById(userId).select("-password");

      if (!user) {
        res.status(StatusCodes.NOT_FOUND).json({
          message: "User not found",
          status: StatusCodes.NOT_FOUND,
        });
        return;
      }

      res.status(StatusCodes.OK).json(user);
    } catch (error) {
      console.error("Error fetching private profile:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Failed to fetch profile",
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          message: "Unauthorized",
          status: StatusCodes.UNAUTHORIZED,
        });
        return;
      }

      const { name, bio, location, socials, notificationPreferences } = req.body;

      if (bio && bio.length > 500) {
        res.status(StatusCodes.BAD_REQUEST).json({
          message: "Bio too long (max 500 chars)",
          status: StatusCodes.BAD_REQUEST,
        });
        return;
      }

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (bio !== undefined) updateData.bio = bio;
      if (location !== undefined) updateData.location = location;
      if (socials !== undefined) updateData.socials = socials;
      if (notificationPreferences !== undefined)
        updateData.notificationPreferences = notificationPreferences;

      const user = await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true }
      ).select("-password");

      res.status(StatusCodes.OK).json(user);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Profile update failed",
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async updateAvatar(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          message: "Unauthorized",
          status: StatusCodes.UNAUTHORIZED,
        });
        return;
      }

      const { avatarUrl } = req.body;

      if (!avatarUrl) {
        res.status(StatusCodes.BAD_REQUEST).json({
          message: "Avatar URL required",
          status: StatusCodes.BAD_REQUEST,
        });
        return;
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { $set: { avatar: avatarUrl } },
        { new: true }
      ).select("-password");

      res.status(StatusCodes.OK).json({
        avatar: user?.avatar,
      });
    } catch (error) {
      console.error("Error updating avatar:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Avatar update failed",
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async changeEmail(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          message: "Unauthorized",
          status: StatusCodes.UNAUTHORIZED,
        });
        return;
      }

      const { newEmail } = req.body;

      if (!newEmail) {
        res.status(StatusCodes.BAD_REQUEST).json({
          message: "New email required",
          status: StatusCodes.BAD_REQUEST,
        });
        return;
      }

      const existing = await User.findOne({ email: newEmail });
      if (existing) {
        res.status(StatusCodes.CONFLICT).json({
          message: "Email already in use",
          status: StatusCodes.CONFLICT,
        });
        return;
      }

      const verificationToken = crypto.randomBytes(32).toString("hex");
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await User.findByIdAndUpdate(userId, {
        $set: {
          email: newEmail,
          isVerified: false,
          verificationToken,
          verificationExpires,
        },
      });

      // TODO: Send verification email to new address

      res.status(StatusCodes.OK).json({
        message: "Email updated. Check your new email for verification link.",
      });
    } catch (error) {
      console.error("Error changing email:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Email change failed",
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          message: "Unauthorized",
          status: StatusCodes.UNAUTHORIZED,
        });
        return;
      }

      const { oldPassword, newPassword } = req.body;

      if (!oldPassword || !newPassword) {
        res.status(StatusCodes.BAD_REQUEST).json({
          message: "Both passwords required",
          status: StatusCodes.BAD_REQUEST,
        });
        return;
      }

      if (newPassword.length < 6) {
        res.status(StatusCodes.BAD_REQUEST).json({
          message: "New password must be at least 6 characters",
          status: StatusCodes.BAD_REQUEST,
        });
        return;
      }

      const user = await User.findById(userId);
      if (!user) {
        res.status(StatusCodes.NOT_FOUND).json({
          message: "User not found",
          status: StatusCodes.NOT_FOUND,
        });
        return;
      }

      const validOld = await user.comparePassword(oldPassword);
      if (!validOld) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          message: "Current password incorrect",
          status: StatusCodes.UNAUTHORIZED,
        });
        return;
      }

      user.password = newPassword;
      user.refreshTokens = [];
      await user.save();

      res.status(StatusCodes.OK).json({
        message: "Password changed. Please login again.",
      });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Password change failed",
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async requestDeletion(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          message: "Unauthorized",
          status: StatusCodes.UNAUTHORIZED,
        });
        return;
      }

      await User.findByIdAndUpdate(userId, {
        $set: { deletionRequestedAt: new Date() },
      });

      res.status(StatusCodes.OK).json({
        message: "Account deletion scheduled for 30 days from now.",
      });
    } catch (error) {
      console.error("Error requesting deletion:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Deletion request failed",
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async cancelDeletion(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          message: "Unauthorized",
          status: StatusCodes.UNAUTHORIZED,
        });
        return;
      }

      await User.findByIdAndUpdate(userId, {
        $set: { deletionRequestedAt: null },
      });

      res.status(StatusCodes.OK).json({
        message: "Account deletion cancelled.",
      });
    } catch (error) {
      console.error("Error cancelling deletion:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Cancellation failed",
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async updateRole(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          message: "Unauthorized",
          status: StatusCodes.UNAUTHORIZED,
        });
        return;
      }

      const { role } = req.body;

      if (!role || !["reader", "writer"].includes(role)) {
        res.status(StatusCodes.BAD_REQUEST).json({
          message: "Invalid role. Must be 'reader' or 'writer'",
          status: StatusCodes.BAD_REQUEST,
        });
        return;
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { $set: { role } },
        { new: true }
      ).select("-password");

      res.status(StatusCodes.OK).json(user);
    } catch (error) {
      console.error("Error updating role:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Role update failed",
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  }
}

export const profileController = new ProfileController();
