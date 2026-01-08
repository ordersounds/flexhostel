# Flexostyle - Luxury Student Accommodation

Find your perfect student accommodation in Okitipupa's luxury residences. Student living, perfected.

## Getting Started

### Prerequisites

- Node.js (recommended: install with [nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- npm or yarn

### Installation

1. Clone the repository:
```sh
git clone <YOUR_GIT_URL>
cd flexostyle
```

2. Install dependencies:
```sh
npm install
```

3. Set up environment variables:
Copy `.env.example` to `.env` and configure your Supabase credentials.

4. Start the development server:
```sh
npm run dev
```

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI**: shadcn/ui, Tailwind CSS
- **Backend**: Supabase
- **Payments**: Paystack integration
- **Deployment**: Vercel/Netlify

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   └── landlord/       # Landlord dashboard components
├── pages/              # Page components
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
├── integrations/       # External service integrations
└── assets/             # Static assets
```

## Deployment

Build for production:
```sh
npm run build
```

Preview production build:
```sh
npm run preview
```
