import { MailService } from '@sendgrid/mail';

async function testSendGridDirectly() {
  console.log('Testing SendGrid API directly...');
  
  if (!process.env.SENDGRID_API_KEY) {
    console.error('SENDGRID_API_KEY not found');
    return;
  }
  
  const mailService = new MailService();
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
  
  const msg = {
    to: 'techizebuilder@gmail.com',
    from: 'techizebuilder@gmail.com',
    subject: 'Test Email from TaskSetu',
    text: 'This is a test email to verify SendGrid configuration.',
    html: '<p>This is a test email to verify SendGrid configuration.</p>'
  };
  
  try {
    const result = await mailService.send(msg);
    console.log('Email sent successfully!');
    console.log('SendGrid response:', result);
  } catch (error) {
    console.error('SendGrid error occurred:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    if (error.response && error.response.body && error.response.body.errors) {
      console.error('Detailed errors:');
      error.response.body.errors.forEach((err, index) => {
        console.error(`Error ${index + 1}:`, JSON.stringify(err, null, 2));
      });
    }
  }
}

testSendGridDirectly();