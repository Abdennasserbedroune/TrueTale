import nodemailer, { Transporter } from "nodemailer";

export class EmailService {
  private transporter: Transporter;
  private fromEmail: string;
  private isConfigured: boolean;

  constructor() {
    this.fromEmail = process.env.EMAIL_FROM || "noreply@truetale.app";
    this.isConfigured = !!(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD);

    if (this.isConfigured) {
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || "smtp.gmail.com",
        port: parseInt(process.env.EMAIL_PORT || "587", 10),
        secure: process.env.EMAIL_SECURE === "true",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
    } else {
      console.warn(
        "[EMAIL] Email service not configured. Set EMAIL_USER and EMAIL_PASSWORD environment variables."
      );
      this.transporter = nodemailer.createTransport({
        jsonTransport: true,
      });
    }
  }

  async sendVerificationEmail(email: string, verificationUrl: string): Promise<void> {
    try {
      const mailOptions = {
        from: this.fromEmail,
        to: email,
        subject: "Verify your TrueTale email",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Welcome to TrueTale!</h1>
            <p style="font-size: 16px; color: #666;">
              Thank you for registering. Please verify your email address to complete your registration.
            </p>
            <div style="margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background-color: #4F46E5; color: white; padding: 12px 24px; 
                        text-decoration: none; border-radius: 6px; display: inline-block;">
                Verify Email
              </a>
            </div>
            <p style="font-size: 14px; color: #999;">
              This link will expire in 24 hours. If you didn't create an account, please ignore this email.
            </p>
            <p style="font-size: 14px; color: #999;">
              If the button doesn't work, copy and paste this URL into your browser:<br>
              ${verificationUrl}
            </p>
          </div>
        `,
      };

      if (!this.isConfigured) {
        console.log("[EMAIL] Would send verification email:", mailOptions);
        console.log("[EMAIL] Verification URL:", verificationUrl);
      } else {
        await this.transporter.sendMail(mailOptions);
        console.log(`[EMAIL] Verification email sent to ${email}`);
      }
    } catch (error) {
      console.error("[EMAIL] Failed to send verification email:", error);
      throw new Error("Failed to send verification email");
    }
  }

  async sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
    try {
      const mailOptions = {
        from: this.fromEmail,
        to: email,
        subject: "Reset your TrueTale password",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Password Reset Request</h1>
            <p style="font-size: 16px; color: #666;">
              We received a request to reset your password. Click the button below to create a new password.
            </p>
            <div style="margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #4F46E5; color: white; padding: 12px 24px; 
                        text-decoration: none; border-radius: 6px; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p style="font-size: 14px; color: #999;">
              This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
            </p>
            <p style="font-size: 14px; color: #999;">
              If the button doesn't work, copy and paste this URL into your browser:<br>
              ${resetUrl}
            </p>
          </div>
        `,
      };

      if (!this.isConfigured) {
        console.log("[EMAIL] Would send password reset email:", mailOptions);
        console.log("[EMAIL] Reset URL:", resetUrl);
      } else {
        await this.transporter.sendMail(mailOptions);
        console.log(`[EMAIL] Password reset email sent to ${email}`);
      }
    } catch (error) {
      console.error("[EMAIL] Failed to send password reset email:", error);
      throw new Error("Failed to send password reset email");
    }
  }
}
