import express from "express";
import dotenv from "dotenv";
import { verifyJWT, verifyPasswordAndCreateJWT } from "../../src/services/JWTService";
import { checkVerificationStatus } from "../../src/services/VerificationService";
import { body, matchedData, validationResult } from "express-validator";

dotenv.config();

export const loginRouter = express.Router();

loginRouter.post("/",
    body('email').isEmail(),
    body('password').isString().isStrongPassword({
        minLength: 8,
        minUppercase: 1,
        minLowercase: 1,
        minNumbers: 1,
        minSymbols: 1,
    }).withMessage("Passwort muss mindestens 8 Zeichen lang sein und mindestens einen Großbuchstaben, einen Kleinbuchstaben, eine Zahl und ein Sonderzeichen enthalten"),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }
        const loginData = matchedData(req);
        try {
            const verificationStatus = await checkVerificationStatus(loginData.email);
            if (!verificationStatus) {
                res.status(401).send(`Benutzer ${loginData.email} nicht verifiziert`);
                return;
            }
            const jwtString = await verifyPasswordAndCreateJWT
                (
                    loginData.email,
                    loginData.password
                );
            if (jwtString) {
                verifyJWT(jwtString);
                res.status(200).send({ token: jwtString });
                return;
            } else {
                res.sendStatus(401);
                return;
            }
        } catch (e) {
            res.sendStatus(401);
            return;
        }
    })

loginRouter.get("/", async (req, res) => {
    const jwtString = req.headers.token as string;
    if (!jwtString) {
        res.sendStatus(401);
        return;
    }
    try {
        const loginResource = verifyJWT(jwtString);
        if (loginResource.expiresIn > (Date.now() / 1000)) {
            res.status(200).send(loginResource);
            return;
        }
    } catch (e) {
        res.sendStatus(401);
        return;
    }
    res.sendStatus(401);
    return;
});

loginRouter.delete("/", async (req, res) => {
    res.sendStatus(204);
    return;
})