import { Response } from "express";
import nodemailer from "nodemailer";

const SendMail = async (email: string, otp: string, res: Response) => {
  try {
    const transporter = nodemailer.createTransport({
      service: process.env.SMTP_SERVICE,
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"JZ Mart" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your JZ Mart OTP Code",
      html: `
        <div style="max-width: 600px; margin: auto; font-family: 'Poppins', sans-serif; color: #333; background: #f7f7f7; padding: 20px; border-radius: 10px;">
          <div style="background: #fff; padding: 20px; border-radius: 10px; text-align: center;">
            <img src="https://your-logo-url.com/jzmart-logo.png" alt="JZ Mart Logo" style="max-width: 150px; margin-bottom: 20px;" />
            
            <h2 style="color: #C9AF2F; font-family: 'Inter', sans-serif;">Your OTP Code</h2>
            <p style="font-size: 16px;">Use the following OTP to complete your authentication:</p>
            
            <h1 style="background: #C9AF2F; color: #fff; padding: 10px 20px; display: inline-block; border-radius: 5px; font-family: 'Inter', sans-serif;">
              ${otp}
            </h1>
            
            <p style="font-size: 14px; color: #777;">This OTP will expire in 10 minutes.</p>
            
            <hr style="margin: 20px 0; border: 1px solid #C9AF2F;">
            
            <p style="font-size: 14px;">If you did not request this OTP, please ignore this email.</p>
            <p style="font-size: 14px;">Need help? Contact us at 
              <a href="mailto:support@jzmart.com" style="color: #C9AF2F; text-decoration: none;">support@jzmart.com</a>
            </p>
          </div>
          
          <p style="text-align: center; font-size: 12px; color: #999;">
            © ${new Date().getFullYear()} JZ Mart. All rights reserved.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully. Please check your email!",
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to send OTP. Please try again later!";
    return res.status(500).json({
      success: false,
      message,
    });
  }
};

export default SendMail;
