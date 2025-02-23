import express from 'express'
import "express-async-errors"

import cookieParser from 'cookie-parser'
import { pocketRouter } from './routes/Pocketrouter'
import { loginRouter } from './routes/LoginRouter'
import { buchungRouter } from './routes/BuchungRouter'
import { benutzerRouter } from './routes/BenutzerRouter'
import { buchungskategorieRouter } from './routes/BuchungskategorieRouter'
import { sparzielRouter } from './routes/SparzielRouter'
import { statistikRouter } from './routes/StatistikRouter'
import { scannerRouter } from './routes/ScannerRouter'
import { kontaktRouter } from './routes/KontaktRouter'
import { limitRouter } from './routes/LimitRouter'
import { notificationRouter } from './routes/NotificationRouter'
import { logger } from './logger'
import cors from 'cors'

const mongoose = require('mongoose')

let mongoURI = process.env.DB_CONNECTION_STRING;
logger.info(`Using MongoDB Atlas with URI: ${mongoURI}`);
mongoose.connect(mongoURI)
logger.info("Successfully connected to the database");

const app = express()
app.disable('x-powered-by')

// CORS
app.use(
  cors({
    origin: [
      "https://budgetbuddy-frontend-gamma.vercel.app",
      "http://localhost:3000",
    ],
    methods: ["POST", "GET", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "token"],
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

// Middlewars
app.use(express.json({ limit: '10mb' }))
app.use(cookieParser())

// Routes
app.use("/api/benutzer", benutzerRouter)
app.use("/api/login", loginRouter)
// 
app.use("/api/buchung", buchungRouter)
app.use("/api/buchung/upload", scannerRouter)
app.use("/api/pocket", pocketRouter)
app.use("/api/buchungskategorie", buchungskategorieRouter)
app.use("/api/sparziel", sparzielRouter)
app.use("/api/statistik", statistikRouter)
app.use("/api/kontakt", kontaktRouter)
app.use("/api/limit", limitRouter)
app.use("/api/notification", notificationRouter)

app.get("/", (_, res) => {
    res.send("Hello World")
    return;
})

export default app