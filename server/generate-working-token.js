import { authService } from './services/authService.js';
import { storage } from './mongodb-storage.js';
import nodemailer from 'nodemailer';

async function generateWorkingToken() {
  const email = 'john.doe@techcorp.com';
  const user = await storage.getUserByEmail(email);
  
  if (user) {
    // Generate a fresh reset token
    const resetToken = authService.generateResetToken();
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour from now
    
    // Store the token
    await storage.updateUser(user._id, {
      passwordResetToken: resetToken,
      passwordResetExpires: resetExpires
    });
    
    // Send email with valid token
    const transporter = nodemailer.createTransport({
      host: process.env.MAILTRAP_HOST,
      port: parseInt(process.env.MAILTRAP_PORT),
      auth: {
        user: process.env.MAILTRAP_USERNAME,
        pass: process.env.MAILTRAP_PASSWORD
      }
    });
    
    const resetUrl = `https://25b3cec7-b6b2-48b7-a8f4-7ee8a9c12574-00-36vzyej2u9kbm.kirk.replit.dev/reset-password?token=${resetToken}`;
    
    await transporter.sendMail({
      from: 'TaskSetu <noreply@tasksetu.com>',
      to: email,
      subject: 'Password Reset - TaskSetu [WORKING TOKEN]',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333;">Password Reset Request</h1>
          <p>Hello ${user.firstName},</p>
          <p>Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #28a745; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Reset Password Now
            </a>
          </div>
          <p>Or copy this link: <br><code style="word-break: break-all;">${resetUrl}</code></p>
          <p style="color: #666; font-size: 12px;">
            Token generated: ${new Date().toLocaleString()}<br>
            Expires: ${resetExpires.toLocaleString()}
          </p>
        </div>
      `
    });
    
    console.log('Working reset token generated and email sent');
    console.log('Reset URL:', resetUrl);
  }
  
  process.exit(0);
}

generateWorkingToken();