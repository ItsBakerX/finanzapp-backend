import express from "express";
import { createPocket, deletePocket, getAllePockets, getPocket, updatePocketNameOrNotiz } from "../services/PocketService";
import { authenticate } from "./Authentication";
import { body, param, validationResult } from "express-validator";

export const pocketRouter = express.Router();

pocketRouter.get("/alle",
    authenticate,
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }
        try {
            const pockets = await getAllePockets(req.userId!);
            res.status(200).send(pockets);
            return;
        } catch (e) {
            if (e instanceof Error) {
                if (e.message === `Benutzer mit ID ${req.userId} existiert nicht`) {
                    res.status(404).json({
                        errors: [
                            { type: "field", location: "body", path: "benutzer", msg: e.message }
                        ]
                    })
                    return;
                }
            }
            res.sendStatus(404);
            return;
        }
    });

pocketRouter.get("/:id",
    authenticate,
    param('id').isMongoId(),
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }
        try {
            const pocket = await getPocket(req.params.id);
            res.status(200).send(pocket);
            return;
        } catch (e) {
            if (e instanceof Error) {
                if (e.message === `Kein Pocket mit der ID ${req.params.id} gefunden`) {
                    res.status(404).json({
                        errors: [
                            { type: "field", location: "params", path: "id", msg: e.message }
                        ]
                    })
                    return;
                }
            }
            res.sendStatus(404)
            return;
        }
    });

pocketRouter.post("/",
    authenticate,
    body('name').isString().notEmpty(),
    body('benutzer').isMongoId(),
    body('betrag').isNumeric(),
    body('notiz').optional().isString(),
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return
        }
        try {
            const pocket = await createPocket(req.body);
            res.status(201).send(pocket);
            return;
        } catch (e) {
            if (e instanceof Error) {
                if (e.message === `Benutzer existiert nicht`) {
                    res.status(404).json({
                        errors: [
                            { type: "field", location: "body", path: "benutzer", msg: e.message }
                        ]
                    })
                    return;
                }
            }
            res.sendStatus(400);
            return;
        }
    });

pocketRouter.put("/:id",
    authenticate,
    param('id').isMongoId(),
    body('benutzer').isMongoId(),
    body('betrag').isNumeric(),
    body('name').isString().notEmpty(),
    body('notiz').isString(),

    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }
        try {
            const id = req.params!.id;
            const { name, notiz } = req.body;
            const update = await updatePocketNameOrNotiz(id, { name: name, notiz: notiz });
            res.status(200).send(update);
            return;
        } catch (e) {
            if (e instanceof Error) {
                if (e.message === `Kein Pocket mit der ID ${req.params!.id} gefunden`) {
                    res.status(404).json({
                        errors: [
                            { type: "field", location: "params", path: "id", msg: e.message }
                        ]
                    })
                    return;
                }
            }
            res.sendStatus(404)
            return;
        }
    })

pocketRouter.delete("/:id",
    authenticate,
    param('id').isMongoId(),
    body("deleteBuchungen").optional().isBoolean(),
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }
        try {
            await deletePocket(req.params.id, req.body.deleteBuchungen);
            res.status(204).send();
            return;
        } catch (e) {
            if (e instanceof Error) {
                if (e.message === `Kein Pocket mit der ID ${req.params.id} gefunden`) {
                    res.status(404).json({
                        errors: [
                            { type: "field", location: "params", path: "id", msg: e.message }
                        ]
                    })
                    return;
                }
            }
            res.sendStatus(404);
            return;
        }
    });

