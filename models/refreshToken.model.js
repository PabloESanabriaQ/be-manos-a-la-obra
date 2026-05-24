import mongoose from 'mongoose';

const { Schema } = mongoose;

const refreshTokenSchema = new Schema({
  token: { type: String, required: true, unique: true },
  user: { type: Schema.Types.ObjectId, ref: 'user', required: true },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models['refreshToken'] || mongoose.model('refreshToken', refreshTokenSchema);
