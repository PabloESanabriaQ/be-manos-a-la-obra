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
  points: { type: Number, required: false, default: 0, enum: [0, 1, 2, 3, 5, 8, 13, 21] },
  created: { type: Date, default: Date.now, required: false },
  due: { type: Date, required: false },
  started: { type: Date, required: false },
  finished: { type: Date, required: false },
  status: { type: String, enum: ['todo', 'running', 'done'], required: false, default: 'todo' },
  icon: { type: String, required: false },
  deletedAt: { type: Date, default: null },
});

export default mongoose.models['story'] || mongoose.model('story', storiesSchema);
