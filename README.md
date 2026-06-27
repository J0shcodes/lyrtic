# Lyrtic - AI-Powered Customer Intelligence Platform

Lyrtic is a modern SaaS application that helps small and medium-sized businesses (SMBs) understand their customers through AI-driven insights. It predicts churn risk, analyzes customer behavior, and generates actionable recommendations.

## Features

- **AI-Powered Insights**: Claude-powered natural language analysis of customer data
- **Churn Prediction**: ML-based identification of at-risk customers
- **Customer Health Scoring**: Composite scoring based on transaction history and engagement
- **Smart Segmentation**: Automatic customer grouping by behavior and risk level
- **CSV Import**: Easy data upload with automatic validation and mapping
- **Real-Time Analytics**: Live dashboards with key customer metrics
- **Enterprise Security**: AWS Aurora PostgreSQL with encryption and compliance

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Node.js
- **Database**: Amazon Aurora PostgreSQL with IAM authentication
- **AI/ML**: Anthropic Claude API
- **Storage**: Vercel Blob (for CSV files)
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- AWS Aurora PostgreSQL database with IAM authentication
- Anthropic API key (for AI features)

### Environment Variables

Create a `.env.local` file with the following variables:

```bash
# Database
PGHOST=your-aurora-host.rds.amazonaws.com
PGUSER=your-db-user
PGDATABASE=lyrtic
AWS_REGION=us-east-1
AWS_ROLE_ARN=arn:aws:iam::ACCOUNT:role/YOUR_ROLE

# AI
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx

# Auth
BETTER_AUTH_SECRET=your-random-secret-key
```

### Installation

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Set up the database schema**
   ```bash
   node scripts/setup-schema.js
   ```

3. **Start the development server**
   ```bash
   pnpm dev
   ```

4. **Open in browser**
   ```
   http://localhost:3000
   ```

## Database Schema

The application uses the following main tables:

- `users` - User accounts and profiles
- `organizations` - Business workspaces (multi-tenancy boundary)
- `memberships` - User-to-organization role mappings
- `customers` - Individual customer records
- `transactions` - Customer transaction history
- `events` - Customer behavioral events
- `segments` - Customer segments based on rules
- `insights` - AI-generated insights and analysis
- `imports` - CSV import history and status
- `sessions` - User authentication sessions

## API Routes

### Authentication
- `POST /api/auth/sign-up` - Create new account
- `POST /api/auth/sign-in` - Login
- `POST /api/auth/logout` - Logout

### Dashboard
- `GET /api/dashboard/metrics` - Get key metrics
- `GET /api/customers` - List customers
- `POST /api/import` - Import CSV data
- `POST /api/insights/ask` - Ask AI question

## Project Structure

```
app/
├── api/                   # API routes
├── dashboard/             # Protected dashboard pages
├── sign-in/               # Authentication page
├── sign-up/               # Registration page
├── page.tsx               # Landing page
└── layout.tsx             # Root layout

lib/
├── auth-service.ts        # Authentication logic
├── auth-middleware.ts     # Auth verification
├── db.ts                  # Database connection
└── types.ts               # TypeScript types

scripts/
└── 001-setup-lyrtic-schema.sql  # Database schema
```

## Key Features Implemented

### Phase 1: Landing Page ✅
- Marketing website with hero, features, pricing sections
- Responsive design with modern UI
- CTA for sign-up

### Phase 2: Authentication ✅
- Email/password registration and login
- Session management with secure cookies
- Protected dashboard routes

### Phase 3: Database ✅
- Aurora PostgreSQL schema with multi-tenancy support
- 10+ tables for customers, transactions, events, etc.
- Automatic timestamp management with triggers

### Phase 4: Dashboard ✅
- Overview page with key metrics
- Customer management page
- Segments page (stub)
- CSV import page
- AI insights page
- Settings page

### Phase 5: API Integration ✅
- Authentication endpoints
- Dashboard metrics endpoint
- Customer listing endpoint
- CSV import endpoint
- AI insights endpoint

## Future Enhancements

### Phase 6: AI Features
- Real-time churn prediction model
- Automated insight generation
- Natural language query builder
- Customer recommendation engine

### Phase 7: Advanced Analytics
- Cohort analysis
- Funnel visualization
- Custom dashboard builder
- Export reports (PDF, Excel)

### Phase 8: Team Collaboration
- Team member invitation
- Role-based access control (RBAC)
- Activity audit logs
- Team workspaces

### Phase 9: Integrations
- Stripe payment integration
- Shopify customer sync
- HubSpot CRM integration
- Salesforce integration

### Phase 10: Mobile
- Mobile app (React Native)
- Mobile-optimized dashboard
- Push notifications

## Security

- **Data Encryption**: All data encrypted in transit (HTTPS) and at rest
- **Authentication**: Secure session tokens with 30-day expiration
- **Authorization**: Row-level security via organization_id scoping
- **Database**: AWS Aurora PostgreSQL with IAM authentication
- **Rate Limiting**: API rate limiting (to be implemented)
- **CSRF Protection**: Built-in Next.js CSRF protection

## Performance

- **Frontend**: Optimized with Next.js ISR and caching
- **Database**: Connection pooling via RDS Proxy
- **API**: Lightweight endpoints with minimal data transfer
- **Build**: Turbopack for fast development builds

## Deployment

### Deploy to Vercel

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel settings
3. Deploy with `git push`

```bash
vercel env add PGHOST
vercel env add PGUSER
vercel env add PGDATABASE
vercel env add AWS_REGION
vercel env add AWS_ROLE_ARN
vercel env add ANTHROPIC_API_KEY
vercel deploy
```

## Testing

### Demo Account

- Email: `demo@example.com`
- Password: `demo123456`

### Test Data

Use the CSV import feature to upload test customer data:

```csv
email,full_name,phone,status
john@acme.com,John Smith,555-0001,active
jane@techstart.com,Jane Doe,555-0002,active
bob@global.com,Bob Johnson,555-0003,inactive
```

## Development Tips

### Database Debugging

```bash
# Connect to database
psql -h $PGHOST -U $PGUSER -d $PGDATABASE

# View table schema
\d customers

# View data
SELECT * FROM customers LIMIT 10;
```

### Common Issues

**"Module not found: Can't resolve '@anthropic-ai/sdk'"**
- Run `pnpm install @anthropic-ai/sdk`

**Database connection fails**
- Check AWS credentials are set correctly
- Verify security group allows inbound connections
- Ensure AWS role has RDS Signer permissions

**Authentication not working**
- Check cookies are enabled in browser
- Verify session token is stored correctly
- Check auth token expiration (30 days)

## License

MIT - See LICENSE file for details

## Support

For issues, questions, or feature requests, please open a GitHub issue or contact support@lyrtic.ai

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Roadmap

- [ ] Mobile app
- [ ] Advanced ML models
- [ ] Third-party integrations
- [ ] Custom branding
- [ ] White-label SaaS
- [ ] API for partners
- [ ] Webhook support
- [ ] GraphQL API

---

Built with ❤️ for SMBs by Lyrtic
