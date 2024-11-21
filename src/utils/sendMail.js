import { Resend } from 'resend';

export default async function sendMail(email, resetUrl, Otp) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  var htmlContent = ""
  if(!resetUrl){

       htmlContent = `<strong>Near To You <br> Your OTP code is ${Otp}</strong>`;
  }else{
         htmlContent = `<strong>Near To You <br> Click <a href="${resetUrl}">here</a> to reset your password</strong>`;
  }
  

  try {
    const { data, error } = await resend.emails.send({
      from: "Acme <onboarding@resend.dev>",
      to: email,
      subject: "Verify Your Account",
      html: htmlContent,
    });

    if (error) {
      console.error('Error sending email:', error);
    } else {
      console.log('Email sent successfully:', data);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}
