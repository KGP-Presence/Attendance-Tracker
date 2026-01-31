import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './Middlewares/errorHandler.middleware.js';

const app = express();

app.use(helmet());
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(cookieParser());

app.use("/api/v1/health", (req, res) => {
  res.status(200).send("OK");
});

// Routes would be defined here
import UserRoutes from './Routes/user.routes.js';
import AttendanceRoutes from './Routes/attendance.routes.js';
import DashboardRoutes from './Routes/dashboard.routes.js';
import DetailsRoutes from './Routes/details.routes.js';
import SubjectRoutes from './Routes/subject.routes.js';
import TimetableRoutes from './Routes/timetable.routes.js';

app.use('/api/v1/users', UserRoutes);
app.use('/api/v1/attendance', AttendanceRoutes);
app.use('/api/v1/dashboard', DashboardRoutes);
app.use('/api/v1/details', DetailsRoutes);
app.use('/api/v1/subjects', SubjectRoutes);
app.use('/api/v1/timetable', TimetableRoutes);

app.use(errorHandler);

export default app;