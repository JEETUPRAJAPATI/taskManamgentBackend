import nodemailer from 'nodemailer';

async function testEmailDirect() {
  console.log('Testing Mailtrap email configuration...');
  
  // Check environment variables
  console.log('MAILTRAP_HOST:', process.env.MAILTRAP_HOST ? 'Set' : 'Missing');
  console.log('MAILTRAP_PORT:', process.env.MAILTRAP_PORT ? process.env.MAILTRAP_PORT : 'Missing');
  console.log('MAILTRAP_USERNAME:', process.env.MAILTRAP_USERNAME ? 'Set' : 'Missing');
  console.log('MAILTRAP_PASSWORD:', process.env.MAILTRAP_PASSWORD ? 'Set' : 'Missing');
  
  if (!process.env.MAILTRAP_HOST || !process.env.MAILTRAP_PORT || !process.env.MAILTRAP_USERNAME || !process.env.MAILTRAP_PASSWORD) {
    console.error('Missing Mailtrap credentials');
    return;
  }
  
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.MAILTRAP_HOST,
      port: parseInt(process.env.MAILTRAP_PORT),
      auth: {
        user: process.env.MAILTRAP_USERNAME,
        pass: process.env.MAILTRAP_PASSWORD
      },
      debug: true
    });
    
    console.log('Testing SMTP connection...');
    await transporter.verify();
    console.log('SMTP connection verified successfully');
    
    const resetToken = 'demo-token-' + Date.now();
    const resetUrl = `https://25b3cec7-b6b2-48b7-a8f4-7ee8a9c12574-00-36vzyej2u9kbm.kirk.replit.dev/reset-password?token=${resetToken}`;
    
    console.log('Sending test email...');
    const info = await transporter.sendMail({
      from: 'TaskSetu <noreply@tasksetu.com>',
      to: 'john.doe@techcorp.com',
      subject: 'Password Reset Test - TaskSetu',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333;">Password Reset Test</h1>
          <p>This is a test email to verify Mailtrap delivery.</p>
          <p><strong>Reset URL:</strong> <a href="${resetUrl}">${resetUrl}</a></p>
          <p>Timestamp: ${new Date().toISOString()}</p>
        </div>
      `,
      text: `Password Reset Test - TaskSetu\n\nReset URL: ${resetUrl}\nTimestamp: ${new Date().toISOString()}`
    });
    
    console.log('Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    
  } catch (error) {
    console.error('Email test failed:', error);
  }
}

testEmailDirect();