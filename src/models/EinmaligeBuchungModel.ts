import { model, Schema } from 'mongoose';
import { buchungSchema, IBuchung } from '../../src/models/BuchungModel'

export interface IEinmalig extends IBuchung {
    fromWiederkehrend: boolean;
}

const einmaligeBuchungSchema = new Schema<IEinmalig>();
einmaligeBuchungSchema
    .add(buchungSchema) // adds the buchungSchema to the einmaligeBuchungSchema
    .add({ fromWiederkehrend: { type: Schema.Types.Boolean, required: false, default: false } }); // additional property

export const EinmaligeBuchung = model('EinmaligeBuchung', einmaligeBuchungSchema);