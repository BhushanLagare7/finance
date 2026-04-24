# 📊 Finance Dashboard

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Hono](https://img.shields.io/badge/Hono-API-orange?style=flat)](https://hono.dev/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-C5F74F?style=flat&logo=drizzle)](https://orm.drizzle.team/)

A modern, responsive, and full-featured personal finance management platform. Track your income, manage expenses, categorize transactions, and connect directly to your bank to sync transactions automatically.

## 🚀 Key Features

- **📈 Interactive Dashboards:** Beautiful, interactive charts and insights using Recharts.
- **🏦 Bank Connections:** Link your bank accounts securely using the Plaid API.
- **📂 CSV Imports:** Easily import and export transactions via CSV files.
- **🔐 Secure Authentication:** Seamless user login and management powered by Clerk.
- **💳 Premium Subscriptions:** Unlock advanced features with a Lemon Squeezy integration paywall.
- **⚡ Fast & Scalable Backend:** Built with Hono.js on the Edge, backed by Neon Serverless Postgres and Drizzle ORM.
- **🎨 Modern UI:** Fully responsive, accessible, and polished interface built with Tailwind CSS v4 and shadcn/ui.

## 🛠️ Getting Started

### Prerequisites

Ensure you have the following installed and set up:

- **Node.js** (v18+) or **Bun**
- API Keys for: [Clerk](https://clerk.com/), [Neon Database](https://neon.tech/), [Plaid](https://plaid.com/), and [Lemon Squeezy](https://www.lemonsqueezy.com/)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/BhushanLagare7/finance.git
   cd finance
   ```

2. **Install dependencies**
   This project relies on Bun for package management:

   ```bash
   bun install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory. Use the following template and replace the placeholder values with your actual API keys:

   ```env
   # Clerk Auth
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
   NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/

   # Database (Neon Serverless Postgres)
   DATABASE_URL=your_neon_db_url

   # Application URL
   NEXT_PUBLIC_APP_URL=http://localhost:3000

   # Plaid Integration
   PLAID_CLIENT_TOKEN=your_plaid_client_token
   PLAID_SECRET_TOKEN=your_plaid_secret_token

   # Lemon Squeezy (Subscriptions)
   LEMONSQUEEZY_STORE_ID=your_store_id
   LEMONSQUEEZY_PRODUCT_ID=your_product_id
   LEMONSQUEEZY_API_KEY=your_api_key
   LEMONSQUEEZY_WEBHOOK_SECRET=your_webhook_secret
   ```

4. **Database Setup**
   Generate and apply the Drizzle schema migrations to your Neon database:

   ```bash
   bun run db:generate
   bun run db:migrate
   ```

   _(Optional)_ If you have seed data, you can run `bun run db:seed`.

5. **Start the Development Server**
   ```bash
   bun run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

## 🤝 Getting Help

If you encounter any issues, have questions, or want to report a bug:

- Open an issue in the GitHub **Issues** tab of this repository.
- Refer to the official documentation for the core technologies used in this project:
  - [Next.js Documentation](https://nextjs.org/docs)
  - [Hono.js](https://hono.dev/)
  - [Drizzle ORM](https://orm.drizzle.team/)
  - [Plaid API Docs](https://plaid.com/docs/)
  - [Lemon Squeezy Docs](https://docs.lemonsqueezy.com/)

## 🧑‍💻 Maintainers & Contributing

**Maintainer:** [BhushanLagare7](https://github.com/BhushanLagare7)

We welcome contributions from the community! Whether it's fixing a bug, improving documentation, or adding a new feature, your help is appreciated.

Please see our [Contributing Guidelines](docs/CONTRIBUTING.md) for detailed instructions on how to submit pull requests, report bugs, and suggest enhancements.
