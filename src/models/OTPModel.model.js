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
  purpose:{
    type:String,
    required:true,
     default:"change password"
   
  },
  isConsumed: {
    type: Boolean,
    default: false,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
});
otpSchema.pre("save", function (next) {
  if (this.isModified("otp")) {
    this.expriryTime = new Date(Date.now() + 10 * 60 * 1000);
  }
  next();
});

otpSchema.methods.isOTPCorrect=  function(otp){
    return this.opt === otp;
}
otpSchema.methods.isExpired=  function(){
    const date=new Date(Date.now());
    return this.expriryTime<date;
}


export const OTP = mongoose.model("otp", otpSchema);
