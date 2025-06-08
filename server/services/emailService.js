import sgMail from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  console.warn("SENDGRID_API_KEY environment variable not set. Email functionality will be disabled.");
} else {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

class EmailService {
  constructor() {
    this.isConfigured = !!process.env.SENDGRID_API_KEY;
  }

  async sendVerificationEmail(email, verificationCode, firstName, organizationName = null) {
    if (!this.isConfigured) {
      console.log('SendGrid not configured. Verification code for', email, ':', verificationCode);
      return false;
    }

    try {
      const msg = {
        to: email,
        from: 'noreply@tasksetu.com', // You can use any email here for testing
        subject: 'Verify Your Email - TaskSetu',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Email Verification</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #3B82F6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
              .code { font-size: 24px; font-weight: bold; color: #3B82F6; text-align: center; background: white; padding: 15px; border-radius: 8px; margin: 20px 0; }
              .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Welcome to TaskSetu!</h1>
              </div>
              <div class="content">
                <h2>Hi ${firstName}!</h2>
                ${organizationName ? 
                  `<p>Thank you for registering your organization <strong>${organizationName}</strong> with TaskSetu.</p>` :
                  `<p>Thank you for signing up with TaskSetu.</p>`
                }
                <p>To complete your registration, please verify your email address using the verification code below:</p>
                
                <div class="code">${verificationCode}</div>
                
                <p>This code will expire in 24 hours. If you didn't request this verification, please ignore this email.</p>
                
                <p>Welcome aboard!<br>The TaskSetu Team</p>
              </div>
              <div class="footer">
                <p>This is an automated message. Please do not reply to this email.</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `Hi ${firstName}!\n\n${organizationName ? 
          `Thank you for registering your organization ${organizationName} with TaskSetu.` :
          `Thank you for signing up with TaskSetu.`
        }\n\nTo complete your registration, please verify your email address using this verification code: ${verificationCode}\n\nThis code will expire in 24 hours.\n\nWelcome aboard!\nThe TaskSetu Team`
      };

      await sgMail.send(msg);
      console.log('Verification email sent successfully to:', email);
      return true;
    } catch (error) {
      console.error('SendGrid email error:', error.response?.body || error.message);
      return false;
    }
  }

  async sendPasswordResetEmail(email, resetToken, firstName) {
    if (!this.isConfigured) {
      console.log('SendGrid not configured. Password reset token for', email, ':', resetToken);
      return false;
    }

    try {
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/reset-password?token=${resetToken}`;
      
      const msg = {
        to: email,
        from: 'noreply@tasksetu.com',
        subject: 'Reset Your Password - TaskSetu',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #EF4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
              .button { display: inline-block; background: #EF4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
              .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Password Reset Request</h1>
              </div>
              <div class="content">
                <h2>Hi ${firstName}!</h2>
                <p>We received a request to reset your password for your TaskSetu account.</p>
                
                <p>Click the button below to reset your password:</p>
                <a href="${resetUrl}" class="button">Reset Password</a>
                
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #666;">${resetUrl}</p>
                
                <p>This link will expire in 1 hour for security reasons.</p>
                
                <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
                
                <p>Best regards,<br>The TaskSetu Team</p>
              </div>
              <div class="footer">
                <p>This is an automated message. Please do not reply to this email.</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `Hi ${firstName}!\n\nWe received a request to reset your password for your TaskSetu account.\n\nClick this link to reset your password: ${resetUrl}\n\nThis link will expire in 1 hour for security reasons.\n\nIf you didn't request a password reset, please ignore this email.\n\nBest regards,\nThe TaskSetu Team`
      };

      await sgMail.send(msg);
      console.log('Password reset email sent successfully to:', email);
      return true;
    } catch (error) {
      console.error('SendGrid email error:', error.response?.body || error.message);
      return false;
    }
  }

  async sendInvitationEmail(email, inviteToken, organizationName, roles, invitedByName) {
    if (!this.isConfigured) {
      console.log('SendGrid not configured. Invitation token for', email, ':', inviteToken);
      return false;
    }

    try {
      const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/accept-invitation?token=${inviteToken}`;
      
      const msg = {
        to: email,
        from: 'noreply@tasksetu.com',
        subject: `You're invited to join ${organizationName} - TaskSetu`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Team Invitation</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #10B981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
              .button { display: inline-block; background: #10B981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
              .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Team Invitation</h1>
              </div>
              <div class="content">
                <h2>You're invited to join ${organizationName}!</h2>
                <p><strong>${invitedByName}</strong> has invited you to join their team on TaskSetu.</p>
                
                <p>You'll be joining as: <strong>${Array.isArray(roles) ? roles.join(', ') : roles}</strong></p>
                
                <p>Click the button below to accept the invitation and create your account:</p>
                <a href="${inviteUrl}" class="button">Accept Invitation</a>
                
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #666;">${inviteUrl}</p>
                
                <p>This invitation will expire in 7 days.</p>
                
                <p>If you don't want to join this team, you can safely ignore this email.</p>
                
                <p>Welcome to TaskSetu!<br>The TaskSetu Team</p>
              </div>
              <div class="footer">
                <p>This is an automated message. Please do not reply to this email.</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `You're invited to join ${organizationName}!\n\n${invitedByName} has invited you to join their team on TaskSetu.\n\nYou'll be joining as: ${Array.isArray(roles) ? roles.join(', ') : roles}\n\nClick this link to accept the invitation: ${inviteUrl}\n\nThis invitation will expire in 7 days.\n\nWelcome to TaskSetu!\nThe TaskSetu Team`
      };

      await sgMail.send(msg);
      console.log('Invitation email sent successfully to:', email);
      return true;
    } catch (error) {
      console.error('SendGrid email error:', error.response?.body || error.message);
      return false;
    }
  }

  isEmailServiceAvailable() {
    return this.isConfigured;
  }
}

export const emailService = new EmailService();