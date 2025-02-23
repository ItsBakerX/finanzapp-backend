import express from 'express';
import { body, validationResult } from 'express-validator';
import { sendKontaktEmail } from '../../src/services/EmailService';

export const kontaktRouter = express.Router();

export type EmailTemplate = {
    betreff: string,
    anliegen: string,
    email: string,
    message: string
}

kontaktRouter.post("/",
    body("betreff").isString().isLength({ min: 1 }),
    body("anliegen").isString().isLength({ min: 1 }),
    body("email").isEmail(),
    body("message").isString().isLength({ min: 1 }),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }
        const kontaktData = req.body as EmailTemplate;
        try {
            await sendKontaktEmail(kontaktData);
            res.sendStatus(201);
            return;
        } catch (e) {
            res.sendStatus(500);
            return;
        }
    })