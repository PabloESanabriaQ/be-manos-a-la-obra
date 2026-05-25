import mongoose from 'mongoose';

const { Schema } = mongoose;

const usersSchema = new Schema({
  email: { type: String, required: true },
  username: { type: String, required: true },
  password: { type: String, required: true },
  name: {
    first: { type: String, required: false },
    last: { type: String, required: false },
  },
  role: {
    type: String,
    enum: ['admin_users', 'admin_projects', 'member'],
    default: 'member',
  },
  active: { type: Boolean, default: true },
});

export default mongoose.models['user'] || mongoose.model('user', usersSchema);
