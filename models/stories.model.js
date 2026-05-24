import mongoose from 'mongoose';
import Epic from './epics.model.js';
import User from './users.model.js';

const { Schema } = mongoose;

const storiesSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: false },
  epic: { type: Schema.Types.ObjectId, ref: Epic, required: true },
  owner: { type: Schema.Types.ObjectId, ref: User, required: false },
  assignedTo: [{ type: Schema.Types.ObjectId, ref: User, required: false }],
  points: { type: Number, required: false, default: 0, min: 0, max: 5 },
  created: { type: Date, default: Date.now, required: false },
  due: { type: Date, required: false },
  started: { type: Date, required: false },
  finished: { type: Date, required: false },
  status: { type: String, enum: ['todo', 'running', 'done'], required: false, default: 'todo' },
  icon: { type: String, required: false },
  deletedAt: { type: Date, default: null },
});

export default mongoose.models['story'] || mongoose.model('story', storiesSchema);
