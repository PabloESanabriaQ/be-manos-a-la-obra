import mongoose from 'mongoose';
import Story from './stories.model.js';

const { Schema } = mongoose;

const tasksSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: false },
  story: { type: Schema.Types.ObjectId, ref: Story, required: true },
  status: { type: String, enum: ['todo', 'running', 'done'], required: false, default: 'todo' },
  created: { type: Date, default: Date.now, required: false },
  dueDate: { type: Date, required: false },
  done: { type: Boolean, required: false, default: false },
});

export default mongoose.models['task'] || mongoose.model('task', tasksSchema);
