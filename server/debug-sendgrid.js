import { MailService } from '@sendgrid/mail';

const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY);

const testEmail = {
  to: 'test@example.com',
  from: 'techizebuilder@gmail.com',
  subject: 'Test Email',
  text: 'This is a test email'
};

try {
  await mailService.send(testEmail);
  console.log('Email sent successfully');
} catch (error) {
  console.error('SendGrid Error Details:');
  console.error('Status Code:', error.code);
  if (error.response && error.response.body) {
    console.error('Error Body:', JSON.stringify(error.response.body, null, 2));
  }
}