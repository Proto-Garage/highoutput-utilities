/* eslint-disable no-underscore-dangle */
import mongoose, {
  Connection, Schema, Document, Model,
} from 'mongoose';
import R from 'ramda';
import { ProjectionStore, ProjectionState } from '@arque/types';

export default class implements ProjectionStore {
  public readonly connection: Connection;

  public readonly model: Model<ProjectionState & Document>;

  constructor(connection?: Connection) {
    this.connection = connection || mongoose.createConnection('mongodb://localhost');

    const schema = new Schema({
      _id: {
        type: String,
        required: true,
      },
      status: {
        type: String,
        default: 'PENDING',
      },
      lastEvent: {
        type: Buffer,
        default: null,
      },
      lastUpdated: {
        type: Date,
        default: () => Date.now(),
      },
    }, { _id: false });

    this.model = this.connection.model<ProjectionState & Document>('Projection', schema);
  }

  async find(id: string): Promise<ProjectionState | null> {
    const projection = await this.model.findOne({ _id: id });

    if (!projection) {
      return null;
    }

    return {
      ...R.pick(['status', 'lastEvent', 'lastUpdated'], projection),
      id: projection._id,
    };
  }

  async save(params: Pick<ProjectionState, 'id'>
    & Partial<Pick<ProjectionState, 'status' | 'lastEvent'>>) {
    await this.model.updateOne({ _id: params.id }, R.pick(['status', 'lastEvent'], params), {
      upsert: true,
      setDefaultsOnInsert: true,
    });
  }
}
