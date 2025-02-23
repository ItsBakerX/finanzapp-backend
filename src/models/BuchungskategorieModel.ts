import { model, Schema, Types } from 'mongoose';

export interface IBuchungskategorie {
    name: string;
    benutzer: Types.ObjectId;
    ausgabenlimit?: number | null;
}

const buchungskategorieSchema = new Schema<IBuchungskategorie>({
    name: { type: String, required: true },
    benutzer: { type: Schema.Types.ObjectId, ref: "Benutzer", required: true },
    ausgabenlimit: { type: Number, required: false }
});

export const Buchungskategorie = model('Buchungskategorie', buchungskategorieSchema);