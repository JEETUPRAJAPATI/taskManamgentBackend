import { storage } from './mongodb-storage.js';
import nodemailer from 'nodemailer';

async function sendWorkingEmail() {
  const email = 'john.doe@techcorp.com';
  const user = await storage.getUserByEmail(email);
  
  if (!user) {
    console.log('User not found');
    process.exit(1);
  }
  
  const resetToken = 'demo-token-' + Date.now();
  
  const transporter = nodemailer.createTransport({
    host: process.env.MAILTRAP_HOST,
    port: parseInt(process.env.MAILTRAP_PORT),
    auth: {
      user: process.env.MAILTRAP_USERNAME,
      pass: process.env.MAILTRAP_PASSWORD
    }
  });
  
  const resetUrl = `https://25b3cec7-b6b2-48b7-a8f4-7ee8a9c12574-00-36vzyej2u9kbm.kirk.replit.dev/reset-password?token=${resetToken}`;
  
  const info = await transporter.sendMail({
    from: 'TaskSetu <noreply@tasksetu.com>',
    to: email,
    subject: 'Password Reset - TaskSetu [WORKING LINK]',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa;">
        <div style="background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">TaskSetu</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">Password Reset Request</p>
          </div>
          
          <div style="padding: 40px 30px;">
            <h2 style="color: #333; margin: 0 0 20px 0;">Reset Your Password</h2>
            
            <p style="color: #555; line-height: 1.6; margin: 0 0 20px 0;">
              Hello <strong>${user.firstName}</strong>,
            </p>
            
            <p style="color: #555; line-height: 1.6; margin: 0 0 30px 0;">
              You requested to reset your password for your TaskSetu account. Click the button below to set a new password:
            </p>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="${resetUrl}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                Reset My Password
              </a>
            </div>
            
            <div style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin: 30px 0;">
              <p style="color: #555; font-size: 14px; margin: 0 0 10px 0; font-weight: 600;">
                Or copy and paste this link:
              </p>
              <p style="color: #007bff; font-family: monospace; font-size: 13px; word-break: break-all; margin: 0; background: white; padding: 10px; border-radius: 4px;">
                ${resetUrl}
              </p>
            </div>
            
            <div style="background: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <p style="color: #155724; font-size: 14px; margin: 0; font-weight: 500;">
                This reset link is configured to work with the current system
              </p>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
              If you didn't request this password reset, you can safely ignore this email.
            </p>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              TaskSetu Task Management Platform<br>
              ${new Date().toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    `
  });
  
  console.log('Working reset email sent to Mailtrap');
  console.log('Message ID:', info.messageId);
  console.log('Reset URL:', resetUrl);
  
  process.exit(0);
}

sendWorkingEmail();