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
import { configureCORS } from './CORSconfig'
import { scannerRouter } from './routes/ScannerRouter'
import { kontaktRouter } from './routes/KontaktRouter'
import { limitRouter } from './routes/LimitRouter'
import { notificationRouter } from './routes/NotificationRouter'

const app = express()

// Config and middlewares
configureCORS(app)
app.use("*", express.json())
app.use(cookieParser())

// Routes
app.use("/api/benutzer", benutzerRouter)
app.use("/api/login", loginRouter)
// 
app.use("/api/buchung", buchungRouter)
app.use('/api/buchung/upload', scannerRouter)
app.use("/api/pocket", pocketRouter)
app.use("/api/buchungskategorie", buchungskategorieRouter)
app.use("/api/sparziel", sparzielRouter)
app.use("/api/statistik", statistikRouter)
app.use("/api/kontakt", kontaktRouter)
app.use("/api/limit", limitRouter)
app.use("/api/notification", notificationRouter)

export default app