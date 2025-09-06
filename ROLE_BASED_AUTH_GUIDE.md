# Role-Based Authentication System

## Overview
SkinBloom now supports a comprehensive role-based authentication system with three distinct user types:

### User Roles

#### 1. **Admin** 👑
- **Purpose**: System administration and oversight
- **Access**: Full system access and user management
- **Dashboard**: Admin Dashboard with comprehensive statistics
- **Features**:
  - View total users, dermatologists, tickets, and products
  - Manage user roles and permissions
  - System-wide settings and configuration
  - User management and analytics

#### 2. **Dermatologist** 👨‍⚕️
- **Purpose**: Provide professional skincare consultation
- **Access**: Professional consultation tools and patient management
- **Dashboard**: Dermatologist Dashboard with patient insights
- **Features**:
  - Manage patient consultations and tickets
  - View consultation requests by priority
  - Access professional dashboard with revenue tracking
  - Product recommendations and medical resources

#### 3. **User** 👤
- **Purpose**: Receive personalized skincare guidance
- **Access**: Personal skincare journey and product access
- **Dashboard**: User Dashboard with personalized recommendations
- **Features**:
  - Personalized skincare routine recommendations
  - AI-powered skin analysis and progress tracking
  - Product catalog access and shopping cart
  - Timeline tracking and consultation requests

## Registration Process

### Role Selection
During registration, new users can choose between:
- **User**: For individuals seeking skincare guidance
- **Dermatologist**: For medical professionals providing skincare consultation

### Registration Benefits
The registration form dynamically shows different benefits based on selected role:

**For Users:**
- Personalized skincare routine recommendations
- AI-powered skin analysis and tracking
- Access to expert-curated product catalog
- Progress monitoring with photo timeline

**For Dermatologists:**
- Manage patient consultations and tickets
- Provide expert skincare recommendations
- Access professional dashboard and analytics
- Connect with clients seeking dermatological advice

## Authentication Flow

### Login Process
1. User enters email and password
2. System validates credentials
3. JWT token generated with user ID, role, and name
4. User redirected to role-appropriate dashboard:
   - **Admin** → `/admin/dashboard`
   - **Dermatologist** → `/dermatologist/dashboard`
   - **User** → `/dashboard`

### Protected Routes
All routes are protected with role-based access control:

```javascript
// User-only routes
/dashboard (users only)
/routine (users only)
/feedback (users only)
/timeline (users only)

// Shared routes
/products (users & dermatologists)
/tickets (users & dermatologists)
/profile (all authenticated users)

// Dermatologist-only routes
/dermatologist/dashboard (dermatologists only)

// Admin-only routes
/admin/dashboard (admin only)
```

## Navigation System

### Role-Based Navigation
The navigation bar adapts based on user role:

**Admin Navigation:**
- Admin Dashboard
- Profile

**Dermatologist Navigation:**
- Dashboard
- Products
- Consultations
- Profile

**User Navigation:**
- Dashboard
- Shop
- Routine
- Progress
- Help
- Profile
- Cart

### Role Indicators
User names in navigation include color-coded role badges:
- **Admin**: Red badge
- **Dermatologist**: Blue badge
- **User**: Green badge

## Technical Implementation

### Backend Components

#### User Model
```javascript
{
  name: String (required),
  email: String (required, unique),
  password: String (required),
  role: String (enum: ['user', 'admin', 'dermatologist'], default: 'user'),
  profileCompleted: Boolean (default: false),
  lastLogin: Date,
  isActive: Boolean (default: true)
}
```

#### Authentication Middleware
- `authRequired`: Validates JWT tokens
- `requireRole(...roles)`: Restricts access to specific roles

#### API Endpoints
```javascript
POST /auth/register - Register new user with role
POST /auth/login - Authenticate user
GET /auth/me - Get current user profile
PUT /auth/update-role - Admin-only role updates
```

### Frontend Components

#### Protected Routes
- `ProtectedRoute`: Wraps routes requiring authentication
- `RoleBasedRedirect`: Automatically redirects based on user role
- `Unauthorized`: Displays access denied message

#### Role-Specific Dashboards
- `AdminDashboard`: System statistics and user management
- `DermatologistDashboard`: Patient management and consultations
- `Dashboard`: User skincare journey and recommendations

## Admin Setup

### Creating Admin User
```bash
cd server
npm run create-admin
```

**Default Admin Credentials:**
- Email: `admin@skinbloom.com`
- Password: `admin123`
- Role: `admin`

### Admin Capabilities
- View system-wide statistics
- Manage user roles
- Access all system features
- User management and analytics

## Security Features

### JWT Token Security
- 7-day token expiration
- Role information embedded in token
- Secure token validation on all protected routes

### Route Protection
- Client-side route protection with React Router
- Server-side API protection with middleware
- Role-based access control at multiple levels

### Password Security
- bcrypt hashing with salt rounds
- Secure password requirements
- Password confirmation validation

## Usage Examples

### Register as Dermatologist
1. Visit `/register`
2. Select "Dermatologist" account type
3. Fill in professional details
4. System creates dermatologist account
5. Redirect to dermatologist dashboard

### Admin Role Management
1. Login as admin
2. Access admin dashboard
3. View user statistics
4. Update user roles via API
5. Monitor system activity

### User Journey
1. Register as "User"
2. Complete profile setup
3. Access personalized dashboard
4. Explore skincare recommendations
5. Track progress with timeline

## Development Notes

### Environment Variables
```env
JWT_SECRET=your_jwt_secret_key
MONGO_URI=mongodb://localhost:27017/skinbloom
```

### Running the Application
```bash
# Backend
cd server
npm run dev

# Frontend
cd client
npm run dev

# Create admin user
cd server
npm run create-admin
```

This role-based authentication system provides a secure, scalable foundation for the SkinBloom platform, ensuring appropriate access control while delivering tailored experiences for each user type.
