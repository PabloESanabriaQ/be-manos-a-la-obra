import mongoose from 'mongoose';
import User from './users.model.js';

const { Schema } = mongoose;

const projectSchema = new Schema({
  name: { type: String, required: true },
  members: [
    {
      user: { type: Schema.Types.ObjectId, ref: User, required: true },
      role: {
        type: String,
        enum: ['admin_projects', 'member'],
        required: true,
      },
    },
  ],
  description: { type: String, required: false },
  icon: { type: String, required: false },
  deletedAt: { type: Date, default: null },
});

export default mongoose.models['project'] || mongoose.model('project', projectSchema);
