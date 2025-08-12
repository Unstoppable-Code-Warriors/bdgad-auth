import nodemailer from "nodemailer";

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;

console.log(`Email configuration: Using ${EMAIL_USER} for SMTP authentication`);

// Create transporter with enhanced debugging
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASSWORD,
  },
});

export const sendPasswordResetEmail = async (
  redirectUrl: string,
  email: string,
  resetToken: string,
  userName: string
) => {
  const resetUrl = `${redirectUrl}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: EMAIL_USER,
    to: email,
    subject: "Yêu Cầu Đặt Lại Mật Khẩu - BDGAD Auth",
    html: `
		<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
			<h2 style="color: #333;">Yêu Cầu Đặt Lại Mật Khẩu</h2>
			<p>Xin chào ${userName},</p>
			<p>Bạn đã yêu cầu đặt lại mật khẩu. Vui lòng nhấn vào nút bên dưới để tiếp tục:</p>
			<div style="text-align: center; margin: 30px 0;">
				<a href="${resetUrl}" 
					 style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
					Đặt Lại Mật Khẩu
				</a>
			</div>
			<p>Hoặc sao chép và dán liên kết sau vào trình duyệt của bạn:</p>
			<p style="word-break: break-all; color: #666;">${resetUrl}</p>
			<p><strong>Liên kết này sẽ hết hạn sau 1 giờ.</strong></p>
			<p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
			<hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
			<p style="color: #666; font-size: 12px;">
				Đây là email tự động từ Hệ Thống Xác Thực BDGAD. Vui lòng không trả lời email này.
			</p>
		</div>
	`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}`);
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw new Error("Failed to send password reset email");
  }
};

export const sendNewPasswordEmail = async (
  redirectUrl: string,
  email: string,
  resetToken: string,
  userName: string
) => {
  const resetUrl = `${redirectUrl}/new-password?token=${resetToken}`;

  const mailOptions = {
    from: EMAIL_USER,
    to: email,
    subject: "BDGAD - Kích Hoạt Tài Khoản & Thiết Lập Mật Khẩu",
    html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Chào mừng đến với hệ thống BDGAD</h2>
      <p>Xin chào ${userName},</p>
      <p>Một tài khoản đã được khởi tạo cho bạn trong hệ thống BDGAD. Để hoàn tất quá trình kích hoạt, vui lòng thiết lập mật khẩu bằng cách nhấn vào nút bên dưới:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" 
           style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
          Thiết lập mật khẩu
        </a>
      </div>
      <p>Hoặc bạn có thể sao chép và dán liên kết sau vào trình duyệt:</p>
      <p style="word-break: break-all; color: #666;">${resetUrl}</p>
      <p><strong>Lưu ý: Liên kết này chỉ có hiệu lực trong vòng 1 giờ.</strong></p>
      <p>Nếu bạn không yêu cầu tạo tài khoản hoặc không nhận ra nội dung email này, vui lòng bỏ qua thông báo.</p>
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
      <p style="color: #666; font-size: 12px;">
        Đây là email tự động được gửi từ hệ thống xác thực BDGAD. Vui lòng không phản hồi lại email này.
      </p>
    </div>
  `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Redirect to set password email sent to ${email}`);
  } catch (error) {
    console.error("Error sending redirect to set password email:", error);
    throw new Error("Failed to send redirect to set password email");
  }
};

export const sendPasswordResetConfirmationEmail = async (
  email: string,
  userName: string
) => {
  const mailOptions = {
    from: EMAIL_USER,
    to: email,
    subject: "Password Reset Successful - BDGAD Auth",
    html: `
			<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
				<h2 style="color: #28a745;">Password Reset Successful</h2>
				<p>Hello ${userName},</p>
				<p>Your password has been successfully reset.</p>
				<p>If you didn't make this change, please contact our support team immediately.</p>
				<hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
				<p style="color: #666; font-size: 12px;">
					This is an automated email from BDGAD Auth Service. Please do not reply to this email.
				</p>
			</div>
		`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password reset confirmation email sent to ${email}`);
  } catch (error) {
    console.error("Error sending password reset confirmation email:", error);
    // Don't throw error here as the password reset was successful
  }
};

export const sendSetYourPasswordEmail = async (
  email: string,
  userName: string
) => {
  const mailOptions = {
    from: EMAIL_USER,
    to: email,
    subject: "Set Your Password - BDGAD Auth",
    html: `
			<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
				<h2 style="color: #28a745;">Set Your Password</h2>
				<p>Hello ${userName},</p>
				<p>Your account has been created. To activate your account.</p>
				<p>If you didn't make this change, please contact our support team immediately.</p>
				<hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
				<p style="color: #666; font-size: 12px;">
					This is an automated email from BDGAD Auth Service. Please do not reply to this email.
				</p>
			</div>
		`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Set your password email sent to ${email}`);
  } catch (error) {
    console.error("Error sending set your password email:", error);
    // Don't throw error here as the password reset was successful
  }
};
