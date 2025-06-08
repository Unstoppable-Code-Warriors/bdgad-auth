This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Environment Setup

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/database_name

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here

# Default System Admin Account
SYSTEM_ADMIN_EMAIL=admin@example.com
SYSTEM_ADMIN_PASSWORD=your_secure_password_here

# Email Configuration (for password reset functionality)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password-here

# Frontend URL (for password reset links)
AUTH_URL=http://localhost:3000
```

### Email Configuration Notes

For Gmail with custom domain alias, you'll need to:

1. Enable 2-factor authentication on your Google account
2. Add your custom domain as an alias in Gmail settings
3. Generate an "App Password" for this application
4. Use the app password as `EMAIL_PASSWORD` (not your regular Gmail password)
5. Set `EMAIL_USER` to your custom domain email (e.g., `noreply@yourdomain.com`)

For other email providers, adjust the service configuration in `src/backend/utils/emailService.ts`.

## Database Setup

This application uses Drizzle ORM with PostgreSQL. The system will automatically create a default system admin account on startup using the credentials from your environment variables.

1. Set up your PostgreSQL database
2. Configure the `DATABASE_URL` in your `.env` file
3. Run database migrations:
    ```bash
    npm run db:generate
    npm run db:migrate
    ```
4. Set your desired system admin credentials in the `.env` file
5. Start the application - the default admin will be created automatically

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

-   [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
-   [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
