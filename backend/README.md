# PulseCal Backend API

Enterprise-grade healthcare SaaS backend built with Node.js, Express, TypeScript, and PostgreSQL.

## Features

- **Authentication & Authorization**: Firebase Authentication with RBAC, automatic user sync
- **User Management**: Complete user profiles with role-based access
- **Appointments**: Full CRUD operations, rescheduling, cancellation, check-in
- **Medical Records**: Encrypted medical records with HIPAA compliance
- **Prescriptions**: Prescription management with refill requests
- **Insurance**: Secure insurance information management
- **Payments**: Payment processing with encrypted card data
- **Emergency Contacts**: Patient emergency contact management
- **Reminders**: Medication and appointment reminders
- **Telemedicine**: Virtual consultation sessions
- **Health Analytics**: Patient health metrics tracking
- **Clinics**: Healthcare facility management
- **Real-time Chat**: Socket.IO-based patient-doctor communication
- **Queue Management**: Patient queue system
- **Data Export**: GDPR-compliant data export
- **Admin & Audit**: System administration and audit logging

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL 15+ with Prisma ORM
- **Cache/Jobs**: Redis with BullMQ
- **Real-time**: Socket.IO with Redis adapter
- **Authentication**: Firebase Admin SDK
- **Validation**: Joi
- **Security**: Helmet, CORS, rate limiting
- **Logging**: Pino

## Project Structure

```
backend/
├── src/
│   ├── app.ts                 # Express app setup
│   ├── server.ts              # Server entry point
│   ├── routes.ts              # Route definitions
│   ├── config/                # Configuration files
│   ├── modules/               # Feature modules
│   │   ├── auth/
│   │   ├── users/
│   │   ├── appointments/
│   │   ├── medicalRecords/
│   │   ├── prescriptions/
│   │   ├── insurance/
│   │   ├── payments/
│   │   ├── emergencyContacts/
│   │   ├── reminders/
│   │   ├── telemedicine/
│   │   ├── healthAnalytics/
│   │   ├── clinics/
│   │   ├── chat/
│   │   ├── queue/
│   │   ├── importExport/
│   │   └── admin/
│   ├── middlewares/           # Express middlewares
│   ├── utils/                 # Utility functions
│   ├── jobs/                  # Background jobs
│   ├── socket/                # Socket.IO handlers
│   └── types/                 # TypeScript types
├── prisma/
│   └── schema.prisma          # Database schema
└── package.json
```

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 15+ (or AWS RDS)
- Redis (or AWS ElastiCache)
- Firebase project with Authentication enabled

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up Firebase:
   - Go to Firebase Console → Project Settings → Service Accounts
   - Generate new private key
   - Copy the JSON content

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
# Important: Set FIREBASE_SERVICE_ACCOUNT_KEY with your Firebase service account JSON
```

4. Set up database:
```bash
npm run prisma:generate
npm run prisma:migrate
```

5. Start the server:
```bash
# Development
npm run dev

# Production (for AWS)
npm run build
npm start
# or
node server.js
```

### Firebase Configuration

1. Enable Authentication in Firebase Console
2. Configure sign-in methods (Email/Password, Google, etc.)
3. Set custom claims for user roles (optional):
   ```javascript
   admin.auth().setCustomUserClaims(uid, { role: 'DOCTOR' });
   ```
4. Add service account key to `.env` as `FIREBASE_SERVICE_ACCOUNT_KEY`

## Environment Variables

See `.env.example` for all required environment variables.

Key variables:
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_HOST`, `REDIS_PORT`: Redis configuration
- `JWT_SECRET`, `JWT_REFRESH_SECRET`: JWT signing keys
- `ENCRYPTION_KEY`: AES-256 encryption key (32 characters)
- `SMTP_*`: Email configuration
- `CORS_ORIGIN`: Frontend URL

## API Endpoints

All endpoints are prefixed with `/api/v1`.

### Authentication (Firebase-based)
- `POST /auth/sync-profile` - Sync user profile after Firebase auth
- `GET /auth/profile` - Get current user profile
- `PUT /auth/role/:firebaseUid` - Update user role (admin only)

**Note**: All authentication (login, signup, password reset) is handled by Firebase on the frontend. The backend verifies Firebase tokens and syncs user data.

### Users
- `GET /users/profile` - Get current user profile
- `PUT /users/profile` - Update profile
- `GET /users` - List users (staff only)
- `GET /users/:id` - Get user by ID (staff only)

### Appointments
- `POST /appointments` - Create appointment
- `GET /appointments` - List appointments
- `GET /appointments/:id` - Get appointment
- `PUT /appointments/:id` - Update appointment
- `POST /appointments/:id/reschedule` - Reschedule
- `POST /appointments/:id/cancel` - Cancel
- `POST /appointments/:id/checkin` - Check in

### Medical Records
- `POST /medical-records` - Create record
- `GET /medical-records` - List records
- `GET /medical-records/:id` - Get record
- `PUT /medical-records/:id` - Update record
- `DELETE /medical-records/:id` - Delete record

### Prescriptions
- `POST /prescriptions` - Create prescription
- `GET /prescriptions` - List prescriptions
- `GET /prescriptions/:id` - Get prescription
- `POST /prescriptions/:id/refill` - Request refill
- `PUT /prescriptions/:id` - Update prescription

### And more...

See individual module routes for complete API documentation.

## Security

- **Encryption**: AES-256 encryption for sensitive data
- **Authentication**: Firebase Authentication (handled on frontend)
- **Token Verification**: Firebase Admin SDK verifies tokens on backend
- **Authorization**: Role-based access control (RBAC)
- **Rate Limiting**: API rate limiting
- **Audit Logging**: All sensitive actions logged
- **HIPAA Compliance**: Encrypted PHI, access controls, audit trails
- **GDPR Compliance**: Data export and deletion endpoints

## Real-time Features

Socket.IO namespaces:
- `/chat` - Real-time chat
- `/queue` - Queue updates
- `/notifications` - Push notifications

## Background Jobs

BullMQ queues:
- `email` - Email sending
- `reminder` - Medication/appointment reminders
- `export` - Data export processing

## Database

Prisma ORM with PostgreSQL. Run migrations:
```bash
npm run prisma:migrate
```

View database:
```bash
npm run prisma:studio
```

## Development

```bash
# Run in development mode
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Lint code
npm run lint
```

## Production Deployment

### AWS Deployment

See [AWS_DEPLOYMENT.md](./AWS_DEPLOYMENT.md) for detailed AWS deployment instructions.

Quick steps:
1. Set `NODE_ENV=production`
2. Configure all environment variables (especially Firebase and database)
3. Run database migrations
4. Build the project: `npm run build`
5. Deploy to AWS (EC2, Elastic Beanstalk, or Lambda)
6. Start the server: `node server.js` or use PM2

### Frontend Integration (Vercel)

In your Vercel frontend, set:
```env
NEXT_PUBLIC_API_URL=https://your-aws-backend-url.com/api/v1
NEXT_PUBLIC_SOCKET_URL=https://your-aws-backend-url.com
```

The frontend should use Firebase Authentication and send the Firebase ID token in the `Authorization: Bearer <token>` header for all API requests.

## License

MIT

