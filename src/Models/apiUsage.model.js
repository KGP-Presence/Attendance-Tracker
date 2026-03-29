import mongoose,{ Schema , model} from 'mongoose';

const apiUsageSchema = new Schema({
  date: { 
    type: String, 
    required: true, 
    unique: true // Format: "YYYY-MM-DD"
  },
  sarvamCost: { 
    type: Number, 
    default: 0 
  }
});

export const ApiUsage = model('ApiUsage', apiUsageSchema)