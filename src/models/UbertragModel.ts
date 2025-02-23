import { model, Schema, Types } from 'mongoose';
import { buchungSchema, IBuchung } from './BuchungModel';

export interface IUbertrag extends IBuchung {
    zielPocket: Types.ObjectId;
}

const ubertragSchema = new Schema<IUbertrag>();
ubertragSchema
    .add(buchungSchema) // adds the buchungSchema to the ubertragSchema
    .add({ zielPocket: { type: Schema.Types.ObjectId, ref: "Pocket", required: true } }); // additional property

export const Ubertrag = model('Ubertrag', ubertragSchema);