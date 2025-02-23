import { NextFunction, Request, Response } from "express";
import { createBuchung, getAlleWiederkehrendeBuchungen } from "../../src/services/BuchungService";
import { BuchungResource } from "../../src/Resources";
import { Intervall, WiederkehrendeBuchung } from "../../src/models/WiederkehrendeBuchungModel";
import { dateToString, stringToDate } from "../../src/services/ServiceHelper";
import { add, isAfter, isBefore, isEqual } from "date-fns";

export async function wiederkehrendeBuchungen(req: Request, res: Response, next: NextFunction) {
    const userId = req.userId;
    try {
        const buchungen = await getAlleWiederkehrendeBuchungen(userId!);
        if (buchungen.length === 0) {
            next();
            return;
        }
        const dateNow = new Date(Date.now());
        for (const buchung of buchungen) {
            await handleWiederkehrend(buchung)
        }
        next();
    } catch (err: any) {
        res.status(500).send({ message: err.message });
        return;
    }
}

async function handleWiederkehrend(buchung: BuchungResource) {
    const dateNow = new Date(Date.now());
    switch (buchung.intervall) {
        case Intervall.TAG:
            await createLoop(buchung, dateNow, { days: 1 });
            break;
        case Intervall.WOCHE:
            await createLoop(buchung, dateNow, { weeks: 1 }); 
            break;
        case Intervall.VIERZEHN_TAGE:
            await createLoop(buchung, dateNow, { weeks: 2 });
            break;
        case Intervall.MONAT:
            await createLoop(buchung, dateNow, { months: 1 });
            break;
        case Intervall.QUARTAL:
            await createLoop(buchung, dateNow, { months: 3 });
            break;
        case Intervall.HALBES_JAHR:
            await createLoop(buchung, dateNow, { months: 6 });
            break;
        case Intervall.JAHR:
            await createLoop(buchung, dateNow, { years: 1 });
            break;
    }
}

async function createLoop(buchung: BuchungResource, dateNow: Date, increment: {}) {
    let buchungDate: Date = stringToDate(buchung.datum);
    let buchungAddedIncrement: Date = add(buchungDate, increment);
    while (!isBefore(dateNow, buchungAddedIncrement)) {
        await WiederkehrendeBuchung.updateOne({ _id: buchung.id }, { datum: buchungAddedIncrement });
        delete buchung.intervall;
        buchung.datum = dateToString(buchungAddedIncrement);
        await createBuchung({ ...buchung, fromWiederkehrend: true });
        buchungDate = buchungAddedIncrement;
        buchungAddedIncrement = add(buchungDate, increment);
    }
    return
}