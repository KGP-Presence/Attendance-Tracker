import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config("./.env");

// Create a transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async (to, otp) => {
  const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OTP Verification - Attendance Tracker</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                📍 Attendance Tracker
            </h1>
            <p style="margin: 10px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">Secure Verification</p>
        </div>

        <!-- Main Content -->
        <div style="padding: 40px 30px; text-align: center;">
            
            <h2 style="color: #333333; font-size: 24px; margin: 0 0 10px 0; font-weight: 600;">
                Verify Your Identity
            </h2>
            
            <p style="color: #666666; font-size: 16px; margin: 0 0 30px 0; line-height: 1.6;">
                Welcome! Use the One-Time Password (OTP) below to verify your account and access Attendance Tracker.
            </p>

            <!-- OTP Box -->
            <div style="background-color: #f9f9f9; border: 2px solid #667eea; border-radius: 12px; padding: 30px; margin: 30px 0;">
                <p style="color: #999999; font-size: 13px; margin: 0 0 15px 0; text-transform: uppercase; letter-spacing: 1px;">Your OTP Code</p>
                
                <div style="background-color: #ffffff; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; margin: 15px 0;">
                    <h3 style="margin: 0; color: #667eea; font-size: 48px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                        ${otp}
                    </h3>
                </div>
                
                <p style="color: #999999; font-size: 12px; margin: 15px 0 0 0;">This code expires in <strong>10 minutes</strong></p>
            </div>

            <!-- Instructions -->
            <div style="background-color: #fffbeb; border-left: 4px solid #fbbf24; padding: 15px; border-radius: 4px; text-align: left; margin: 20px 0;">
                <p style="color: #333333; font-size: 14px; margin: 0;">
                    <strong>⚠️ Important:</strong>
                </p>
                <ul style="color: #666666; font-size: 14px; margin: 8px 0 0 0; padding-left: 20px;">
                    <li>Never share this OTP with anyone</li>
                    <li>Attendance Tracker team will never ask for your OTP</li>
                    <li>This OTP is valid for 10 minutes only</li>
                </ul>
            </div>

            <!-- Action Button -->
            <a href="{{VERIFICATION_LINK}}" style="display: inline-block; background-color: #667eea; color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; margin: 25px 0; font-size: 16px; font-weight: 600; transition: background-color 0.3s;">
                Verify Now
            </a>

            <p style="color: #666666; font-size: 13px; margin: 20px 0 0 0;">
                Didn't request this? You can safely ignore this email.
            </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f5f5f5; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
            <p style="color: #999999; font-size: 12px; margin: 0 0 10px 0;">
                © 2026 Attendance Tracker. All rights reserved.
            </p>
            
            <div style="margin: 15px 0;">
                <a href="#" style="color: #667eea; text-decoration: none; font-size: 12px; margin: 0 10px;">Visit Website</a>
                <span style="color: #ddd;">|</span>
                <a href="#" style="color: #667eea; text-decoration: none; font-size: 12px; margin: 0 10px;">Support</a>
                <span style="color: #ddd;">|</span>
                <a href="#" style="color: #667eea; text-decoration: none; font-size: 12px; margin: 0 10px;">Privacy Policy</a>
            </div>

            <p style="color: #999999; font-size: 11px; margin: 10px 0 0 0; line-height: 1.6;">
                This is an automated email. Please do not reply to this message.<br>
                For support, contact us at support@attendancetracker.com
            </p>
        </div>
    </div>
</body>
</html>`;
  try {
    await transporter.sendMail({
      to: to,
      subject: 'Your OTP Code',
      text: `Your OTP code is: ${otp}`,
      html: HTML,
    })
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
}

sendEmail("harshitcq@gmail.com", "123456")

// export { sendEmail };