import { model, Schema, Types } from 'mongoose';

export interface IPocket {
    name: string;
    benutzer: Types.ObjectId;
    betrag: number;
    notiz?: string;
}

export const pocketSchema = new Schema<IPocket>({
    name: { type: String, required: true },
    benutzer: { type: Schema.Types.ObjectId, ref: "Benutzer", required: true },
    betrag: { type: Number, required: true },
    notiz: { type: String }
});

export const Pocket = model('Pocket', pocketSchema);