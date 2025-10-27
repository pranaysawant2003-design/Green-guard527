const crypto = require('crypto');
/* const nodemailer = require('nodemailer'); */

// Generate OTP
const generateOTP = (length = 6) => {
  return crypto.randomInt(10 ** (length - 1), 10 ** length).toString();
};

// Email transporter for Brevo
/*const createEmailTransporter = () => {
  console.log('Creating Brevo email transporter');
  
  return nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.BREVO_API_KEY
    }
  });
}; 

// Send OTP via email
const sendEmailOTP = async (email, otp) => {
  try {
    console.log('📧 Sending email to:', email);
    console.log('🔢 OTP Code:', otp);
    
    const transporter = createEmailTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Green Guard - Email Verification',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">🌱 Green Guard</h1>
          </div>
          <div style="padding: 30px; background: #f9fafb;">
            <h2 style="color: #374151; margin-bottom: 20px;">Email Verification</h2>
            <p style="color: #6b7280; margin-bottom: 30px;">
              Thank you for joining Green Guard! Please use the verification code below to complete your registration.
            </p>
            <div style="background: white; padding: 20px; border-radius: 10px; text-align: center; border: 2px solid #10b981;">
              <h3 style="color: #10b981; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h3>
              <p style="color: #6b7280; font-size: 14px; margin-top: 10px;">
                This code will expire in 10 minutes
              </p>
            </div>
            <p style="color: #6b7280; margin-top: 30px; font-size: 14px;">
              If you didn't create this account, please ignore this email.
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully!');
    return true;
  } catch (error) {
    console.error('❌ Email sending error:', error);
    return false;
  }
}; */

const sendEmailOTP = async (email, otp, type = 'verification') => {
  try {
    if (type === 'password-reset') {
      console.log(`Password reset link for ${email}: ${otp}`);
      // In a real implementation, you would send an email with the reset link
      // For now, we'll just log it
      return true;
    } else {
      console.log(`OTP for ${email}: ${otp}`);
      return true;
    }
  } catch (error) {
    console.error('❌ Email sending error:', error);
    return false;
  }
};

// Send OTP via SMS (placeholder - you'll need to integrate with SMS service)
const sendSMSOTP = async (phone, otp) => {
  try {
    // This is a placeholder - you'll need to integrate with services like:
    // - Twilio
    // - AWS SNS
    // - Vonage
    // - Your preferred SMS provider
    
    console.log(`SMS OTP ${otp} sent to ${phone}`);
    return true;
  } catch (error) {
    console.error('SMS sending error:', error);
    return false;
  }
};

// Verify OTP
const verifyOTP = (storedOTP, storedExpiry, providedOTP) => {
  if (!storedOTP || !storedExpiry || !providedOTP) {
    return false;
  }

  // Check if OTP is expired
  if (new Date() > new Date(storedExpiry)) {
    return false;
  }

  // Check if OTP matches
  return storedOTP === providedOTP;
};

module.exports = {
  generateOTP,
  sendEmailOTP,
  sendSMSOTP,
  verifyOTP
}; 