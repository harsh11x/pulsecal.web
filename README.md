# PulseCal - Healthcare Management Platform

A comprehensive enterprise healthcare SaaS platform built with Next.js 16, TypeScript, and Tailwind CSS.

## Features

### Authentication & Authorization
- Role-based access control (Patient, Doctor, Receptionist, Admin)
- Secure login, signup, and password reset
- Email verification system
- Protected routes with role guards

### Appointment Management
- Calendar view with interactive scheduling
- List view with filtering and sorting
- Create, reschedule, and cancel appointments
- Real-time appointment status tracking
- Check-in system for receptionists
- Appointment chat and directions

### Health Records Management
- Complete medical record system
- Prescription management with refill requests
- Emergency contacts management
- Health reminders and notifications
- Document upload and viewing

### Services
- Insurance management and claims
- Payment processing and billing
- Telemedicine virtual consultations
- Healthcare facility finder with maps

### Communication
- Real-time chat system with Socket.IO support
- Patient queue management
- Notification system

### Dashboard & Analytics
- Role-specific dashboards
- Real-time statistics and metrics
- Activity tracking
- Performance analytics

### Admin Panel
- User management (CRUD operations)
- System settings configuration
- Reports and analytics
- Activity monitoring

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **State Management:** Redux Toolkit
- **Form Validation:** Zod
- **Date Handling:** date-fns
- **UI Components:** shadcn/ui
- **Real-time:** Socket.IO Client
- **HTTP Client:** Axios

## Project Structure

```
pulsecal/
├── app/                          # Next.js App Router
│   ├── (dashboard)/             # Protected dashboard routes
│   │   ├── appointments/        # Appointment pages
│   │   ├── health/              # Health records pages
│   │   ├── services/            # Service pages
│   │   ├── chat/                # Chat pages
│   │   ├── queue/               # Queue management
│   │   ├── admin/               # Admin pages
│   │   ├── profile/             # Profile pages
│   │   └── dashboard/           # Dashboard pages
│   ├── auth/                    # Authentication pages
│   ├── features/                # Redux slices
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   ├── providers.tsx            # App providers
│   └── store.ts                 # Redux store
├── components/                   # React components
│   ├── appointments/            # Appointment components
│   ├── chat/                    # Chat components
│   ├── common/                  # Common components
│   ├── dashboard/               # Dashboard components
│   ├── health/                  # Health record components
│   ├── layout/                  # Layout components
│   └── ui/                      # UI components (shadcn)
├── pages/                       # Page components
│   ├── appointments/            # Appointment pages
│   ├── auth/                    # Auth pages
│   ├── chat/                    # Chat pages
│   ├── dashboard/               # Dashboard pages
│   └── health/                  # Health pages
├── services/                    # API services
│   ├── api.ts                   # Base API client
│   ├── auth.service.ts          # Auth service
│   ├── appointment.service.ts   # Appointment service
│   ├── medicalRecord.service.ts # Medical record service
│   ├── prescription.service.ts  # Prescription service
│   ├── chat.service.ts          # Chat service
│   └── user.service.ts          # User service
├── routes/                      # Route guards
│   ├── ProtectedRoute.tsx       # Auth protection
│   └── RoleGuard.tsx            # Role-based access
├── utils/                       # Utilities
│   ├── constants.ts             # App constants
│   ├── helpers.ts               # Helper functions
│   ├── permissions.ts           # Permission checks
│   └── mockData.ts              # Mock data
├── types/                       # TypeScript types
│   └── index.ts                 # Type definitions
└── schemas/                     # Zod schemas
    ├── auth.schemas.ts          # Auth validation
    ├── appointment.schemas.ts   # Appointment validation
    └── medicalRecord.schemas.ts # Medical record validation
```

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables (if using real backend):
   ```
   NEXT_PUBLIC_API_URL=your_api_url
   NEXT_PUBLIC_SOCKET_URL=your_socket_url
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

### Mock Data

The application uses mock data by default. To connect to a real backend:
1. Update the API URLs in environment variables
2. Replace mock API responses in services with real API calls
3. Configure Socket.IO connection in the providers

## User Roles

### Patient
- View and manage appointments
- Access medical records and prescriptions
- Request prescription refills
- Chat with healthcare providers
- Manage profile and insurance

### Doctor
- View patient appointments
- Create and update medical records
- Write and manage prescriptions
- Chat with patients
- View patient queue

### Receptionist
- Manage all appointments
- Check-in patients
- View and manage patient queue
- Schedule appointments for patients

### Admin
- Full system access
- User management
- System configuration
- View reports and analytics
- Manage all resources

## Key Features Explained

### Role-Based Access Control
The application uses Redux for state management with role-based permissions checked at both route and component levels.

### Real-Time Features
Socket.IO integration enables:
- Live chat messaging
- Real-time queue updates
- Instant notifications

### Responsive Design
Mobile-first approach with:
- Adaptive layouts for all screen sizes
- Touch-friendly interactions
- Mobile navigation drawer

### Design System
Healthcare-focused color scheme:
- Primary: Medical Blue (#3498db)
- Secondary: Dark Slate (#2c3e50)
- Success: Green
- Warning: Orange
- Error: Red

## API Integration

All services are located in the `services/` directory. Each service provides:
- Type-safe API calls
- Error handling
- Request/response transformation
- Mock data fallbacks

To integrate with your backend, update the base URL in `services/api.ts` and implement the endpoints matching the service methods.

## Contributing

This is a frontend implementation. For full functionality:
1. Set up a backend API
2. Implement the endpoints used by services
3. Configure database schemas
4. Set up Socket.IO server
5. Implement authentication and authorization

## License

MIT License - see LICENSE file for details

## Support

For issues and questions, please open an issue in the repository.
