import { model, Schema, Types } from 'mongoose';

export interface IBuchung {
    name: string;
    pocket: Types.ObjectId;
    kategorie: Types.ObjectId;
    datum: Date;
    betrag: number;
    typ: string;
    zukunft?: boolean,
    notiz?: string;
}

// base schema for all derived buchung
export const buchungSchema = new Schema<IBuchung>({
    name: { type: String, required: true },
    pocket: { type: Schema.Types.ObjectId, ref: "Pocket", required: true },
    kategorie: { type: Schema.Types.ObjectId, ref: "Buchungskategorie", required: true },
    datum: { type: Date, required: true },
    betrag: { type: Number, required: true },
    typ: { type: String, required: true, enum: ["einzahlung", "ausgabe"], default: "ausgabe" }, // Einzahlung oder Ausgabe
    zukunft: { type: Boolean, required: false, default: false },
    notiz: { type: String }
});

export const Buchung = model('Buchung', buchungSchema);