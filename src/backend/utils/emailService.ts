import nodemailer from "nodemailer"

const EMAIL_USER = process.env.EMAIL_USER
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD

console.log(`Email configuration: Using ${EMAIL_USER} for SMTP authentication`)

// Create transporter with enhanced debugging
const transporter = nodemailer.createTransport({
	service: "gmail",
	auth: {
		user: EMAIL_USER,
		pass: EMAIL_PASSWORD,
	},
})

export const sendPasswordResetEmail = async (
	redirectUrl: string,
	email: string,
	resetToken: string,
	userName: string
) => {
	const resetUrl = `${redirectUrl}/reset-password?token=${resetToken}`

	const mailOptions = {
		from: EMAIL_USER,
		to: email,
		subject: "Password Reset Request - BDGAD Auth",
		html: `
			<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
				<h2 style="color: #333;">Password Reset Request</h2>
				<p>Hello ${userName},</p>
				<p>You have requested to reset your password. Click the button below to reset your password:</p>
				<div style="text-align: center; margin: 30px 0;">
					<a href="${resetUrl}" 
						 style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
						Reset Password
					</a>
				</div>
				<p>Or copy and paste this link in your browser:</p>
				<p style="word-break: break-all; color: #666;">${resetUrl}</p>
				<p><strong>This link will expire in 1 hour.</strong></p>
				<p>If you didn't request this password reset, please ignore this email.</p>
				<hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
				<p style="color: #666; font-size: 12px;">
					This is an automated email from BDGAD Auth Service. Please do not reply to this email.
				</p>
			</div>
		`,
	}

	try {
		await transporter.sendMail(mailOptions)
		console.log(`Password reset email sent to ${email}`)
	} catch (error) {
		console.error("Error sending password reset email:", error)
		throw new Error("Failed to send password reset email")
	}
}

export const sendNewPasswordEmail = async (
	redirectUrl: string,
	email: string,
	resetToken: string,
	userName: string
) => {
	const resetUrl = `${redirectUrl}/new-password?token=${resetToken}`

	const mailOptions = {
		from: EMAIL_USER,
		to: email,
		subject: "Welcome to BDGAD - Set Your Password",
		html: `
			<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
				<h2 style="color: #333;">Welcome to BDGAD!</h2>
				<p>Hello ${userName},</p>
				<p>An account has been created for you in the BDGAD system. To activate your account, please set your password by clicking the button below:</p>
				<div style="text-align: center; margin: 30px 0;">
					<a href="${resetUrl}" 
						 style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
						Set Your Password
					</a>
				</div>
				<p>Or copy and paste this link into your browser:</p>
				<p style="word-break: break-all; color: #666;">${resetUrl}</p>
				<p><strong>This link will expire in 1 hour.</strong></p>
				<p>If you were not expecting this email, you can safely ignore it.</p>
				<hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
				<p style="color: #666; font-size: 12px;">
					This is an automated message from the BDGAD Auth Service. Please do not reply to this email.
				</p>
			</div>
		`,
	}

	try {
		await transporter.sendMail(mailOptions)
		console.log(`Redirect to set password email sent to ${email}`)
	} catch (error) {
		console.error("Error sending redirect to set password email:", error)
		throw new Error("Failed to send redirect to set password email")
	}
}



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
	}

	try {
		await transporter.sendMail(mailOptions)
		console.log(`Password reset confirmation email sent to ${email}`)
	} catch (error) {
		console.error("Error sending password reset confirmation email:", error)
		// Don't throw error here as the password reset was successful
	}
}
