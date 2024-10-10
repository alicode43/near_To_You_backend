import mongoose, {Schema} from "mongoose";
import { User } from "./user.model";

var BookingSchema = new Schema({
    user: {
      type: Schema.Types.ObjectId,
      ref:"User"
    },
    service: {
      type: Schema.Types.ObjectId
    },
    provider: {
      type: Schema.Types.ObjectId
    },
    bookingDate: {
      type: Date
    },
    timeSlot: {
      type: String
    },
    status: {
      type: String
    },
    paymentStatus: {
      type: Boolean
    },
    totalCost: {
      type: Number
    },
    createdAt: {
      type: Date
    }
  },
  {timestamps: true}
);

  export default Booking=mongoose.model("Booking",BookingSchema);