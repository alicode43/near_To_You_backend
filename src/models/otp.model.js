import mongoose, {Schema} from "mongoose";  

const otpSchema = new Schema({
    otp:{
        typeof:Number,
        required:true,
    },
    userId:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },
    expriryTime:{
        type:Date,
        required:true,
    }
    

});
otpSchema.pre('save', function (next) {
    if (!this.expriryTime) {
        this.expriryTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
    }
    next();
});


export const OTP= mongoose.model('otp',otpSchema);