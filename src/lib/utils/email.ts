import nodemailer from "nodemailer"

// Create transporter with environment variables
const createTransporter = () => {
	return nodemailer.createTransport({
		service: "gmail", // You can change this based on your email provider
		auth: {
			user: process.env.EMAIL_USER,
			pass: process.env.EMAIL_PASSWORD,
		},
	})
}

export const sendPasswordEmail = async (
	email: string,
	password: string,
	name: string
) => {
	try {
		const transporter = createTransporter()

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
		}

		await transporter.sendMail(mailOptions)
		console.log(`Password email sent successfully to ${email}`)
		return true
	} catch (error) {
		console.error("Error sending password email:", error)
		throw new Error("Failed to send password email")
	}
}
