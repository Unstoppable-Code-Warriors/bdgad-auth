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
    generatedPassword: string;
  }>
) => {
  try {
    const transporter = createTransporter();

    // Create array of email promises
    const emailPromises = userResults.map(({ user, generatedPassword }) => {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: "Your Account Password - Welcome!",
        html: `
					<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
						<h2 style="color: #333;">Welcome to BDGAD!</h2>
						<p>Hello ${user.name},</p>
						<p>Your account has been created successfully. Here are your login credentials:</p>
						
						<div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
							<p><strong>Email:</strong> ${user.email}</p>
							<p><strong>Password:</strong> <code style="background-color: #e1e1e1; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${generatedPassword}</code></p>
						</div>
						
						<p style="color: #666; font-size: 14px;">
							<strong>Important:</strong> For security reasons, please change your password after your first login.
						</p>
						
						<p>Best regards</p>
					</div>
				`,
        text: `Welcome to BDGAD!

Hello ${user.name},

Your account has been created successfully. Here are your login credentials:

Email: ${user.email}
Password: ${generatedPassword}

Important: For security reasons, please change your password after your first login.

Best regards`,
      };

      return transporter.sendMail(mailOptions);
    });

    // Send all emails concurrently
    await Promise.all(emailPromises);

    console.log(
      `Password emails sent successfully to ${userResults.length} users`
    );
    return true;
  } catch (error) {
    console.error("Error sending password emails:", error);
    throw new Error("Failed to send password emails");
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
