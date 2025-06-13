"use server";

import nodemailer from "nodemailer";

// Create transporter with environment variables
const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

export async function sendBanNotification(email: string, name: string, reason: string) {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Account Access Suspended - BDGAD",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Account Access Suspended</h2>
          <p>Hello ${name},</p>
          <p>Your access to the BDGAD system has been suspended.</p>
          
          <div style="background-color: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Important Notice:</strong> You will no longer be able to log in to the system.</p>
            <p><strong>Reason for suspension:</strong> ${reason}</p>
            <p>If you believe this is a mistake, please contact your system administrator immediately.</p>
          </div>
          
          <p>Best regards,<br>BDGAD Team</p>
        </div>
      `,
      text: `Account Access Suspended

Hello ${name},

Your access to the BDGAD system has been suspended.

Important Notice: You will no longer be able to log in to the system.
Reason for suspension: ${reason}
If you believe this is a mistake, please contact your system administrator immediately.

Best regards,
BDGAD Team`,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Ban notification sent successfully to ${email}`);
    return { success: true };
  } catch (error) {
    console.error("Error sending ban notification:", error);
    return { success: false, error: "Failed to send ban notification" };
  }
}

export async function sendUnbanNotification(email: string, name: string, reason: string) {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Account Access Restored - BDGAD",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a;">Account Access Restored</h2>
          <p>Hello ${name},</p>
          <p>Your access to the BDGAD system has been restored.</p>
          
          <div style="background-color: #dcfce7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Important Notice:</strong> You can now log in to the system again.</p>
            <p><strong>Reason for restoration:</strong> ${reason}</p>
            <p>If you have any questions, please contact your system administrator.</p>
          </div>
          
          <p>Best regards,<br>BDGAD Team</p>
        </div>
      `,
      text: `Account Access Restored

Hello ${name},

Your access to the BDGAD system has been restored.

Important Notice: You can now log in to the system again.
Reason for restoration: ${reason}
If you have any questions, please contact your system administrator.

Best regards,
BDGAD Team`,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Unban notification sent successfully to ${email}`);
    return { success: true };
  } catch (error) {
    console.error("Error sending unban notification:", error);
    return { success: false, error: "Failed to send unban notification" };
  }
} 