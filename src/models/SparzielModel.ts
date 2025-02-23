import { model, Schema, Types } from 'mongoose';
import { IPocket, pocketSchema } from '../../src/models/PocketModel';

export interface ISparziel extends IPocket {
    zielbetrag: number;
    faelligkeitsdatum?: Date;
}

const sparzielSchema = new Schema<ISparziel>();
sparzielSchema
    .add(pocketSchema)
    .add({
        zielbetrag: { type: Number, required: true },
        faelligkeitsdatum: { type: Date }
    });

export const Sparziel = model('Sparziel', sparzielSchema);