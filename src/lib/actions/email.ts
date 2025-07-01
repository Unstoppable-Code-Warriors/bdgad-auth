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
      subject: "Tài khoản bị tạm ngừng - BDGAD",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Tài khoản bị tạm ngừng</h2>
          <p>Xin chào ${name},</p>
          <p>Quyền truy cập của bạn vào hệ thống BDGAD đã bị tạm ngừng.</p>
          
          <div style="background-color: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Thông báo quan trọng:</strong> Bạn sẽ không thể đăng nhập vào hệ thống.</p>
            <p><strong>Lý do tạm ngừng:</strong> ${reason}</p>
            <p>Nếu bạn cho rằng đây là sự nhầm lẫn, vui lòng liên hệ với quản trị viên hệ thống ngay lập tức.</p>
          </div>
          
          <p>Trân trọng,<br>Đội ngũ BDGAD</p>
        </div>
      `,
      text: `Tài khoản bị tạm ngừng

Xin chào ${name},

Quyền truy cập của bạn vào hệ thống BDGAD đã bị tạm ngừng.

Thông báo quan trọng: Bạn sẽ không thể đăng nhập vào hệ thống.
Lý do tạm ngừng: ${reason}
Nếu bạn cho rằng đây là sự nhầm lẫn, vui lòng liên hệ với quản trị viên hệ thống ngay lập tức.

Trân trọng,
Đội ngũ BDGAD`,
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
      subject: "Tài khoản được khôi phục - BDGAD",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a;">Tài khoản được khôi phục</h2>
          <p>Xin chào ${name},</p>
          <p>Quyền truy cập của bạn vào hệ thống BDGAD đã được khôi phục.</p>
          
          <div style="background-color: #dcfce7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Thông báo quan trọng:</strong> Bây giờ bạn có thể đăng nhập vào hệ thống trở lại.</p>
            <p><strong>Lý do khôi phục:</strong> ${reason}</p>
            <p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với quản trị viên hệ thống.</p>
          </div>
          
          <p>Trân trọng,<br>Đội ngũ BDGAD</p>
        </div>
      `,
      text: `Tài khoản được khôi phục

Xin chào ${name},

Quyền truy cập của bạn vào hệ thống BDGAD đã được khôi phục.

Thông báo quan trọng: Bây giờ bạn có thể đăng nhập vào hệ thống trở lại.
Lý do khôi phục: ${reason}
Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với quản trị viên hệ thống.

Trân trọng,
Đội ngũ BDGAD`,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Unban notification sent successfully to ${email}`);
    return { success: true };
  } catch (error) {
    console.error("Error sending unban notification:", error);
    return { success: false, error: "Failed to send unban notification" };
  }
} 