import mongoose from 'mongoose';

const logSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  shop_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: false },
  action: { type: String, required: true },
  target_type: { type: String },
  target_id: { type: String },
  request: { type: Object },
  response: { type: Object },
  success: { type: Boolean, default: true },
  error_message: { type: String },
  source: { type: String, enum: ['manual', 'system', 'scheduler'], default: 'manual' },
  ip_address: { type: String },
  meta: { type: Object },
  created_at: { type: Date, default: Date.now }
});

export default mongoose.model('Log', logSchema);