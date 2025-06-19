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
      subject: "Your Account Password - Welcome!",
      html: `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
					<h2 style="color: #333;">Welcome to BDGAD!</h2>
					<p>Hello ${name},</p>
					<p>Your account has been created successfully. Here are your login credentials:</p>
					
					<div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
						<p><strong>Email:</strong> ${email}</p>
						<p><strong>Password:</strong> <code style="background-color: #e1e1e1; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${password}</code></p>
					</div>
					
					<p style="color: #666; font-size: 14px;">
						<strong>Important:</strong> For security reasons, please change your password after your first login.
					</p>
					
					<p>Best regards</p>
				</div>
			`,
      text: `Welcome to BDGAD!

Hello ${name},

Your account has been created successfully. Here are your login credentials:

Email: ${email}
Password: ${password}

Important: For security reasons, please change your password after your first login.

Best regards`,
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
        subject: "Welcome to BDGAD - Set Your Password",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Welcome to BDGAD!</h2>
            <p>Hello ${user.name},</p>
            <p>An account has been created for you in the BDGAD system. To activate your account, please set your password by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${redirectUrl}/new-password?token=${token}" 
                 style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                Set Your Password
              </a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${redirectUrl}/new-password?token=${token}</p>
            <p><strong>This link will expire in 1 hour.</strong></p>
            <p>If you were not expecting this email, you can safely ignore it.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">
              This is an automated message from the BDGAD Auth Service. Please do not reply to this email.
            </p>
          </div>
        `,
      }

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
      subject: "Your Role Has Been Updated - BDGAD",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Role Update Notification</h2>
          <p>Hello ${name},</p>
          <p>Your role in the BDGAD system has been updated.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>New Role:</strong> ${newRoleName}</p>
          </div>
          
          <p>If you have any questions about your new role or its permissions, please contact your system administrator.</p>
          
          <p>Best regards,<br>BDGAD Team</p>
        </div>
      `,
      text: `Role Update Notification

Hello ${name},

Your role in the BDGAD system has been updated.

New Role: ${newRoleName}

If you have any questions about your new role or its permissions, please contact your system administrator.

Best regards,
BDGAD Team`,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Role change notification sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error("Error sending role change notification:", error);
    throw new Error("Failed to send role change notification");
  }
};

export const sendBanNotificationEmail = async (
  email: string,
  name: string
) => {
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
            <p>If you believe this is a mistake, please contact your system administrator immediately.</p>
          </div>
          
          <p>Best regards,<br>BDGAD Team</p>
        </div>
      `,
      text: `Account Access Suspended

Hello ${name},

Your access to the BDGAD system has been suspended.

Important Notice: You will no longer be able to log in to the system.
If you believe this is a mistake, please contact your system administrator immediately.

Best regards,
BDGAD Team`,
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
      subject: "Account Deletion Notice - BDGAD",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Account Deletion Notice</h2>
          <p>Dear ${name},</p>
          <p>This email is to inform you that your account has been permanently deleted from the BDGAD system.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            ${reason ? `<p><strong>Reason for Deletion:</strong> ${reason}</p>` : ""}
            <p><strong>Important Notice:</strong> All your data associated with this account has been permanently removed from our system.</p>
          </div>
          
          <p>If you believe this action was taken in error, please contact our support team immediately.</p>
          
          <p>Best regards,<br>BDGAD Team</p>
        </div>
      `,
      text: `Account Deletion Notice

Dear ${name},

This email is to inform you that your account has been permanently deleted from the BDGAD system.

${reason ? `Reason for Deletion: ${reason}\n` : ""}
Important Notice: All your data associated with this account has been permanently removed from our system.

If you believe this action was taken in error, please contact our support team immediately.

Best regards,
BDGAD Team`,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Deletion notification sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error("Error sending deletion notification:", error);
    throw new Error("Failed to send deletion notification");
  }
}
