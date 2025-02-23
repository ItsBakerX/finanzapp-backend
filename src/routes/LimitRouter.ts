import express from "express";
import {
  getOutcomeTowardsLimitMonthly,
  getOutcomeTowardsLimitMontlyAllCategories,
  isLimitReached,
  isLimitReachedAllCategories,
  isLimitReachedIfBuchungAdded,
} from "../../src/services/LimitService";
import { authenticate } from "./Authentication";
import { param, validationResult } from "express-validator";

export const limitRouter = express.Router();

limitRouter.get(
  "/progress/:kategoryId",
  authenticate,
  param("kategoryId").isMongoId(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).send({ errors: errors.array() });
      return;
    }
    const kategoryId = req.params.kategoryId;
    try {
      const progress = await getOutcomeTowardsLimitMonthly(kategoryId);
      res.send({ progress: progress });
      return;
    } catch (e) {
      if (e instanceof Error) {
        if (e.message === `Kategorie mit ID ${kategoryId} nicht gefunden`) {
          res.status(404).send({
            errors: [
              {
                type: "field",
                location: "params",
                path: "kategoryId",
                msg: e.message,
              },
            ],
          });
          return;
        }
      }
      res.sendStatus(400);
      return;
    }
  }
);

limitRouter.get("/progress/all", authenticate, async (req, res) => {
  try {
    const progress = await getOutcomeTowardsLimitMontlyAllCategories(
      req.userId!
    );
    res.send(progress);
    return;
  } catch (e) {
    res.sendStatus(400);
    return;
  }
});

limitRouter.get(
  "/limitReached/:kategoryId",
  authenticate,
  param("kategoryId").isMongoId(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).send({ errors: errors.array() });
      return;
    }
    const kategoryId = req.params.kategoryId;
    try {
      const limitReached = await isLimitReached(kategoryId);
      res.send({ limitReached: limitReached });
      return;
    } catch (e) {
      res.sendStatus(400);
      return;
    }
  }
);

limitRouter.get("/limitReached/all", authenticate, async (req, res) => {
  try {
    const limitReached = await isLimitReachedAllCategories(req.userId!);
    res.send(limitReached);
    return;
  } catch (e) {
    res.sendStatus(400);
    return;
  }
});

limitRouter.get(
  "/limitReached/:kategoryId/:betrag",
  authenticate,
  param("kategoryId").isMongoId(),
  param("betrag").isNumeric(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).send({ errors: errors.array() });
      return;
    }
    const kategoryId = req.params.kategoryId;
    const betrag = parseFloat(req.params.betrag);
    try {
      const limitReached = await isLimitReachedIfBuchungAdded(
        kategoryId,
        betrag
      );
      res.send({ limitReached: limitReached });
      return;
    } catch (e) {
      res.sendStatus(400);
      return;
    }
  }
);
