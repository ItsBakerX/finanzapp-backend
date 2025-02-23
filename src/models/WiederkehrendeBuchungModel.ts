import { model, Schema } from 'mongoose';
import { buchungSchema, IBuchung } from './BuchungModel';

export enum Intervall {
    TAG = "tag",
    WOCHE = "woche",
    VIERZEHN_TAGE = "vierzehnTage",
    MONAT = "monat",
    QUARTAL = "quartal",
    HALBES_JAHR = "halbesJahr",
    JAHR = "jahr"
}

export interface IWiederkehrendeBuchung extends IBuchung {
    intervall: Intervall;
}

const wiederkehrendeBuchungSchema = new Schema<IWiederkehrendeBuchung>();
wiederkehrendeBuchungSchema
    .add(buchungSchema) // adds the buchungSchema to the wiederkehrendeBuchungSchema
    .add({ intervall: { type: String, required: true, enum: Intervall, default: Intervall.MONAT } }) // additional property

export const WiederkehrendeBuchung = model('WiederkehrendeBuchung', wiederkehrendeBuchungSchema);