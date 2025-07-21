import nodemailer from "nodemailer";

// Create transporter with environment variables
const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail", // You can change this based on your email provider
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

export const sendPasswordEmail = async (
  email: string,
  password: string,
  name: string
) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Mật khẩu tài khoản của bạn - Chào mừng!",
      html: `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
					<h2 style="color: #333;">Chào mừng đến với BDGAD!</h2>
					<p>Xin chào ${name},</p>
					<p>Tài khoản của bạn đã được tạo thành công. Dưới đây là thông tin đăng nhập của bạn:</p>
					<div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
						<p><strong>Email:</strong> ${email}</p>
						<p><strong>Mật khẩu:</strong> <code style="background-color: #e1e1e1; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${password}</code></p>
					</div>
					<p style="color: #666; font-size: 14px;">
						<strong>Lưu ý:</strong> Vì lý do bảo mật, hãy đổi mật khẩu sau khi đăng nhập lần đầu tiên.
					</p>
					<p>Trân trọng</p>
				</div>
			`,
      text: `Chào mừng đến với BDGAD!

Xin chào ${name},

Tài khoản của bạn đã được tạo thành công. Dưới đây là thông tin đăng nhập của bạn:

Email: ${email}
Mật khẩu: ${password}

Lưu ý: Vì lý do bảo mật, hãy đổi mật khẩu sau khi đăng nhập lần đầu tiên.

Trân trọng`,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Password email sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error("Error sending password email:", error);
    throw new Error("Failed to send password email");
  }
};

export const sendPasswordEmailsToUsers = async (
  userResults: Array<{
    user: { email: string; name: string };
    token: string;
  }>,
  redirectUrl: string
) => {
  try {
    const transporter = createTransporter();

    // Create array of email promises
    const emailPromises = userResults.map(({ user, token }) => {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: "Chào mừng đến với BDGAD - Đặt mật khẩu của bạn",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Chào mừng đến với BDGAD!</h2>
            <p>Xin chào ${user.name},</p>
            <p>Một tài khoản đã được tạo cho bạn trong hệ thống BDGAD. Để kích hoạt tài khoản, vui lòng đặt mật khẩu bằng cách nhấn vào nút bên dưới:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${redirectUrl}/new-password?token=${token}" 
                 style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                Đặt mật khẩu
              </a>
            </div>
            <p>Hoặc sao chép và dán liên kết này vào trình duyệt của bạn:</p>
            <p style="word-break: break-all; color: #666;">${redirectUrl}/new-password?token=${token}</p>
            <p><strong>Liên kết này sẽ hết hạn sau 1 giờ.</strong></p>
            <p>Nếu bạn không mong đợi email này, bạn có thể bỏ qua nó.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">
              Đây là email tự động từ BDGAD Auth Service. Vui lòng không trả lời email này.
            </p>
          </div>
        `,
      };

      return transporter.sendMail(mailOptions);
    });

    // Send all emails concurrently
    await Promise.all(emailPromises);

    console.log(
      `Redirect to set password emails sent successfully to ${userResults.length} users`
    );
    return true;
  } catch (error) {
    console.error("Error sending redirect to set password emails:", error);
    throw new Error("Failed to send redirect to set password emails");
  }
};

export const sendRoleChangeEmail = async (
  email: string,
  name: string,
  newRoleName: string
) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Vai trò của bạn đã được cập nhật - BDGAD",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Thông báo cập nhật vai trò</h2>
          <p>Xin chào ${name},</p>
          <p>Vai trò của bạn trong hệ thống BDGAD đã được cập nhật.</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Vai trò mới:</strong> ${newRoleName}</p>
          </div>
          <p>Nếu bạn có bất kỳ thắc mắc nào về vai trò mới hoặc quyền hạn, vui lòng liên hệ với quản trị viên hệ thống.</p>
          <p>Trân trọng,<br>Đội ngũ BDGAD</p>
        </div>
      `,
      text: `Thông báo cập nhật vai trò

Xin chào ${name},

Vai trò của bạn trong hệ thống BDGAD đã được cập nhật.

Vai trò mới: ${newRoleName}

Nếu bạn có bất kỳ thắc mắc nào về vai trò mới hoặc quyền hạn, vui lòng liên hệ với quản trị viên hệ thống.

Trân trọng,
Đội ngũ BDGAD`,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Role change notification sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error("Error sending role change notification:", error);
    throw new Error("Failed to send role change notification");
  }
};

export const sendBanNotificationEmail = async (email: string, name: string) => {
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
            <p>Nếu bạn cho rằng đây là sự nhầm lẫn, vui lòng liên hệ với quản trị viên hệ thống ngay lập tức.</p>
          </div>
          <p>Trân trọng,<br>Đội ngũ BDGAD</p>
        </div>
      `,
      text: `Tài khoản bị tạm ngừng

Xin chào ${name},

Quyền truy cập của bạn vào hệ thống BDGAD đã bị tạm ngừng.

Thông báo quan trọng: Bạn sẽ không thể đăng nhập vào hệ thống.
Nếu bạn cho rằng đây là sự nhầm lẫn, vui lòng liên hệ với quản trị viên hệ thống ngay lập tức.

Trân trọng,
Đội ngũ BDGAD`,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Ban notification sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error("Error sending ban notification:", error);
    throw new Error("Failed to send ban notification");
  }
};

export async function sendDeletionEmail(
  email: string,
  name: string,
  reason?: string
) {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Thông báo xóa tài khoản - BDGAD",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Thông báo xóa tài khoản</h2>
          <p>Kính gửi ${name},</p>
          <p>Email này thông báo rằng tài khoản của bạn đã bị xóa vĩnh viễn khỏi hệ thống BDGAD.</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            ${reason ? `<p><strong>Lý do xóa:</strong> ${reason}</p>` : ""}
            <p><strong>Thông báo quan trọng:</strong> Tất cả dữ liệu liên quan đến tài khoản này đã bị xóa vĩnh viễn khỏi hệ thống của chúng tôi.</p>
          </div>
          <p>Nếu bạn cho rằng hành động này là nhầm lẫn, vui lòng liên hệ với bộ phận hỗ trợ của chúng tôi ngay lập tức.</p>
          <p>Trân trọng,<br>Đội ngũ BDGAD</p>
        </div>
      `,
      text: `Thông báo xóa tài khoản

Kính gửi ${name},

Email này thông báo rằng tài khoản của bạn đã bị xóa vĩnh viễn khỏi hệ thống BDGAD.

${reason ? `Lý do xóa: ${reason}\n` : ""}
Thông báo quan trọng: Tất cả dữ liệu liên quan đến tài khoản này đã bị xóa vĩnh viễn khỏi hệ thống của chúng tôi.

Nếu bạn cho rằng hành động này là nhầm lẫn, vui lòng liên hệ với bộ phận hỗ trợ của chúng tôi ngay lập tức.

Trân trọng,
Đội ngũ BDGAD`,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Deletion notification sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error("Error sending deletion notification:", error);
    throw new Error("Failed to send deletion notification");
  }
}
