# CRM Leads Management

This project is a Customer Relationship Management (CRM) system designed for managing leads. It includes a backend built with Node.js, Express, and Prisma, and a frontend developed using React. The application supports user authentication, lead management, and data import from Excel files.

## Features

- **User Authentication**: Secure login with JWT and role-based access control for Admin and Telepros.
- **Lead Management**: Create, view, update, and assign leads.
- **Excel Import**: Import leads from Excel files for easy data entry.
- **Role Management**: Admin can create and manage Telepros.

## Project Structure

```
crm-leads-management
├── backend
│   ├── prisma
│   │   ├── schema.prisma
│   │   └── seed.js
│   ├── src
│   │   ├── controllers
│   │   │   ├── authController.js
│   │   │   ├── userController.js
│   │   │   └── leadController.js
│   │   ├── middlewares
│   │   │   ├── authMiddleware.js
│   │   │   └── roleMiddleware.js
│   │   ├── routes
│   │   │   ├── authRoutes.js
│   │   │   ├── userRoutes.js
│   │   │   └── leadRoutes.js
│   │   ├── utils
│   │   │   ├── validation.js
│   │   │   └── excelParser.js
│   │   ├── config
│   │   │   └── database.js
│   │   └── server.js
│   ├── package.json
│   └── .env
├── frontend
│   ├── public
│   │   └── index.html
│   ├── src
│   │   ├── components
│   │   │   ├── Login.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── TeleproDashboard.jsx
│   │   │   ├── ImportLeads.jsx
│   │   │   ├── LeadsList.jsx
│   │   │   └── LeadEditModal.jsx
│   │   ├── services
│   │   │   └── api.js
│   │   ├── utils
│   │   │   └── auth.js
│   │   ├── App.jsx
│   │   └── index.js
│   ├── package.json
│   └── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

- Node.js
- npm or yarn
- PostgreSQL or MySQL

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd crm-leads-management
   ```

2. Set up the backend:
   - Navigate to the `backend` directory:
     ```
     cd backend
     ```
   - Install dependencies:
     ```
     npm install
     ```
   - Configure your database connection in the `.env` file.
   - Run the Prisma migrations:
     ```
     npx prisma migrate dev
     ```
   - Seed the database:
     ```
     node prisma/seed.js
     ```
   - Start the server:
     ```
     npm start
     ```

3. Set up the frontend:
   - Navigate to the `frontend` directory:
     ```
     cd ../frontend
     ```
   - Install dependencies:
     ```
     npm install
     ```
   - Start the React application:
     ```
     npm start
     ```

### Usage

- Access the application in your browser at `http://localhost:3000`.
- Use the admin credentials to log in and manage Telepros and leads.

## License

This project is licensed under the MIT License.