# ⚙️ Attendance Tracker - Backend API

[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge\&logo=node.js\&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge\&logo=mongodb\&logoColor=white)](https://www.mongodb.com/)
[![JWT](https://img.shields.io/badge/JWT-black?style=for-the-badge\&logo=jsonwebtokens\&logoColor=white)](https://jwt.io/)
[![Mongoose](https://img.shields.io/badge/Mongoose-880000?style=for-the-badge\&logo=mongoose\&logoColor=white)](https://mongoosejs.com/)

A scalable backend API for the Attendance Tracker application. Built with **Node.js**, **Express.js**, and **MongoDB**, this service handles authentication, attendance management, subject-wise tracking, reminders, and supporting utilities for the mobile client.

---

## ✨ Key Features

* 🔐 **Secure Authentication** — JWT-based login and protected routes
* 🧾 **Attendance Management** — Create, update, and track attendance records
* 📚 **Subject-wise Tracking** — Maintain subject-level attendance history and details
* ⏰ **Reminder & Event Support** — Store and manage reminders/events (voice-triggered from client)
* 📤 **File Upload Support** — Ready for handling media or document uploads
* 🛡️ **Security Middleware** — Helmet, CORS, cookies, and request protection
* 🧩 **Modular Architecture** — Clean separation of controllers, routes, models, and utilities
* ⚡ **Developer-Friendly Setup** — Simple local development with nodemon

---

## 🛠️ Tech Stack

| Category       | Technology                   |
| -------------- | ---------------------------- |
| Runtime        | Node.js                      |
| Framework      | Express.js                   |
| Database       | MongoDB                      |
| ODM            | Mongoose                     |
| Authentication | JSON Web Token (JWT), bcrypt |
| Security       | helmet, cors, cookie-parser  |
| Env Management | dotenv                       |
| File Handling  | multer                       |

---

## 📂 Server Folder Structure

```bash
├── .github/
│   └── workflows/         # CI/CD workflows
├── src/
│   ├── Controllers/       # Business logic
│   ├── Middlewares/       # Auth & error middleware
│   ├── Models/            # Mongoose schemas
│   ├── Routes/            # API routes
│   ├── Scripts/           # Utility scripts
│   ├── Utils/             # Helper functions
│   ├── constants/         # Constant values
│   ├── db/                # Database connection
│   ├── helpers/           # Supporting helpers
│   ├── app.js             # Express app setup
│   ├── constants.js       # Shared constants
│   └── index.js           # Entry point
├── .gitignore
├── .prettierrc
├── package.json
└── README.md
```

---

## ⚙️ Local Setup & Installation

### 🔧 Prerequisites

* Node.js (v18 or higher recommended)
* MongoDB (local or MongoDB Atlas)

---

### 🚀 Installation Steps

1. **Clone the repository**

```bash
git clone https://github.com/KGP-Presence/Attendance-Tracker.git
cd Attendance-Tracker
```

2. **Install dependencies**

```bash
npm install
```

3. **Setup environment variables**

Create a `.env` file in the root directory:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_key
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

4. **Start development server**

```bash
npm run dev
```

5. **Start production server**

```bash
npm start
```

---

## 🔑 Environment Variables

| Variable   | Description               |
| ---------- | ------------------------- |
| PORT       | Server port               |
| MONGO_URI  | MongoDB connection string |
| JWT_SECRET | Secret for JWT signing    |
| CLIENT_URL | Allowed frontend origin   |
| NODE_ENV   | Environment mode          |

---

## 📡 API Reference

### 🔐 Authentication

| Method | Endpoint           | Description      |
| ------ | ------------------ | ---------------- |
| POST   | /api/v1/user/register | Register user    |
| POST   | /api/v1/user/login    | Login user       |
| GET    | /api/user/me       | Get current user |

---

### 📊 Attendance

| Method | Endpoint                | Description            |
| ------ | ----------------------- | ---------------------- |
| POST   | /api/v1/attendance/mark    | Mark attendance        |
| GET    | /api/v1/attendance/:userId | Get attendance history |
| PATCH  | /api/v1/attendance/:id     | Update attendance      |

---

### 📚 Subjects

| Method | Endpoint          | Description         |
| ------ | ----------------- | ------------------- |
| POST   | /api/v1/subjects     | Create subject      |
| GET    | /api/v1/subjects     | Get all subjects    |
| GET    | /api/v1/subjects/:id | Get subject details |
| PATCH  | /api/v1/subjects/:id | Update subject      |

---

### 🗓️ Events / Reminders

| Method | Endpoint        | Description  |
| ------ | --------------- | ------------ |
| POST   | /api/v1/events     | Create event |
| GET    | /api/v1/events     | Get events   |
| DELETE | /api/v1/events/:id | Delete event |

---

## 🔒 Authentication

All protected routes require:

```bash
Authorization: Bearer your_jwt_token
```

---

## 🧪 Development Notes

* Use `npm run dev` for hot-reload
* Keep secrets in `.env`
* Configure CORS before deployment
* Use MongoDB Atlas for production

---

## 🚀 Deployment

Deploy easily on:

* Render
* Railway
* AWS EC2 / Lambda
* DigitalOcean

Before deploying:

* Set environment variables
* Configure MongoDB access
* Update CORS origin

---

## 📌 Future Improvements

* Role-based access control
* Attendance analytics engine
* Export reports (CSV/PDF)
* Push notification integration
* Advanced reminder scheduling

---

## 🤝 Contributing

1. Fork the repo
2. Create a branch

```bash
git checkout -b feature/your-feature
```

3. Commit

```bash
git commit -m "Add feature"
```

4. Push

```bash
git push origin feature/your-feature
```

5. Open PR 🚀

---

## 📄 License

This project is licensed under the **ISC License**.

---

⭐ Star this repo if you found it useful!
