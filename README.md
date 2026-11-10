# NearExpiry: Smarter Medicine Sharing for Clinics

NearExpiry is a web-based medicine inventory and surplus-sharing platform designed to help clinics, hospitals, and healthcare facilities reduce medicine wastage.

It allows facilities to manage medicine batches, monitor expiry dates, identify surplus stock, and request medicines from other facilities. Requests require pharmacist approval, and every request creation and decision is recorded in an audit trail.

The platform coordinates the transfer process. Physical medicine transfers and dispensing remain offline and subject to the facilities' approval procedures.

## Live Application

- **Frontend:** https://nearexpiry-snowy.vercel.app/
- **Backend API:** https://nearexpiry-8hjd.onrender.com
- **Health Check:** https://nearexpiry-8hjd.onrender.com/api/health
- **GitHub Repository:** https://github.com/Garima040106/NearExpiry

## Problem Statement

Small hospitals, clinics, and health centres may hold medicines that are close to expiry while nearby facilities experience shortages of the same medicines.

Without a shared view of available stock, facilities often depend on phone calls or informal communication to locate medicines. This can lead to usable medicines being discarded while other facilities need them.

NearExpiry addresses this coordination problem by providing a shared platform for tracking medicine batches, identifying surplus stock, submitting requests, and recording pharmacist decisions.

## Features

The application implements ten core features grouped into functional modules.

| ID | Feature | Description |
|---|---|---|
| F01 | Authentication | User registration and login using bcrypt password hashing and JWT authentication. |
| F02 | Inventory Management | Add, view, edit, and delete medicine batches belonging to a facility. |
| F03 | Expiry Tracking | Automatically classify batches as Safe, Near Expiry, or Expired. |
| F04 | Search and Filtering | Search medicines and filter by expiry status, expiry window, and facility where permitted. |
| F05 | Surplus Management | Mark available medicine quantities as surplus for other facilities. |
| F06 | Medicine Requests | Browse surplus stock from other facilities and submit requests. |
| F07 | Request Approval | Allow the supplying facility's pharmacist to approve or reject requests with a reason. |
| F08 | Audit Logging | Record request creation and approval or rejection decisions, including the user and timestamp. |
| F09 | Dashboard | Display near-expiry, expired, pending-request, and approved-request counts. |
| F10 | Administration | Allow administrators to manage users and facilities. |

## Application Modules

### 1. Authentication and Access Control

- User registration and login.
- Password hashing using bcrypt.
- JWT-based authentication.
- Role-based access for staff, pharmacists, and administrators.
- Facility association for staff and pharmacists.
- Protected API routes using authentication and role-checking middleware.

### 2. Medicine Inventory

Facilities can maintain their own medicine batches with details such as:

- Medicine name
- Batch number
- Available quantity
- Expiry date
- Surplus quantity
- Associated facility

Inventory operations include creating, viewing, updating, and deleting batches.

### 3. Expiry Monitoring

Medicine expiry status is calculated from the expiry date rather than stored as a permanent database value.

| Status | Condition |
|---|---|
| Safe | More than 90 days remaining |
| Near Expiry | 90 days or fewer remaining, but not expired |
| Expired | Expiry date has passed |

This ensures the displayed status reflects the current date.

### 4. Surplus Sharing

Facility staff can mark part of their medicine inventory as surplus.

The application enforces business rules:

- Surplus quantity cannot exceed available stock.
- Expired batches cannot be listed as available surplus.
- Surplus listings are visible to other facilities, not the supplying facility itself.

### 5. Medicine Requests and Approval

A facility can request medicines from another facility's surplus inventory.

The workflow is:

1. Staff browse available surplus.
2. Staff select a batch and enter the required quantity.
3. The application validates the request against available surplus.
4. A new request is created with Pending status.
5. The supplying facility's pharmacist reviews it.
6. The pharmacist approves or rejects the request with a reason.
7. On approval, the requested quantity is deducted from the medicine's stock and surplus.

Request creation and decisions use MongoDB transactions so related database changes are handled atomically.

### 6. Audit Trail

The audit module maintains records of:

- Request creation.
- Request approval.
- Request rejection.
- User responsible for the action.
- Associated request.
- Timestamp and decision notes.

This provides a traceable history of the application's request workflow.

### 7. Dashboard and Administration

The dashboard displays four summary metrics:

- Near-expiry batches.
- Expired batches.
- Pending requests.
- Approved requests.

Administrators can manage registered users and facilities. Facility deletion is restricted when associated users or medicine records still exist.

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | HTML5, CSS3, Bootstrap 5, JavaScript |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas |
| ODM | Mongoose |
| Authentication | JSON Web Tokens (JWT) |
| Password Security | bcrypt |
| API Communication | REST API, JSON, Fetch API |
| Deployment | Vercel, Render |
| Version Control | Git, GitHub |

## System Architecture

The application uses a separate frontend and backend deployment.

```text
                  USER
                   |
                   v
          VERCEL - FRONTEND
          HTML / CSS / Bootstrap
             JavaScript
                   |
             HTTPS / JSON
                   |
                   v
          RENDER - BACKEND
             Node.js
             Express.js
                   |
          Authentication
          Role Middleware
          Controllers
                   |
                   v
            MONGODB ATLAS
          Users / Facilities
          Medicines / Requests
              Audit Logs
```

The frontend communicates with the backend through REST API requests. Protected requests include a JWT in the `Authorization: Bearer` header.

## Repository Structure

```text
NearExpiry/
│
├── backend/
│   ├── config/
│   │   └── db.js
│   │
│   ├── controllers/
│   │   ├── adminController.js
│   │   ├── auditController.js
│   │   ├── authController.js
│   │   ├── dashboardController.js
│   │   ├── medicineController.js
│   │   └── requestController.js
│   │
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   └── sanitize.js
│   │
│   ├── models/
│   │   ├── AuditLog.js
│   │   ├── Facility.js
│   │   ├── Medicine.js
│   │   ├── Request.js
│   │   └── User.js
│   │
│   ├── routes/
│   │   ├── admin.js
│   │   ├── audit.js
│   │   ├── auth.js
│   │   ├── dashboard.js
│   │   ├── medicines.js
│   │   └── requests.js
│   │
│   ├── scripts/
│   │   ├── seedFacilities.js
│   │   └── testTransaction.js
│   │
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── css/
│   │   └── style.css
│   │
│   ├── js/
│   │   ├── admin.js
│   │   ├── api.js
│   │   ├── audit.js
│   │   ├── auth.js
│   │   ├── dashboard.js
│   │   ├── inventory.js
│   │   ├── requests.js
│   │   └── surplus.js
│   │
│   ├── admin.html
│   ├── audit.html
│   ├── dashboard.html
│   ├── index.html
│   ├── inventory.html
│   ├── login.html
│   ├── register.html
│   ├── requests.html
│   └── surplus.html
│
└── README.md
```

## Getting Started

### Prerequisites

Install the following before running the application locally:

- Node.js and npm
- Git
- MongoDB Atlas account or a compatible MongoDB deployment
- A code editor such as Visual Studio Code

### 1. Clone the Repository

```bash
git clone https://github.com/Garima040106/NearExpiry.git
cd NearExpiry
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Configure Environment Variables

Create a `.env` file inside the `backend/` directory.

Use `.env.example` as a reference.

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
```

Replace the placeholder values with your own configuration.

**Important:** Never commit `.env` or expose database credentials, JWT secrets, or other private configuration values.

### 4. Seed Initial Facilities

The application includes an idempotent facility seeding script.

```bash
npm run seed:facilities
```

This creates the initial demo facilities if they do not already exist.

### 5. Start the Backend

For development:

```bash
npm run dev
```

For normal execution:

```bash
npm start
```

The Express server starts on port 5000 by default and serves the frontend as static files.

### 6. Open the Application

Visit:

```text
http://localhost:5000
```

The landing page should load. You can register an account and begin using the application.

## Environment Variables

| Variable | Purpose |
|---|---|
| `PORT` | Port on which the Express server listens. |
| `MONGO_URI` | MongoDB connection string. |
| `JWT_SECRET` | Secret used to sign and verify JWTs. |

In production, configure these values through the Render service's environment variable settings instead of uploading a `.env` file.

## API Documentation

All backend routes are mounted under `/api`.

### Authentication and Facilities

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a user |
| POST | `/api/auth/login` | Authenticate a user |
| GET | `/api/facilities` | Retrieve facilities |

### Medicine Inventory and Surplus

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/medicines` | Retrieve medicine batches |
| POST | `/api/medicines` | Add a medicine batch |
| PUT | `/api/medicines/:id` | Update a medicine batch |
| DELETE | `/api/medicines/:id` | Delete a medicine batch |
| PATCH | `/api/medicines/:id/surplus` | Update surplus quantity |
| GET | `/api/surplus` | Browse available surplus |

### Requests and Audit

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/requests` | Create a medicine request |
| GET | `/api/requests` | Retrieve sent and received requests |
| PATCH | `/api/requests/:id/decision` | Approve or reject a request |
| GET | `/api/audit` | Retrieve audit records |

### Dashboard and Administration

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard` | Retrieve dashboard statistics |
| GET | `/api/admin/users` | Retrieve users |
| PUT | `/api/admin/users/:id` | Update a user |
| DELETE | `/api/admin/users/:id` | Delete a user |
| GET | `/api/admin/facilities` | Retrieve facilities |
| POST | `/api/admin/facilities` | Create a facility |
| PUT | `/api/admin/facilities/:id` | Update a facility |
| DELETE | `/api/admin/facilities/:id` | Delete a facility |

Protected endpoints require a valid JWT. Role restrictions are enforced by backend middleware.

## Database Design

NearExpiry uses five MongoDB collections.

| Collection | Purpose |
|---|---|
| Users | Stores user profiles, credentials, roles, and facility associations. |
| Facilities | Stores participating clinic and healthcare facility details. |
| Medicines | Stores medicine batches, quantities, expiry dates, and surplus. |
| Requests | Stores medicine requests, involved facilities, quantities, and decisions. |
| AuditLogs | Stores request creation and decision history. |

Mongoose schemas define field types, validation rules, references, and timestamps.

The main relationships are:

- A facility can have multiple users.
- A facility can maintain multiple medicine batches.
- A medicine batch can be associated with multiple requests over time.
- A request references the requesting and supplying facilities.
- An audit entry references a request and the user who performed the action.

## Security and Validation

The application implements the following security measures:

- Passwords are hashed using bcrypt rather than stored as plain text.
- JWTs authenticate protected API requests.
- Role-based middleware restricts access to administrative and pharmacist operations.
- Facility ownership is checked before inventory operations.
- Request quantities and surplus quantities are validated on the backend.
- Expired medicines cannot be offered or requested.
- Request decisions verify the supplying facility and pending status.
- Input sanitization helps protect against NoSQL injection.
- Frontend rendering escapes user-provided text to reduce HTML injection risks.
- Sensitive configuration is stored in environment variables.

## Testing

The backend includes a transaction test script:

```bash
cd backend
node scripts/testTransaction.js
```

The facility seeding script can also be run to initialize the demo data:

```bash
npm run seed:facilities
```

The following areas should be covered during functional and integration testing:

- User registration and login.
- Invalid credentials and duplicate registration.
- Protected routes without authentication.
- Medicine batch CRUD operations.
- Expiry status calculations.
- Surplus quantity validation.
- Request creation and quantity limits.
- Pharmacist approval and rejection.
- Stock deduction after approval.
- Audit log creation.
- Dashboard statistics.
- Admin user and facility management.
- Responsive layout across mobile, tablet, and desktop screens.

## Deployment

NearExpiry uses separate hosting services for the frontend and backend.

### Frontend: Vercel

- Repository: `Garima040106/NearExpiry`
- Root directory: `frontend`
- Framework preset: Other
- Build command: Not required for the static frontend.
- Output directory: Static frontend files.

### Backend: Render

- Repository: `Garima040106/NearExpiry`
- Root directory: `backend`
- Build command: `npm install`
- Start command: `npm start`
- Health check: `/api/health`

Configure `MONGO_URI`, `JWT_SECRET`, and `NODE_ENV` in Render's environment settings.

The frontend API configuration uses the local Express API during local development and the deployed Render API when hosted on Vercel.

## Current Limitations

- The application coordinates transfers but does not perform physical medicine delivery.
- Data refresh is currently request-based rather than real-time.
- Email and SMS notifications are not implemented.
- Cold-chain monitoring is not included.
- Distance-based facility recommendations are not implemented.
- District-level authority roles are not included.

## Future Scope

Potential improvements include:

- Email and scheduled expiry reminders.
- Distance-based facility discovery.
- CSV import for medicine inventory.
- Cold-chain tracking.
- Multi-language support.
- Expanded administrative analytics.
- Real-time inventory and request updates.

## Team

| Name | USN | Primary Contribution |
|---|---|---|
| Garima Varma | ENG24CY0105 | Backend development, authentication, APIs, middleware, testing, and documentation |
| Neehara Lakshmi | ENG24CY0138 | Database schemas, expiry status, search/filter queries, and dashboard queries |
| Komal Kumari | ENG24CY0124 | Frontend pages, UI components, form validation, and API integration |

## Acknowledgements

Built as part of the Full Stack Development course at Dayananda Sagar University, School of Engineering, Academic Year 2026–2027.

## References

- [Node.js Documentation](https://nodejs.org/docs/)
- [Express.js Documentation](https://expressjs.com/)
- [MongoDB Documentation](https://www.mongodb.com/docs/)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [Bootstrap 5.3 Documentation](https://getbootstrap.com/docs/5.3/)
- [MDN Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [JSON Web Token](https://www.npmjs.com/package/jsonwebtoken)
- [bcrypt](https://www.npmjs.com/package/bcrypt)
- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
