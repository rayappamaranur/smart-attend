# Smart Attendance Analyzer

A responsive attendance management web application built for the Database Integration internship module.

## Features
- User registration and login
- Password hashing with bcrypt
- JWT-protected API routes
- MongoDB Atlas database integration
- Add student attendance records
- Retrieve and display all records created by the logged-in user
- Search attendance by student name, student ID or subject
- View individual attendance details
- Attendance summary: total, present, absent and attendance rate
- Responsive interface for mobile and desktop

## Technology
HTML, CSS, JavaScript, Node.js, Express.js, MongoDB Atlas, Mongoose, bcryptjs and JSON Web Token.

## Run locally
1. Install Node.js (LTS).
2. Download or clone this repository.
3. Open the project folder in VS Code.
4. Open the terminal and run:

   ```bash
   npm install
   ```

5. Create a file named `.env` in the project root. Copy the values from `.env.example` and replace:
   - `MONGODB_URI` with your MongoDB Atlas connection string.
   - `JWT_SECRET` with a long, random secret value.

6. In MongoDB Atlas, create a database user, allow your development IP address in Network Access, and copy the application connection string. Replace the username and password placeholders. If your password contains special characters, URL-encode them.
7. Start the application:

   ```bash
   npm start
   ```

8. Open `http://localhost:5000` in your browser.

## API endpoints

| Method | Endpoint | Purpose | Authentication |
|---|---|---|---|
| POST | `/api/register` | Create an account | No |
| POST | `/api/login` | Log in and receive JWT | No |
| GET | `/api/me` | Get current user profile | Yes |
| POST | `/api/attendance` | Save attendance | Yes |
| GET | `/api/attendance` | List your attendance records | Yes |
| GET | `/api/attendance/:id` | View one attendance record | Yes |
| DELETE | `/api/attendance/:id` | Delete one of your records | Yes |
| GET | `/api/health` | Check app/database status | No |

## GitHub upload
Create a new public repository named `smart-attendance-analyzer`. Upload the project files and folders, but **do not upload `.env` or `node_modules`**. The `.gitignore` file excludes them.

## Deployment notes
Deploy the Node.js project on a host that supports Express (for example, Render). Add these environment variables in the hosting dashboard:
- `MONGODB_URI`
- `JWT_SECRET`
- `NODE_ENV=production` (optional)

Set the build command to `npm install` and start command to `npm start`. Make sure MongoDB Atlas Network Access permits connections from your hosting provider. Never commit database passwords or JWT secrets to GitHub.

## Internship submission
- GitHub repository: paste your repository URL.
- LinkedIn post: describe the project, features, technology stack and what you learned.
- Live demo: paste your deployed URL after successful deployment.

## Project title
**Smart Attendance Analyzer – A Database-Driven Student Attendance Management System**

Academic project demonstration. For production use, add role-based access, audit logs, stronger rate limiting, HTTPS-only deployment and appropriate privacy controls.
