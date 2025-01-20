# Walkinn - Event Management System (EMS) Backend

A comprehensive backend system for event management, built with Node.js, Express, TypeScript, and MongoDB.

## 🚀 Features

- Authentication & Authorization
- Event Management
- Ticket Management
- Booking System
- Payment Processing
- Agent Management
- Scanner Integration
- Analytics
- File Upload
- Email Notifications
- SMS Notifications
- QR Code Generation
- PDF Generation

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- Redis (v6 or higher)
- TypeScript (v4.5 or higher)
- AWS Account (for S3 storage)
- Stripe Account (for payments)
- Twilio Account (for SMS)
- Gmail Account or SMTP Server (for emails)

## 🛠️ Tech Stack

- **Runtime Environment**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **Caching**: Redis
- **File Storage**: AWS S3
- **Payment Processing**: Stripe
- **SMS**: Twilio
- **Email**: Nodemailer
- **Authentication**: JWT
- **Validation**: Express Validator
- **Documentation**: Swagger/OpenAPI
- **Logging**: Winston
- **Testing**: Jest

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ems-backend.git
cd ems-backend
```

2. Install dependencies:
```bash
npm install
```

3. Create necessary directories:
```bash
mkdir -p uploads/{images,documents,avatars}
mkdir -p logs
```

4. Create environment file (.env):
```env
# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/ems_db

# Authentication
JWT_SECRET=your_jwt_secret_key
REFRESH_TOKEN_SECRET=your_refresh_token_secret

# AWS
AWS_ACCESS_KEY=your_aws_access_key
AWS_SECRET_KEY=your_aws_secret_key
AWS_REGION=your_aws_region
AWS_BUCKET_UPLOADS=ems-uploads
AWS_BUCKET_DOCUMENTS=ems-documents
AWS_BUCKET_IMAGES=ems-images

# Email (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_email_password
EMAIL_FROM=noreply@ems.com
SUPPORT_EMAIL=support@ems.com

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_phone

# Payment (Stripe)
STRIPE_SECRET_KEY=your_stripe_secret_key

# Cache (Redis)
REDIS_URL=redis://localhost:6379
```

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### TypeScript Watch Mode
```bash
npm run watch-ts
```

## 📁 Project Structure

```
src/
├── config/           # Configuration files
├── controllers/      # Route controllers
├── middleware/       # Custom middleware
├── models/          # Database models
├── routes/          # API routes
├── services/        # Business logic
├── templates/       # Email templates
├── types/           # TypeScript types
├── utils/           # Utility functions
├── validations/     # Request validations
└── server.ts        # App entry point
```

## 🔑 API Authentication

The API uses JWT (JSON Web Tokens) for authentication:

1. Get JWT token by logging in:
```bash
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

2. Use the token in subsequent requests:
```bash
Authorization: Bearer <your_jwt_token>
```

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Events
- `GET /api/events` - List events
- `POST /api/events` - Create event
- `GET /api/events/:id` - Get event details
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings` - List bookings
- `GET /api/bookings/:id` - Get booking details

### Tickets
- `GET /api/tickets` - List tickets
- `GET /api/tickets/:id` - Get ticket details
- `POST /api/tickets/:id/verify` - Verify ticket

### Payments
- `POST /api/payments/initiate` - Initiate payment
- `POST /api/payments/confirm` - Confirm payment
- `GET /api/payments/:id` - Get payment details

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `PUT /api/users/password` - Change password

[View Complete API Documentation](./docs/api.md)

## 🔒 Security Features

- JWT Authentication
- Password Hashing (bcrypt)
- Rate Limiting
- CORS Protection
- XSS Prevention
- HTTP Security Headers
- Input Validation
- Request Sanitization

## 📧 Email Templates

Email templates are located in `src/templates/`:
- Welcome Email
- Password Reset
- Booking Confirmation
- Ticket Confirmation
- Event Notification

## 📱 SMS Notifications

SMS notifications are sent for:
- OTP Verification
- Booking Confirmation
- Event Reminders
- Important Updates

## 💾 File Storage

Files are stored in AWS S3 with the following structure:
- `/uploads/images/` - Event images
- `/uploads/documents/` - Documents
- `/uploads/avatars/` - User avatars

## 🔍 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 📊 Logging

Logs are stored in the `logs` directory:
- `error.log` - Error logs
- `combined.log` - All logs
- `access.log` - HTTP access logs

## 🚀 Deployment

1. Build the application:
```bash
npm run build
```

2. Set production environment variables
3. Start the application:
```bash
npm start
```

## 🔧 Error Handling

Error codes and messages are standardized:
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## 👥 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Support

For support, email support@ems.com or join our Slack channel.

## 🌟 Contributors

- [Your Name](https://github.com/yourusername)

## 📚 Additional Documentation

- [API Documentation](./docs/api.md)
- [Database Schema](./docs/schema.md)
- [Deployment Guide](./docs/deployment.md)
- [Testing Guide](./docs/testing.md)