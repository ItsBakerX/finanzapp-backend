import express from "express";
import { logger } from "../../src/logger";
import { createBenutzer, deleteBenutzer, getBenutzer, updateBenutzer } from "../../src/services/BenutzerService";
import { v4 as uuidv4 } from 'uuid';
import { sendConfirmationEmail } from "../../src/services/EmailService";
import { createVerification, verifyCode } from "../../src/services/VerificationService";
import { body, matchedData, param, validationResult } from "express-validator";
import { BenutzerResource } from "../../src/Resources";
import { authenticate } from "./Authentication";
import { Benutzer } from "../../src/models/BenutzerModel";

export const benutzerRouter = express.Router();

benutzerRouter.get("/:id", authenticate, async (req, res) => {
	if (req.params.id != req.userId) {
		res.sendStatus(401);
		return;
	}
	try {
		const benutzer = await getBenutzer(req.params.id);
		res.status(200).send(benutzer);
		return;
	} catch (e) {
		res.sendStatus(404);
		return;
	}
});

benutzerRouter.delete("/:id", authenticate, async (req, res) => {
	if (req.params.id != req.userId) {
		res.sendStatus(401);
		return;
	}
	try {
		await deleteBenutzer(req.params.id);
		res.sendStatus(204);
		return;
	} catch (e) {
		res.sendStatus(404);
	}
});

benutzerRouter.post(
	"/register",
	body("name").trim().isString().isLength({ min: 1 }),
	body("email").trim().isEmail().toLowerCase(),
	body("password")
		.isString()
		.isStrongPassword({
			minLength: 8,
			minUppercase: 1,
			minLowercase: 1,
			minNumbers: 1,
			minSymbols: 1,
		})
		.withMessage(
			"Passwort muss mindestens 8 Zeichen lang sein und mindestens einen Großbuchstaben, einen Kleinbuchstaben, eine Zahl und ein Sonderzeichen enthalten"
		),
	async (req, res) => {
		logger.info("Register request received");
		const result = validationResult(req);
		if (!result.isEmpty()) {
			logger.error("Invalid register request");
			res.status(400).send({ errors: result.array() });
			return;
		}
		try {
			logger.info(req.body);
			const data = matchedData(req) as BenutzerResource;
			const benutzer = await createBenutzer(data);

			// Generate code
			const confirmationCode = uuidv4().slice(0, 6);
			// Save code
			await createVerification(benutzer.email, confirmationCode);
			// Send email
			await sendConfirmationEmail(benutzer.email, confirmationCode);
			res.status(201).send(benutzer);
		} catch (e: any) {
			if (e.message.includes("duplicate key error")) {
				res.status(400).send("Benutzer existiert bereits");
			}
			res.sendStatus(400);
		}
	}
);

benutzerRouter.post(
	"/verify",
	body("code").isString().isLength({ min: 6, max: 6 }),
	body("email").isEmail(),
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			res.status(400).send(errors.array());
			return;
		}
		try {
			const { code, email } = matchedData(req);
			const verified = await verifyCode(email, code);
			if (verified) {
				res.sendStatus(204);
				return;
			} else {
				res.sendStatus(400);
				return;
			}
		} catch (e) {
			res.sendStatus(400);
			return;
		}
	}
);

//Wenn die Email verändert wird muss vom frontend annschließend der Router benutzer/verify/update aufgerufen werden
benutzerRouter.put(
	"/:id/",
	authenticate,
	param("id").isMongoId(),
	body("name").trim().optional().isString().isLength({ min: 1 }),
	body("email").trim().optional().isEmail().toLowerCase(),
	body("password").trim().optional().isString().isLength({ min: 8 }),
	async (req, res) => {
		const result = validationResult(req);
		console.log(result.array());
		if (!result.isEmpty()) {
			res.status(400).send({ errors: result.array() });
			return;
		}
		if (req.params.id != req.userId) {
			res.sendStatus(501);
			return;
		}
		try {
			const data = matchedData(req) as BenutzerResource;
			console.log(data);
			const benutzer = await updateBenutzer(req.params.id, data);
			res.status(200).send(benutzer);
		} catch (e: any) {
			console.log(e.message);
			res.sendStatus(400);
		}
	}
);

benutzerRouter.post(
	"/checkPassword",
	authenticate,
	body("password").isString().isLength({ min: 8 }),
	async (req, res) => {
		const result = validationResult(req);
		if (!result.isEmpty()) {
			res.status(400).send({ errors: result.array() });
			return;
		}
		try {
			const benutzer = await Benutzer.findById(req.userId).exec();
			const result = await benutzer!.isCorrectPassword(req.body.password);
			console.log(result + " " + req.body.password);
			if (result) {
				res.sendStatus(200);
			} else {
				res.sendStatus(401);
			}
		} catch (e) {
			res.sendStatus(400);
		}
	}
);
