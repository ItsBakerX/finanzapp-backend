import express from 'express'
import cors, { CorsOptions } from 'cors'

export function configureCORS(app: express.Application) {
    const corsOptions: CorsOptions = {
        origin: process.env.CORS_ORIGIN ?? "http://localhost:3000", // needs to be changed to HTTPS
        methods: "GET,PUT,POST,DELETE,PATCH",
        allowedHeaders: ["Content-Type", "token"],
        optionsSuccessStatus: 200,
        credentials: true
    }
    app.use(cors(corsOptions))
    app.options("*", cors())
}