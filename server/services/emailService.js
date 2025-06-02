import Imap from 'imap';
import { simpleParser } from 'mailparser';
import { google } from 'googleapis';
import cron from 'node-cron';
import { storage } from '../mongodb-storage.js';

class EmailService {
  constructor() {
    this.imapConfig = null;
    this.gmail = null;
    this.isRunning = false;
  }

  // Initialize IMAP connection
  initializeIMAP(config) {
    this.imapConfig = {
      user: config.email,
      password: config.password,
      host: config.host || 'imap.gmail.com',
      port: config.port || 993,
      tls: true,
      authTimeout: 10000,
      connTimeout: 30000
    };
  }

  // Initialize Gmail API
  async initializeGmail(credentials) {
    try {
      const auth = new google.auth.OAuth2(
        credentials.clientId,
        credentials.clientSecret,
        credentials.redirectUri
      );
      
      auth.setCredentials({
        refresh_token: credentials.refreshToken
      });

      this.gmail = google.gmail({ version: 'v1', auth });
      return true;
    } catch (error) {
      console.error('Gmail initialization error:', error);
      return false;
    }
  }

  // Fetch emails using IMAP
  async fetchEmailsIMAP(organizationId, userId) {
    return new Promise((resolve, reject) => {
      if (!this.imapConfig) {
        return reject(new Error('IMAP not configured'));
      }

      const imap = new Imap(this.imapConfig);
      const emails = [];

      imap.once('ready', () => {
        imap.openBox('INBOX', true, (err, box) => {
          if (err) return reject(err);

          // Search for unread emails from the last 7 days
          const searchCriteria = ['UNSEEN', ['SINCE', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)]];
          
          imap.search(searchCriteria, (err, results) => {
            if (err || !results || results.length === 0) {
              imap.end();
              return resolve([]);
            }

            const fetch = imap.fetch(results.slice(0, 20), { // Limit to 20 emails
              bodies: '',
              markSeen: false
            });

            fetch.on('message', (msg) => {
              let buffer = '';
              
              msg.on('body', (stream) => {
                stream.on('data', (chunk) => {
                  buffer += chunk.toString('utf8');
                });
              });

              msg.once('end', async () => {
                try {
                  const parsed = await simpleParser(buffer);
                  const email = {
                    subject: parsed.subject,
                    from: parsed.from?.text || '',
                    date: parsed.date,
                    text: parsed.text,
                    html: parsed.html,
                    messageId: parsed.messageId
                  };
                  emails.push(email);
                } catch (parseError) {
                  console.error('Email parsing error:', parseError);
                }
              });
            });

            fetch.once('end', () => {
              imap.end();
              resolve(emails);
            });

            fetch.once('error', (err) => {
              console.error('Fetch error:', err);
              imap.end();
              reject(err);
            });
          });
        });
      });

      imap.once('error', (err) => {
        console.error('IMAP error:', err);
        reject(err);
      });

      imap.connect();
    });
  }

  // Fetch emails using Gmail API
  async fetchEmailsGmail(organizationId, userId) {
    try {
      if (!this.gmail) {
        throw new Error('Gmail API not configured');
      }

      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: 'is:unread newer_than:7d',
        maxResults: 20
      });

      const messages = response.data.messages || [];
      const emails = [];

      for (const message of messages) {
        try {
          const msgResponse = await this.gmail.users.messages.get({
            userId: 'me',
            id: message.id,
            format: 'full'
          });

          const headers = msgResponse.data.payload.headers;
          const subject = headers.find(h => h.name === 'Subject')?.value || '';
          const from = headers.find(h => h.name === 'From')?.value || '';
          const date = headers.find(h => h.name === 'Date')?.value || '';

          let body = '';
          if (msgResponse.data.payload.body.data) {
            body = Buffer.from(msgResponse.data.payload.body.data, 'base64').toString();
          } else if (msgResponse.data.payload.parts) {
            const textPart = msgResponse.data.payload.parts.find(part => 
              part.mimeType === 'text/plain'
            );
            if (textPart && textPart.body.data) {
              body = Buffer.from(textPart.body.data, 'base64').toString();
            }
          }

          emails.push({
            subject,
            from,
            date: new Date(date),
            text: body,
            messageId: message.id
          });
        } catch (msgError) {
          console.error('Error fetching message:', msgError);
        }
      }

      return emails;
    } catch (error) {
      console.error('Gmail fetch error:', error);
      throw error;
    }
  }

  // Convert email to task
  async emailToTask(email, organizationId, userId) {
    try {
      // Extract task information from email
      const taskData = this.parseEmailForTask(email);
      
      // Create task
      const task = await storage.createTask({
        title: taskData.title,
        description: taskData.description,
        priority: taskData.priority,
        dueDate: taskData.dueDate,
        organization: organizationId,
        createdBy: userId,
        assignedTo: userId,
        source: 'email',
        sourceMetadata: {
          emailSubject: email.subject,
          emailFrom: email.from,
          emailDate: email.date,
          messageId: email.messageId
        }
      });

      return task;
    } catch (error) {
      console.error('Error converting email to task:', error);
      throw error;
    }
  }

  // Parse email content to extract task information
  parseEmailForTask(email) {
    const subject = email.subject || '';
    const content = email.text || '';
    
    // Extract task title from subject
    let title = subject;
    
    // Remove common email prefixes
    title = title.replace(/^(RE:|FW:|FWD:)\s*/i, '');
    
    // Limit title length
    if (title.length > 100) {
      title = title.substring(0, 97) + '...';
    }

    // Extract description from email content
    let description = content;
    if (description.length > 500) {
      description = description.substring(0, 497) + '...';
    }

    // Extract priority based on keywords
    let priority = 'medium';
    const urgentKeywords = ['urgent', 'asap', 'emergency', 'critical', 'high priority'];
    const lowKeywords = ['fyi', 'low priority', 'when you have time'];
    
    const emailText = (subject + ' ' + content).toLowerCase();
    
    if (urgentKeywords.some(keyword => emailText.includes(keyword))) {
      priority = 'high';
    } else if (lowKeywords.some(keyword => emailText.includes(keyword))) {
      priority = 'low';
    }

    // Extract due date from content
    let dueDate = null;
    const dateRegex = /(?:due|deadline|by)\s*:?\s*(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}|\w+\s+\d{1,2},?\s+\d{4})/i;
    const dateMatch = emailText.match(dateRegex);
    
    if (dateMatch) {
      try {
        dueDate = new Date(dateMatch[1]);
        if (isNaN(dueDate.getTime())) {
          dueDate = null;
        }
      } catch (error) {
        dueDate = null;
      }
    }

    return {
      title,
      description: `Email from: ${email.from}\n\n${description}`,
      priority,
      dueDate
    };
  }

  // Manual email sync
  async syncEmails(organizationId, userId, method = 'gmail') {
    try {
      let emails = [];
      
      if (method === 'gmail' && this.gmail) {
        emails = await this.fetchEmailsGmail(organizationId, userId);
      } else if (method === 'imap' && this.imapConfig) {
        emails = await this.fetchEmailsIMAP(organizationId, userId);
      } else {
        throw new Error(`Email method ${method} not configured`);
      }

      const tasks = [];
      for (const email of emails) {
        try {
          const task = await this.emailToTask(email, organizationId, userId);
          tasks.push(task);
        } catch (error) {
          console.error('Error converting email to task:', error);
        }
      }

      return {
        emailsProcessed: emails.length,
        tasksCreated: tasks.length,
        tasks
      };
    } catch (error) {
      console.error('Manual email sync error:', error);
      throw error;
    }
  }
}

export default new EmailService();