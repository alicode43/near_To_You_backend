import mongoose, { Schema } from "mongoose";

const otpSchema = new Schema({
  otp: {
    type: String,
    required: true,
  },

  email: {
    type: String,
  },
  expriryTime: {
    type: Date,
   
  },
  isConsumed: {
    type: Boolean,
    default: false,
  },
});
otpSchema.pre("save", function (next) {

    this.expriryTime = new Date(Date.now() + 10 * 60 * 1000); 
  
  next();
});

otpSchema.methods.isOTPCorrect=  function(otp){
    return this.opt === otp;
}
otpSchema.methods.isExpired=  function(){
    const date=new Date(Date.now());
    return this.expriryTime<date;
}


export const Verify = mongoose.model("Verify", otpSchema);
