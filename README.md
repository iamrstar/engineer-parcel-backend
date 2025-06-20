# EngineersParcel Backend API

A comprehensive backend API for the EngineersParcel delivery service built with Node.js, Express, and MongoDB.

## Features

- **User Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control (User/Admin)
  - Password hashing with bcrypt
  - Email verification

- **Booking Management**
  - Create, read, update, delete bookings
  - Real-time tracking system
  - Status updates and notifications
  - Pricing calculation

- **Pincode Management**
  - Serviceability checking
  - Delivery estimation
  - Coverage area management

- **Contact Management**
  - Contact form submissions
  - Admin response system
  - Email notifications

- **Security Features**
  - Rate limiting
  - CORS protection
  - Helmet security headers
  - Input validation and sanitization

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Joi
- **Email**: Nodemailer
- **Security**: Helmet, CORS, Rate Limiting

## Installation

1. Clone the repository:
\`\`\`bash
git clone <repository-url>
cd server
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Create environment file:
\`\`\`bash
cp .env.example .env
\`\`\`

4. Configure environment variables in `.env` file

5. Start MongoDB service

6. Seed the database:
\`\`\`bash
npm run seed
\`\`\`

7. Start the development server:
\`\`\`bash
npm run dev
\`\`\`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile

### Bookings
- `POST /api/bookings` - Create new booking
- `GET /api/bookings` - Get user bookings
- `GET /api/bookings/:id` - Get single booking
- `PUT /api/bookings/:id/status` - Update booking status (Admin)
- `PUT /api/bookings/:id/cancel` - Cancel booking

### Pincode Management
- `GET /api/pincode/check/:pincode` - Check pincode serviceability
- `GET /api/pincode/estimate` - Get delivery estimate
- `GET /api/pincode` - Get all pincodes (Admin)
- `POST /api/pincode` - Add new pincode (Admin)
- `PUT /api/pincode/:id` - Update pincode (Admin)

### Tracking
- `GET /api/tracking/:bookingId` - Track booking
- `GET /api/tracking/:bookingId/history` - Get tracking history

### Contact
- `POST /api/contact` - Submit contact form
- `GET /api/contact` - Get contact submissions (Admin)
- `PUT /api/contact/:id` - Update contact status (Admin)

### Users (Admin only)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get single user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | development |
| `PORT` | Server port | 5000 |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/engineersparcel |
| `JWT_SECRET` | JWT secret key | - |
| `FRONTEND_URL` | Frontend application URL | http://localhost:3000 |
| `EMAIL_HOST` | SMTP host | smtp.gmail.com |
| `EMAIL_PORT` | SMTP port | 587 |
| `EMAIL_USER` | SMTP username | - |
| `EMAIL_PASS` | SMTP password | - |

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run seed` - Seed database with initial data
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues

## Database Schema

### User
- Personal information (name, email, phone)
- Authentication data (password, verification status)
- Address information
- Role-based permissions

### Booking
- Customer information
- Service type and package details
- Pickup and delivery addresses
- Pricing and payment information
- Status tracking and history

### Pincode
- Location information (pincode, city, state)
- Serviceability status
- Delivery estimates
- Service type availability

### Contact
- Contact form submissions
- Status tracking
- Admin responses

## Security

- **Authentication**: JWT tokens with expiration
- **Authorization**: Role-based access control
- **Rate Limiting**: Prevents API abuse
- **Input Validation**: Joi schema validation
- **Password Security**: bcrypt hashing
- **CORS**: Configured for frontend domain
- **Headers**: Security headers via Helmet

## Error Handling

The API uses consistent error response format:

\`\`\`json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (development only)"
}
\`\`\`

## Success Response Format

\`\`\`json
{
  "success": true,
  "message": "Success message",
  "data": {},
  "pagination": {} // For paginated responses
}
\`\`\`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Run linting and tests
6. Submit a pull request

## License

This project is licensed under the MIT License.
