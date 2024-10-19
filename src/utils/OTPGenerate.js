import { OTP } from "../models/OTPModel.model.js";
// import { Resend } from "resend";

const otpGenerate=async function(email){
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

      // const resend = new Resend(process.env.RESEND_API_KEY);
//   const htmlContent = `<strong>Near To You <br> Your OTP code is ${otp}</strong>`;

  // const { data, error } = await resend.emails.send({
  //   from: "Acme <onboarding@resend.dev>",
  //   to: email,
  //   subject: "Verify Your Account",
  //   html: htmlContent,
  // });

    const user= await OTP.findOneAndUpdate({email},{
        $set:{
            otp:otp,
        }
    })

    if(!user){
        const OTPCreate = await OTP.create({
            otp,
            email,
            isConsumed: false,
        
          });
          if (!OTPCreate) {
            throw new ApiError(500, "Otp not created");
          }
    }
    return true;
}
export default otpGenerate;