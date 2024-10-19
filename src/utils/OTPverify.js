import { OTP } from "../models/OTPModel.model.js";
import { ApiError } from "./ApiError.js";

const otpVerify= async function(otp,email){

    if (
        [otp, email].some((field) => {
          field?.trim() === "";
        })
      ) {
        throw new ApiError(400, "All fields must be filled");
      }
      const verify = await OTP.findOne({
        email,
      });
    
      if (!verify) {
        throw new ApiError(404, "Email not found");
      }
      if(verify.isConsumed){
       throw new ApiError(400, "Otp is already used");
    }
    
      const isOtpCorrect = await verify.isOTPCorrect(otp);
      const isExpired = await verify.isExpired();
       const date=new Date(Date.now());
   
    
     
       if (otp != verify.otp) {
        throw new ApiError(400, "Otp is incorrect");
      } else if (isExpired) {
        throw new ApiError(400, "Otp is expired");
      }
      verify.isConsumed=true;
      verify.save();
      return true;
}

export default otpVerify;