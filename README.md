# Nelliy's Rewards - Ethiopia's Premier Coffee Loyalty Platform

A fullstack Next.js application for a world-class coffee shop loyalty rewards platform.

## Features

### Customer Features
- QR Code scanning for instant point earning
- Receipt upload with AI-powered OCR
- Loyalty points system with tier membership (Bronze, Silver, Gold, VIP)
- Rewards redemption
- Order ahead functionality
- Referral program
- Birthday rewards
- Multi-language support (English, Amharic, Afaan Oromo)

### Admin Features
- Real-time KPI dashboard
- AI analytics (customer predictions, sales trends, churn detection)
- Employee performance tracking
- Inventory management
- Fraud detection system
- Multi-branch management
- Receipt approval system
- Campaign management
- Bulk notifications (SMS, WhatsApp, Push, Email)

## Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS, Framer Motion
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Auth**: NextAuth.js / Firebase Auth
- **OCR**: Google Vision API
- **Notifications**: Twilio SMS, WhatsApp API, Firebase Push
- **Payments**: Chapa, Telebirr, Stripe (ready)

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd nelliy-rewards-fullstack
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database and API credentials
```

4. Set up the database:
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Landing page
│   ├── login/             # Login page
│   ├── register/          # Registration page
│   ├── dashboard/         # Customer dashboard
│   ├── scan/              # QR scanning page
│   ├── upload/            # Receipt upload page
│   └── admin/             # Admin dashboard
├── components/
│   ├── ui/                # Reusable UI components
│   └── providers/         # Context providers
├── lib/                   # Utility functions
└── prisma/                # Database schema
```

## Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

### Docker
```bash
docker build -t nelliy-rewards .
docker run -p 3000:3000 nelliy-rewards
```

## License

MIT License - Created with ☕ in Ethiopia