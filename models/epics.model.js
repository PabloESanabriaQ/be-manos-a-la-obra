import mongoose from 'mongoose';
import Project from './projects.model.js';

const { Schema } = mongoose;

const epicsSchema = new Schema({
  project: { type: Schema.Types.ObjectId, ref: Project, required: true },
  name: { type: String, required: true },
  description: { type: String, required: false },
  icon: { type: String, required: false },
});

export default mongoose.models['epic'] || mongoose.model('epic', epicsSchema);
