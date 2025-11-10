const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const dotenv = require('dotenv');
const multer = require('multer');
const axios = require('axios');
const crypto = require('crypto');

const marked = require('marked');
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

dotenv.config();

const app = express();
app.set('trust proxy', 1);

// Security Middleware
app.use(helmet());

const allowedOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map(origin => origin.trim())
  .filter(origin => origin.length > 0);

console.log('✅ Allowed CORS origins:', allowedOrigins);

app.use(cors({
  origin: function (origin, callback) {
    console.log('📍 Incoming request from origin:', origin);
    
    if (!origin) {
      console.log('✅ No origin - allowing request');
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      console.log('✅ Origin allowed');
      callback(null, true);
    } else {
      console.log('❌ CORS BLOCKED!');
      console.log('❌ Rejected origin:', origin);
      console.log('✅ Allowed origins:', allowedOrigins);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(mongoSanitize());
app.use(xss());


// Configure marked for safe HTML
marked.setOptions({
  breaks: true,
  gfm: true,
  headerIds: true,
  mangle: false
});

// Create DOMPurify instance
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

// Helper function to convert markdown to HTML
function markdownToHtml(markdown) {
  try {
    console.log('🔄 Converting markdown (length: ' + markdown.length + ')');
    
    const rawHtml = marked.parse(markdown);
    
    console.log('🔄 Sanitizing HTML (length: ' + rawHtml.length + ')');
    
    const cleanHtml = DOMPurify.sanitize(rawHtml, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
                     'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'code', 'pre', 'hr', 
                     'table', 'thead', 'tbody', 'tr', 'th', 'td', 'del', 'ins', 'sup', 'sub'],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class'],
      ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|ftp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i, // Block javascript:
      ADD_ATTR: ['target'], // Allow target for links
      FORBID_TAGS: ['style', 'script'],
      FORBID_ATTR: ['style', 'onerror', 'onload', 'onclick']
    });
    
    console.log('✅ Sanitization complete (length: ' + cleanHtml.length + ')');
    
    return cleanHtml;
  } catch (error) {
    console.error('❌ Markdown conversion error:', error);
    // Fallback: return escaped text
    return markdown.replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/"/g, '&quot;')
                  .replace(/'/g, '&#039;');
  }
}




// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  handler: (req, res) => {
    console.log('🚫 GENERAL RATE LIMIT HIT for IP:', req.ip);
    res.status(429).json({ error: 'Too many requests from this IP, please try again later.' });
  }
});
app.use('/api/', limiter);

const submissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Too many submissions, please try again later.',
  handler: (req, res) => {
    console.log('🚫 RATE LIMIT HIT for IP:', req.ip);
    res.status(429).json({ error: 'Too many submissions, please try again later.' });
  },
  skip: (req) => {
    console.log('📊 Rate limiter check for IP:', req.ip);
    return false;
  }
});

// Request logger middleware
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path} from IP: ${req.ip}`);
  next();
});

// Brevo Email Setup
let sendContactEmail, sendTestimonialNotification, sendDonationThankYou, sendExpenseNotification, sendCommentNotification;

if (process.env.BREVO_API_KEY) {
  try {
    const SibApiV3Sdk = require('@sendinblue/client');
    const brevoClient = new SibApiV3Sdk.TransactionalEmailsApi();
    brevoClient.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

    sendContactEmail = async (contactData) => {
      try {
        const emailData = {
          sender: {
            email: process.env.BREVO_SENDER_EMAIL,
            name: process.env.BREVO_SENDER_NAME || 'Kent Sevillejo Portfolio'
          },
          to: [{
            email: 'devchollo@gmail.com',
            name: 'Kent Sevillejo'
          }],
          replyTo: {
            email: contactData.email,
            name: contactData.name
          },
          subject: `Contact Form: Message from ${contactData.name}`,
          htmlContent: `
            <h2>New Contact Form Message</h2>
            <p><strong>From:</strong> ${contactData.name}</p>
            <p><strong>Email:</strong> <a href="mailto:${contactData.email}">${contactData.email}</a></p>
            <p><strong>Message:</strong></p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
              ${contactData.message.replace(/\n/g, '<br>')}
            </div>
            <hr>
            <p><small>Submitted at: ${new Date().toLocaleString()}</small></p>
          `
        };

        await brevoClient.sendTransacEmail(emailData);
        console.log('✅ Contact email sent via Brevo');
        return true;
      } catch (error) {
        console.error('❌ Brevo contact email error:', error.message);
        throw error;
      }
    };

    sendTestimonialNotification = async (testimonial) => {
      try {
        const emailData = {
          sender: {
            email: process.env.BREVO_SENDER_EMAIL,
            name: process.env.BREVO_SENDER_NAME || 'Kent Sevillejo Portfolio'
          },
          to: [{
            email: 'devchollo@gmail.com',
            name: 'Kent Sevillejo'
          }],
          subject: `New Testimonial Awaiting Approval - ${testimonial.rating} ⭐`,
          htmlContent: `
            <h2>New Testimonial Submission</h2>
            <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <p><strong>⏳ Status:</strong> Pending Your Approval</p>
            </div>
            <h3>Testimonial Details:</h3>
            <p><strong>Name:</strong> ${testimonial.name}</p>
            <p><strong>Email:</strong> ${testimonial.email}</p>
            <p><strong>Company:</strong> ${testimonial.company || 'Not provided'}</p>
            <p><strong>Role:</strong> ${testimonial.role || 'Not provided'}</p>
            <p><strong>Rating:</strong> ${'⭐'.repeat(testimonial.rating)} (${testimonial.rating}/5)</p>
            <h3>Review Message:</h3>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0; font-style: italic;">
              "${testimonial.message}"
            </div>
            <hr>
            <p style="margin-top: 20px;">
              <a href="https://www.ksevillejo.com/admin.html" 
                 style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Review in Admin Dashboard →
              </a>
            </p>
            <p><small>Submitted at: ${new Date(testimonial.createdAt).toLocaleString()}</small></p>
          `
        };

        await brevoClient.sendTransacEmail(emailData);
        console.log('✅ Testimonial notification sent via Brevo');
      } catch (error) {
        console.error('❌ Brevo testimonial email error:', error.message);
      }
    };

    sendDonationThankYou = async (donation, blogPost) => {
      try {
        const emailData = {
          sender: {
            email: process.env.BREVO_SENDER_EMAIL,
            name: process.env.BREVO_SENDER_NAME || 'Kent Sevillejo Portfolio'
          },
          to: [{
            email: donation.donorEmail,
            name: donation.donorName
          }],
          subject: `Thank You for Your Donation - ${blogPost.title}`,
          htmlContent: `
            <h2>Thank You for Your Generous Donation! 🙏</h2>
            <p>Dear ${donation.donorName},</p>
            <p>Your donation of <strong>${donation.currency} ${donation.amount.toLocaleString()}</strong> to <strong>${blogPost.title}</strong> has been received successfully.</p>
            
            ${donation.message ? `
              <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <p><strong>Your Message:</strong></p>
                <p style="font-style: italic;">"${donation.message}"</p>
              </div>
            ` : ''}
            
            <p>Your contribution will directly help those in need. We are committed to full transparency, and you can track how your donation is being used on our transparency page:</p>
            <p style="text-align: center; margin: 20px 0;">
              <a href="https://www.ksevillejo.com/transparency/${blogPost.slug}" 
                 style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                View Transparency Report →
              </a>
            </p>
            
            ${donation.notifyOnUpdates ? `
              <p style="background: #e7f3ff; padding: 10px; border-radius: 5px; font-size: 14px;">
                ✉️ You will receive email updates when we post new transparency reports showing how donations are being distributed.
              </p>
            ` : ''}
            
            <hr>
            <p style="color: #666; font-size: 12px;">
              Transaction ID: ${donation.paypalTransactionId || donation._id}<br>
              Date: ${new Date(donation.createdAt).toLocaleString()}<br>
              Campaign: ${blogPost.title}
            </p>
            <p style="margin-top: 20px;">With gratitude,<br><strong>Kent Sevillejo</strong></p>
          `
        };

        await brevoClient.sendTransacEmail(emailData);
        console.log('✅ Donation thank you email sent');
      } catch (error) {
        console.error('❌ Donation email error:', error.message);
      }
    };

    sendExpenseNotification = async (expense, blogPost, subscribers) => {
      if (!subscribers || subscribers.length === 0) {
        console.log('⚠️ No subscribers to notify');
        return { successful: 0, failed: 0 };
      }
      
      console.log(`📧 Sending expense notifications to ${subscribers.length} subscriber(s)...`);
      
      // Verify Brevo is properly initialized
      if (!brevoClient || !process.env.BREVO_SENDER_EMAIL) {
        console.error('❌ Brevo client not initialized or sender email missing');
        throw new Error('Email service not configured');
      }
      
      const results = {
        successful: 0,
        failed: 0,
        errors: []
      };
      
      // Send emails sequentially to avoid rate limits
      for (const subscriber of subscribers) {
        try {
          console.log(`📤 Sending to ${subscriber.donorEmail}...`);
          
          const emailData = {
            sender: {
              email: process.env.BREVO_SENDER_EMAIL,
              name: process.env.BREVO_SENDER_NAME || 'Kent Sevillejo Portfolio'
            },
            to: [{
              email: subscriber.donorEmail,
              name: subscriber.donorName
            }],
            subject: `New Transparency Update - ${blogPost.title}`,
            htmlContent: `
              <h2>New Transparency Report Posted 📋</h2>
              <p>Dear ${subscriber.donorName},</p>
              <p>A new expense report has been posted for <strong>${blogPost.title}</strong>, a campaign you supported.</p>
              
              <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <h3 style="margin-top: 0;">${expense.title}</h3>
                <p><strong>Amount:</strong> ${expense.currency} ${expense.amount.toLocaleString()}</p>
                <p><strong>Date:</strong> ${new Date(expense.date).toLocaleDateString()}</p>
                <p><strong>Description:</strong> ${expense.description}</p>
                ${expense.beneficiaries ? `<p><strong>Beneficiaries:</strong> ${expense.beneficiaries}</p>` : ''}
              </div>
              
              <p style="text-align: center; margin: 20px 0;">
                <a href="https://www.ksevillejo.com/transparency/${blogPost.slug}" 
                   style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  View Full Transparency Report →
                </a>
              </p>
              
              <p style="color: #666; font-size: 12px; margin-top: 30px;">
                You're receiving this because you opted to receive updates when you donated to this campaign.<br>
                Thank you for your continued support and trust in our transparency efforts.
              </p>
            `
          };

          // Send email and wait for response
          const response = await brevoClient.sendTransacEmail(emailData);
          
          console.log(`✅ Email sent to ${subscriber.donorEmail}`, {
            messageId: response.messageId,
            statusCode: response.response?.statusCode
          });
          
          results.successful++;
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (emailError) {
          console.error(`❌ Failed to send to ${subscriber.donorEmail}:`, {
            message: emailError?.message,
            statusCode: emailError?.response?.statusCode,
            body: emailError?.response?.body
          });
          
          results.failed++;
          results.errors.push({
            email: subscriber.donorEmail,
            error: emailError?.message || 'Unknown error',
            statusCode: emailError?.response?.statusCode
          });
        }
      }
      
      console.log(`✅ Notification batch complete: ${results.successful} sent, ${results.failed} failed`);
      
      if (results.failed > 0) {
        console.error('❌ Failed emails:', results.errors);
      }
      
      return results;
    };

    sendCommentNotification = async (newComment, blogPost, subscribers) => {
      if (!subscribers || subscribers.length === 0) {
        console.log('⚠️ No subscribers to notify about comment');
        return { successful: 0, failed: 0 };
      }
      
      console.log(`📧 Sending comment notifications to ${subscribers.length} subscriber(s)...`);
      
      if (!brevoClient || !process.env.BREVO_SENDER_EMAIL) {
        console.error('❌ Brevo client not initialized or sender email missing');
        throw new Error('Email service not configured');
      }
      
      const results = {
        successful: 0,
        failed: 0,
        errors: []
      };
      
      // Send emails sequentially to avoid rate limits
      for (const subscriber of subscribers) {
        // Don't notify the person who just commented
        if (subscriber.commenterEmail.toLowerCase() === newComment.commenterEmail.toLowerCase()) {
          console.log(`⏭️ Skipping notification to commenter: ${subscriber.commenterEmail}`);
          continue;
        }
        
        try {
          console.log(`📤 Sending to ${subscriber.commenterEmail}...`);
          
          const pageType = newComment.commentType === 'transparency' ? 'transparency page' : 'blog post';
          const pageUrl = newComment.commentType === 'transparency' 
            ? `https://www.ksevillejo.com/transparency/${blogPost.slug}`
            : `https://www.ksevillejo.com/blog/${blogPost.slug}`;
          
          const emailData = {
            sender: {
              email: process.env.BREVO_SENDER_EMAIL,
              name: process.env.BREVO_SENDER_NAME || 'Kent Sevillejo Portfolio'
            },
            to: [{
              email: subscriber.commenterEmail,
              name: subscriber.commenterName
            }],
            subject: `New comment on: ${blogPost.title}`,
            htmlContent: `
              <h2>New Comment Posted 💬</h2>
              <p>Hi ${subscriber.commenterName},</p>
              <p>Someone just commented on the ${pageType} you're following: <strong>${blogPost.title}</strong></p>
              
              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                <p style="margin: 0 0 10px 0;"><strong>${newComment.commenterName}</strong> <span style="color: #666; font-size: 12px;">${new Date(newComment.createdAt).toLocaleString()}</span></p>
                <p style="margin: 0; white-space: pre-wrap;">${newComment.commentText}</p>
              </div>
              
              <p style="text-align: center; margin: 30px 0;">
                <a href="${pageUrl}#comments" 
                   style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                  View Comment & Reply →
                </a>
              </p>
              
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
              
              <p style="color: #666; font-size: 12px;">
                You're receiving this because you opted to receive notifications for new comments on this ${pageType}.<br>
                This is an automated notification from Kent Sevillejo Portfolio.
              </p>
            `
          };

          const response = await brevoClient.sendTransacEmail(emailData);
          
          console.log(`✅ Email sent to ${subscriber.commenterEmail}`, {
            messageId: response.messageId
          });
          
          results.successful++;
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (emailError) {
          console.error(`❌ Failed to send to ${subscriber.commenterEmail}:`, {
            message: emailError?.message,
            statusCode: emailError?.response?.statusCode
          });
          
          results.failed++;
          results.errors.push({
            email: subscriber.commenterEmail,
            error: emailError?.message || 'Unknown error'
          });
        }
      }
      
      console.log(`✅ Comment notification batch complete: ${results.successful} sent, ${results.failed} failed`);
      
      if (results.failed > 0) {
        console.error('❌ Failed emails:', results.errors);
      }
      
      return results;
    };

    console.log('✅ Brevo email service initialized');
    console.log('✅ Comment notification function initialized');
  } catch (error) {
    console.error('❌ Failed to initialize Brevo:', error.message);
    sendContactEmail = null;
    sendTestimonialNotification = null;
    sendDonationThankYou = null;
    sendExpenseNotification = null;
    sendCommentNotification = null;
  }
} else {
  console.log('⚠️  BREVO_API_KEY not set - email notifications disabled');
}

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => console.error('❌ MongoDB Connection Error:', err));

// ============================================
// B2 FILE UPLOAD SETUP
// ============================================

// Multer configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// B2 Uploader Class
class B2Uploader {
  constructor() {
    this.authToken = null;
    this.uploadUrl = null;
    this.uploadAuthToken = null;
    this.apiUrl = null;
    this.downloadUrl = null;
    this.bucketId = process.env.B2_BUCKET_ID;
    this.applicationKeyId = process.env.B2_APPLICATION_KEY_ID;
    this.applicationKey = process.env.B2_APPLICATION_KEY;
  }

  async authenticate() {
    try {
      const authString = Buffer.from(
        `${this.applicationKeyId}:${this.applicationKey}`
      ).toString('base64');

      const response = await axios.get(
        'https://api.backblazeb2.com/b2api/v2/b2_authorize_account',
        {
          headers: {
            Authorization: `Basic ${authString}`
          }
        }
      );

      this.authToken = response.data.authorizationToken;
      this.apiUrl = response.data.apiUrl;
      this.downloadUrl = response.data.downloadUrl;

      console.log('✅ B2 authenticated successfully');
      return true;
    } catch (error) {
      console.error('❌ B2 authentication failed:', error.message);
      return false;
    }
  }

  async getUploadUrl() {
    try {
      if (!this.authToken) {
        await this.authenticate();
      }

      const response = await axios.post(
        `${this.apiUrl}/b2api/v2/b2_get_upload_url`,
        {
          bucketId: this.bucketId
        },
        {
          headers: {
            Authorization: this.authToken
          }
        }
      );

      this.uploadUrl = response.data.uploadUrl;
      this.uploadAuthToken = response.data.authorizationToken;

      return true;
    } catch (error) {
      console.error('❌ Failed to get upload URL:', error.message);
      await this.authenticate();
      return this.getUploadUrl();
    }
  }

  async uploadFile(fileBuffer, fileName, mimeType) {
    try {
      if (!this.uploadUrl || !this.uploadAuthToken) {
        await this.getUploadUrl();
      }

      const timestamp = Date.now();
      const hash = crypto.randomBytes(8).toString('hex');
      const extension = fileName.split('.').pop();
      const uniqueFileName = `receipts/${timestamp}_${hash}.${extension}`;

      const sha1Hash = crypto
        .createHash('sha1')
        .update(fileBuffer)
        .digest('hex');

      const response = await axios.post(
        this.uploadUrl,
        fileBuffer,
        {
          headers: {
            Authorization: this.uploadAuthToken,
            'X-Bz-File-Name': encodeURIComponent(uniqueFileName),
            'Content-Type': mimeType,
            'Content-Length': fileBuffer.length,
            'X-Bz-Content-Sha1': sha1Hash,
            'X-Bz-Info-Author': 'portfolio-admin'
          }
        }
      );

      const publicUrl = `https://f005.backblazeb2.com/file/KSevillejo/${uniqueFileName}`;

      console.log('✅ File uploaded successfully:', publicUrl);

      return {
        success: true,
        url: publicUrl,
        fileName: response.data.fileName,
        fileId: response.data.fileId
      };
    } catch (error) {
      console.error('❌ Upload failed:', error.message);
      
      if (error.response && error.response.status === 401) {
        await this.getUploadUrl();
        return this.uploadFile(fileBuffer, fileName, mimeType);
      }

      return {
        success: false,
        error: error.message
      };
    }
  }
}

const b2Uploader = new B2Uploader();

// Schemas
const TestimonialSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  company: { type: String, trim: true, default: '' },
  role: { type: String, trim: true, default: '' },
  message: { type: String, required: true, trim: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  image: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  approvedAt: { type: Date }
});

const ContactSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  message: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['new', 'read', 'archived'], default: 'new' }
});

const BlogPostSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, trim: true },
  content: { type: String, required: true }, 
  markdownSource: { type: String, default: '' }, 
  excerpt: { type: String, required: true, trim: true },
  featuredImage: { type: String, default: '' },
  category: { type: String, enum: ['donation-drive', 'blog', 'update'], default: 'blog' },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  isDonationDrive: { type: Boolean, default: false },
  donationGoal: { type: Number, default: 0 },
  donationCurrency: { type: String, default: 'PHP' },
  paypalEmail: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  publishedAt: { type: Date }
});

const DonationSchema = new mongoose.Schema({
  blogPostId: { type: mongoose.Schema.Types.ObjectId, ref: 'BlogPost', required: true },
  donorName: { type: String, default: 'Anonymous' },
  donorEmail: { type: String, required: true, trim: true, lowercase: true },
  amount: { type: Number, required: true, min: 1 },
  currency: { type: String, default: 'PHP' },
  paymentMethod: { 
    type: String, 
    enum: ['paypal', 'gcash', 'cash', 'bank-transfer', 'other'], 
    default: 'paypal' 
  },
  paypalTransactionId: { type: String, default: '' },
  paypalOrderId: { type: String, default: '' },
  gcashReferenceNumber: { type: String, default: '' },
  manuallyAdded: { type: Boolean, default: false },
  verificationStatus: { 
    type: String, 
    enum: ['pending', 'verified', 'rejected'], 
    default: 'pending' 
  },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  message: { type: String, default: '' },
  isAnonymous: { type: Boolean, default: false },
  notifyOnUpdates: { type: Boolean, default: false },
  notes: { type: String, default: '' }, // Admin notes
  createdAt: { type: Date, default: Date.now }
});


const ExpenseSchema = new mongoose.Schema({
  blogPostId: { type: mongoose.Schema.Types.ObjectId, ref: 'BlogPost', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 1 },
  currency: { type: String, default: 'PHP' },
  date: { type: Date, required: true },
  receipts: [{ type: String }],
  beneficiaries: { type: String, default: '' },
  category: { type: String, default: 'relief-goods' },
  status: { type: String, enum: ['pending', 'approved'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  approvedAt: { type: Date }
});


const CommentSchema = new mongoose.Schema({
  blogPostId: { type: mongoose.Schema.Types.ObjectId, ref: 'BlogPost', required: true },
  commentType: { type: String, enum: ['blog', 'transparency'], required: true },
  commenterName: { type: String, required: true, default: 'Anonymous' },
  commenterEmail: { type: String, trim: true, lowercase: true, default: '' },
  commenterImage: { type: String, default: '' },
  commentText: { type: String, required: true, trim: true, maxlength: 1000 },
  notifyOnReplies: { type: Boolean, default: false },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});




const Testimonial = mongoose.model('Testimonial', TestimonialSchema);
const Contact = mongoose.model('Contact', ContactSchema);
const BlogPost = mongoose.model('BlogPost', BlogPostSchema);
const Donation = mongoose.model('Donation', DonationSchema);
const Expense = mongoose.model('Expense', ExpenseSchema);
const Comment = mongoose.model('Comment', CommentSchema);


// Admin Authentication Middleware
const authenticateAdmin = (req, res, next) => {
  const adminKey = req.headers['x-admin-key'];
  if (adminKey === process.env.ADMIN_SECRET_KEY) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// Helper function to convert slug to ObjectId
async function getBlogPostId(blogPostIdOrSlug) {
  if (mongoose.Types.ObjectId.isValid(blogPostIdOrSlug) && blogPostIdOrSlug.length === 24) {
    return blogPostIdOrSlug;
  }
  const blogPost = await BlogPost.findOne({ slug: blogPostIdOrSlug });
  if (!blogPost) {
    throw new Error('Blog post not found');
  }
  return blogPost._id;
}

// ============================================
// PUBLIC ROUTES
// ============================================

// ============================================
// SITEMAP ROUTE
// ============================================

app.get('/sitemap.xml', async (req, res) => {
  try {
    console.log('📄 Generating sitemap.xml...');
    
    const posts = await BlogPost.find({ status: 'published' })
      .select('slug updatedAt isDonationDrive')
      .sort({ updatedAt: -1 });

    const currentDate = new Date().toISOString();
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
  
  <!-- Homepage -->
  <url>
    <loc>https://www.ksevillejo.com/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  
  <!-- Blog Index -->
  <url>
    <loc>https://www.ksevillejo.com/blog</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`;

    // Add all published blog posts
    posts.forEach(post => {
      const lastmod = post.updatedAt ? post.updatedAt.toISOString() : currentDate;
      
      xml += `
  
  <!-- Blog Post: ${post.slug} -->
  <url>
    <loc>https://www.ksevillejo.com/blog/${post.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
      
      // Add transparency page for donation drives
      if (post.isDonationDrive) {
        xml += `
  
  <!-- Transparency Page: ${post.slug} -->
  <url>
    <loc>https://www.ksevillejo.com/transparency/${post.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
      }
    });

    xml += `
  
</urlset>`;
    
    res.header('Content-Type', 'application/xml');
    res.header('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    res.send(xml);
    
    console.log(`✅ Sitemap generated with ${posts.length} posts`);
  } catch (error) {
    console.error('❌ Sitemap generation error:', error);
    res.status(500).send('Error generating sitemap');
  }
});

// ============================================
// ROBOTS.TXT ROUTE (Dynamic)
// ============================================

app.get('/robots.txt', (req, res) => {
  const robotsTxt = `# robots.txt for www.ksevillejo.com
User-agent: *
Allow: /
Disallow: /admin.html
Disallow: /api/admin/

Sitemap: https://www.ksevillejo.com/sitemap.xml

User-agent: Googlebot-Image
Allow: /

User-agent: Google-Extended
Allow: /blog/
Allow: /transparency/
Disallow: /admin

User-agent: anthropic-ai
Allow: /

User-agent: ChatGPT-User
Allow: /blog/
Allow: /transparency/

User-agent: AhrefsBot
Crawl-delay: 10

User-agent: SemrushBot
Crawl-delay: 10
`;

  res.header('Content-Type', 'text/plain');
  res.send(robotsTxt);
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Contact Form Submission
app.post('/api/contact', submissionLimiter, async (req, res) => {
  console.log('📧 Contact form received:', { name: req.body.name, email: req.body.email });
  
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (message.length > 5000) {
      return res.status(400).json({ error: 'Message is too long' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (!sendContactEmail) {
      return res.status(500).json({ 
        error: 'Email service not configured. Please contact the administrator.' 
      });
    }

    await sendContactEmail({ name, email, message });

    res.status(200).json({ 
      message: 'Message sent successfully! I will get back to you soon.',
      success: true 
    });
  } catch (error) {
    console.error('❌ Contact form error:', error);
    res.status(500).json({ error: 'Failed to send message. Please try again later.' });
  }
});

// Testimonials
app.post('/api/testimonials', submissionLimiter, async (req, res) => {
  console.log('⭐ Testimonial received:', { name: req.body.name, rating: req.body.rating });
  
  try {
    const { name, email, company, role, message, rating } = req.body;

    if (!name || !email || !message || !rating) {
      return res.status(400).json({ error: 'Required fields are missing' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const testimonial = new Testimonial({
      name,
      email,
      company: company || '',
      role: role || '',
      message,
      rating,
      status: 'pending'
    });

    await testimonial.save();

    if (sendTestimonialNotification) {
      sendTestimonialNotification(testimonial).catch(err => 
        console.error('Failed to send notification email:', err.message)
      );
    }

    res.status(201).json({ 
      message: 'Thank you for your testimonial! It will be reviewed and published soon.',
      success: true 
    });
  } catch (error) {
    console.error('❌ Testimonial submission error:', error);
    res.status(500).json({ error: 'Failed to submit testimonial' });
  }
});

app.get('/api/testimonials', async (req, res) => {
  try {
    const testimonials = await Testimonial.find({ status: 'approved' })
      .select('-email -__v')
      .sort({ approvedAt: -1 })
      .limit(50);

    res.json({ testimonials, success: true });
  } catch (error) {
    console.error('Fetch testimonials error:', error);
    res.status(500).json({ error: 'Failed to fetch testimonials' });
  }
});

app.get('/api/testimonials/stats', async (req, res) => {
  try {
    const approved = await Testimonial.find({ status: 'approved' });
    
    const totalCount = approved.length;
    const avgRating = totalCount > 0
      ? (approved.reduce((sum, t) => sum + t.rating, 0) / totalCount).toFixed(1)
      : 5.0;

    res.json({ 
      avgRating: parseFloat(avgRating),
      totalCount,
      success: true 
    });
  } catch (error) {
    console.error('Fetch stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Blog Posts
app.get('/api/admin/blog/posts', authenticateAdmin, async (req, res) => {
  try {
    const { status, limit = 100 } = req.query;
    
    const query = status ? { status } : {};
    const posts = await BlogPost.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    // Return posts with markdown source for editing
    const postsWithMarkdown = posts.map(post => {
      const postObj = post.toObject();
      
      // CRITICAL FIX: Always provide markdown source
      // If markdownSource doesn't exist, use content as fallback
      postObj.editContent = postObj.markdownSource || postObj.content;
      
      // Add a flag to indicate if this is HTML or markdown
      postObj.isHtmlContent = !postObj.markdownSource || postObj.markdownSource === '';
      
      return postObj;
    });

    res.json({ posts: postsWithMarkdown, success: true });
  } catch (error) {
    console.error('Fetch blog posts error:', error);
    res.status(500).json({ error: 'Failed to fetch blog posts' });
  }
});


app.get('/api/blog/posts', async (req, res) => {
  try {
    const { category, limit = 50 } = req.query;
    
    // Build query - only published posts
    const query = { status: 'published' };
    if (category) {
      query.category = category;
    }

    const posts = await BlogPost.find(query)
      .select('-markdownSource -__v') // Don't send markdown source to public
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(parseInt(limit));

    console.log(`✅ Returning ${posts.length} published blog posts`);

    res.json({ 
      posts, 
      count: posts.length,
      success: true 
    });
  } catch (error) {
    console.error('Fetch blog posts error:', error);
    res.status(500).json({ error: 'Failed to fetch blog posts' });
  }
});

app.get('/api/blog/posts/:slug', async (req, res) => {
  try {
    const post = await BlogPost.findOne({ 
      slug: req.params.slug, 
      status: 'published' 
    });

    if (!post) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    // ✅ Add SEO-friendly headers
    res.setHeader('Last-Modified', post.updatedAt.toUTCString());
    res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour cache
    res.setHeader('ETag', `"${post._id}-${post.updatedAt.getTime()}"`);
    
    // Support conditional requests
    const ifModifiedSince = req.headers['if-modified-since'];
    if (ifModifiedSince) {
      const modifiedSince = new Date(ifModifiedSince);
      if (post.updatedAt <= modifiedSince) {
        return res.status(304).end(); // Not Modified
      }
    }

    // Get donation stats if it's a donation drive
    let donationStats = null;
    if (post.isDonationDrive) {
      const donations = await Donation.find({ 
        blogPostId: post._id, 
        status: 'completed' 
      });
      
      const expenses = await Expense.find({ 
        blogPostId: post._id,
        status: 'approved'
      });

      const totalDonations = donations.reduce((sum, d) => sum + d.amount, 0);
      const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

      donationStats = {
        totalDonations,
        totalExpenses,
        remainingBalance: totalDonations - totalExpenses,
        donorCount: donations.length,
        goal: post.donationGoal,
        percentComplete: post.donationGoal > 0 
          ? Math.min(100, (totalDonations / post.donationGoal) * 100).toFixed(1)
          : 0
      };
    }

    res.json({ post, donationStats, success: true });
  } catch (error) {
    console.error('Fetch blog post error:', error);
    res.status(500).json({ error: 'Failed to fetch blog post' });
  }
});

// Donations
app.post('/api/donations', async (req, res) => {
  try {
    console.log('💰 Donation received - Full request body:', JSON.stringify(req.body, null, 2));
    
    const { 
      blogPostSlug, 
      donorName, 
      donorEmail, 
      amount, 
      message, 
      isAnonymous, 
      notifyOnUpdates,
      paypalOrderId,
      paypalTransactionId
    } = req.body;

    // Log individual fields
    console.log('📧 Donor Email:', donorEmail);
    console.log('👤 Donor Name:', donorName);
    console.log('💵 Amount:', amount);

    if (!blogPostSlug || !donorEmail || !amount) {
      console.error('❌ Missing required fields:', { blogPostSlug: !!blogPostSlug, donorEmail: !!donorEmail, amount: !!amount });
      return res.status(400).json({ error: 'Required fields are missing' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(donorEmail)) {
      console.error('❌ Invalid email format:', donorEmail);
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const blogPost = await BlogPost.findOne({ slug: blogPostSlug });
    if (!blogPost) {
      return res.status(404).json({ error: 'Donation drive not found' });
    }

    if (!blogPost.isDonationDrive) {
      return res.status(400).json({ error: 'This blog post is not accepting donations' });
    }

    const donationData = {
      blogPostId: blogPost._id,
      donorName: isAnonymous ? 'Anonymous' : (donorName || 'Anonymous'),
      donorEmail: donorEmail, // Make sure we're using the full email
      amount: parseFloat(amount),
      currency: blogPost.donationCurrency,
      paypalOrderId: paypalOrderId || '',
      paypalTransactionId: paypalTransactionId || '',
      status: 'completed',
      message: message || '',
      isAnonymous: isAnonymous || false,
      notifyOnUpdates: notifyOnUpdates || false
    };

    console.log('💾 About to save donation with data:', JSON.stringify(donationData, null, 2));

    const donation = new Donation(donationData);
    await donation.save();

    console.log('✅ Donation saved successfully:', donation._id);
    console.log('📧 Saved email:', donation.donorEmail);
    console.log('🔔 Notify on updates:', donation.notifyOnUpdates);

    // Send thank you email
    if (sendDonationThankYou) {
      sendDonationThankYou(donation, blogPost).catch(err => 
        console.error('Failed to send thank you email:', err.message)
      );
    }

    res.status(201).json({ 
      message: 'Thank you for your donation!',
      donation: {
        id: donation._id,
        amount: donation.amount,
        currency: donation.currency,
        email: donation.donorEmail // Return this to verify
      },
      success: true 
    });
  } catch (error) {
    console.error('❌ Donation submission error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to process donation' });
  }
});


app.post('/api/admin/donations/manual', authenticateAdmin, async (req, res) => {
  try {
    const {
      blogPostId,
      donorName,
      donorEmail,
      amount,
      currency,
      paymentMethod,
      gcashReferenceNumber,
      message,
      isAnonymous,
      notes
    } = req.body;

    console.log('📝 Manual donation entry:', { donorName, amount, paymentMethod });

    if (!blogPostId || !amount || !donorEmail) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(donorEmail)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const blogPost = await BlogPost.findById(blogPostId);
    if (!blogPost) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    const donation = new Donation({
      blogPostId,
      donorName: isAnonymous ? 'Anonymous' : (donorName || 'Anonymous'),
      donorEmail,
      amount: parseFloat(amount),
      currency: currency || blogPost.donationCurrency || 'PHP',
      paymentMethod: paymentMethod || 'cash',
      gcashReferenceNumber: gcashReferenceNumber || '',
      manuallyAdded: true,
      verificationStatus: 'verified', // Auto-verify manual entries
      status: 'completed',
      message: message || '',
      isAnonymous: isAnonymous || false,
      notifyOnUpdates: false, // Don't notify for manual entries
      notes: notes || 'Manually added by admin'
    });

    await donation.save();
    console.log('✅ Manual donation saved:', donation._id);

    res.status(201).json({
      message: 'Donation added successfully',
      donation,
      success: true
    });
  } catch (error) {
    console.error('❌ Manual donation error:', error);
    res.status(500).json({ error: 'Failed to add donation' });
  }
});


app.post('/api/donations/gcash', async (req, res) => {
  try {
    const {
      blogPostSlug,
      donorName,
      donorEmail,
      amount,
      gcashReferenceNumber,
      message,
      isAnonymous,
      notifyOnUpdates
    } = req.body;

    console.log('💳 GCash donation submitted:', { donorName, amount, gcashReferenceNumber });

    if (!blogPostSlug || !donorEmail || !amount || !gcashReferenceNumber) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(donorEmail)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const blogPost = await BlogPost.findOne({ slug: blogPostSlug });
    if (!blogPost || !blogPost.isDonationDrive) {
      return res.status(404).json({ error: 'Donation drive not found' });
    }

    const donation = new Donation({
      blogPostId: blogPost._id,
      donorName: isAnonymous ? 'Anonymous' : (donorName || 'Anonymous'),
      donorEmail,
      amount: parseFloat(amount),
      currency: blogPost.donationCurrency,
      paymentMethod: 'gcash',
      gcashReferenceNumber,
      manuallyAdded: false,
      verificationStatus: 'pending',
      status: 'pending', // Pending until admin verifies
      message: message || '',
      isAnonymous: isAnonymous || false,
      notifyOnUpdates: notifyOnUpdates || false
    });

    await donation.save();
    console.log('✅ GCash donation submitted for verification:', donation._id);

    res.status(201).json({
      message: 'GCash donation submitted! It will be verified and processed within 24 hours.',
      donation: {
        id: donation._id,
        amount: donation.amount,
        currency: donation.currency,
        referenceNumber: donation.gcashReferenceNumber
      },
      success: true
    });
  } catch (error) {
    console.error('❌ GCash donation error:', error);
    res.status(500).json({ error: 'Failed to submit donation' });
  }
});

app.patch('/api/admin/donations/:id/verify', authenticateAdmin, async (req, res) => {
  try {
    const { verificationStatus, notes } = req.body;

    if (!['verified', 'rejected'].includes(verificationStatus)) {
      return res.status(400).json({ error: 'Invalid verification status' });
    }

    const donation = await Donation.findById(req.params.id).populate('blogPostId');
    if (!donation) {
      return res.status(404).json({ error: 'Donation not found' });
    }

    donation.verificationStatus = verificationStatus;
    donation.status = verificationStatus === 'verified' ? 'completed' : 'failed';
    if (notes) donation.notes = notes;

    await donation.save();

    // Send email if verified
    if (verificationStatus === 'verified' && sendDonationThankYou) {
      sendDonationThankYou(donation, donation.blogPostId).catch(err =>
        console.error('Failed to send thank you email:', err)
      );
    }

    res.json({ donation, success: true });
  } catch (error) {
    console.error('❌ Verify donation error:', error);
    res.status(500).json({ error: 'Failed to verify donation' });
  }
});

// Transparency - Get expenses for a blog post
app.get('/api/transparency/:slug', async (req, res) => {
  try {
    const blogPost = await BlogPost.findOne({ slug: req.params.slug });
    if (!blogPost) {
      return res.status(404).json({ error: 'Donation drive not found' });
    }

    const donations = await Donation.find({ 
      blogPostId: blogPost._id, 
      status: 'completed' 
    }).select('-donorEmail -paypalTransactionId -paypalOrderId');

    const expenses = await Expense.find({ 
      blogPostId: blogPost._id,
      status: 'approved'
    }).sort({ date: -1 });

    const totalDonations = donations.reduce((sum, d) => sum + d.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    res.json({
      blogPost: {
        title: blogPost.title,
        slug: blogPost.slug,
        donationGoal: blogPost.donationGoal,
        currency: blogPost.donationCurrency
      },
      donations: donations.map(d => ({
        donorName: d.isAnonymous ? 'Anonymous' : d.donorName,
        amount: d.amount,
        message: d.message,
        date: d.createdAt
      })),
      expenses,
      summary: {
        totalDonations,
        totalExpenses,
        remainingBalance: totalDonations - totalExpenses,
        donorCount: donations.length,
        expenseCount: expenses.length
      },
      success: true
    });
  } catch (error) {
    console.error('Fetch transparency data error:', error);
    res.status(500).json({ error: 'Failed to fetch transparency data' });
  }
});

// ============================================
// UPLOAD ROUTES (ADMIN ONLY)
// ============================================

// Upload single receipt
app.post('/api/admin/upload-receipt', authenticateAdmin, upload.single('receipt'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!process.env.B2_BUCKET_ID || !process.env.B2_APPLICATION_KEY_ID || !process.env.B2_APPLICATION_KEY) {
      return res.status(500).json({ 
        error: 'Backblaze B2 not configured. Please set B2_BUCKET_ID, B2_APPLICATION_KEY_ID, and B2_APPLICATION_KEY.' 
      });
    }

    console.log('📤 Uploading file:', req.file.originalname, `(${req.file.size} bytes)`);

    const result = await b2Uploader.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    if (result.success) {
      res.json({
        success: true,
        url: result.url,
        message: 'File uploaded successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Upload multiple receipts
app.post('/api/admin/upload-receipts', authenticateAdmin, upload.array('receipts', 10), async (req, res) => {
  try {
    console.log('🧩 Incoming upload request...');
    console.log('Files:', req.files?.length);
    console.log('Env:', {
      B2_BUCKET_ID: !!process.env.B2_BUCKET_ID,
      B2_APPLICATION_KEY_ID: !!process.env.B2_APPLICATION_KEY_ID,
      B2_APPLICATION_KEY: !!process.env.B2_APPLICATION_KEY
    });
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    if (!process.env.B2_BUCKET_ID || !process.env.B2_APPLICATION_KEY_ID || !process.env.B2_APPLICATION_KEY) {
      return res.status(500).json({ 
        error: 'Backblaze B2 not configured.' 
      });
    }

    console.log(`📤 Uploading ${req.files.length} files...`);

    const uploadPromises = req.files.map(file => 
      b2Uploader.uploadFile(file.buffer, file.originalname, file.mimetype)
    );

    const results = await Promise.all(uploadPromises);

    const successfulUploads = results.filter(r => r.success);
    const failedUploads = results.filter(r => !r.success);

    if (failedUploads.length > 0) {
      console.warn(`⚠️  ${failedUploads.length} uploads failed`);
    }

    res.json({
      success: true,
      urls: successfulUploads.map(r => r.url),
      totalUploaded: successfulUploads.length,
      totalFailed: failedUploads.length,
      message: `${successfulUploads.length} file(s) uploaded successfully`
    });
  } catch (error) {
    console.error('Multiple upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});


// Verify if user is a donor for a specific campaign
app.post('/api/transparency/verify-donor', async (req, res) => {
  try {
    const { email, blogPostSlug } = req.body;

    if (!email || !blogPostSlug) {
      return res.status(400).json({ error: 'Email and blog post slug required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const blogPost = await BlogPost.findOne({ slug: blogPostSlug });
    if (!blogPost) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    const donation = await Donation.findOne({
      blogPostId: blogPost._id,
      donorEmail: email.toLowerCase(),
      status: 'completed'
    });

    res.json({
      isDonor: !!donation,
      success: true
    });
  } catch (error) {
    console.error('Donor verification error:', error);
    res.status(500).json({ error: 'Failed to verify donor status' });
  }
});

// ============================================
// PUBLIC COMMENT ROUTES (FIXED)
// ============================================

// Check if commenter exists for a specific post/type (FIXED)
app.post('/api/comments/check-commenter', async (req, res) => {
  try {
    const { email, blogPostId, commentType } = req.body;

    if (!email || !blogPostId || !commentType) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // ✅ FIX: Convert slug to ObjectId
    const realBlogPostId = await getBlogPostId(blogPostId);

    const existingComment = await Comment.findOne({
      commenterEmail: email.toLowerCase(),
      blogPostId: realBlogPostId,
      commentType
    });

    res.json({
      exists: !!existingComment,
      commenterData: existingComment ? {
        name: existingComment.commenterName,
        image: existingComment.commenterImage,
        notifyOnReplies: existingComment.notifyOnReplies
      } : null,
      success: true
    });
  } catch (error) {
    console.error('Check commenter error:', error);
    res.status(500).json({ error: 'Failed to check commenter' });
  }
});

// Register new commenter (one-time setup)
app.post('/api/comments/register', async (req, res) => {
  try {
    const { name, email, image, notifyOnReplies, blogPostId, commentType } = req.body;

    if (!blogPostId || !commentType) {
      return res.status(400).json({ error: 'Blog post ID and comment type required' });
    }

    // Convert slug to ObjectId if needed
    const realBlogPostId = await getBlogPostId(blogPostId);

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }

      // Check if already registered for this post/type
      const existing = await Comment.findOne({
        commenterEmail: email.toLowerCase(),
        blogPostId: realBlogPostId,
        commentType
      });

      if (existing) {
        return res.status(400).json({ 
          error: 'Email already registered for this thread',
          exists: true
        });
      }
    }

    res.json({
      message: 'Commenter validated',
      commenterData: {
        name: name || 'Anonymous',
        email: email ? email.toLowerCase() : '',
        image: image || '',
        notifyOnReplies: notifyOnReplies || false
      },
      success: true
    });
  } catch (error) {
    console.error('Register commenter error:', error);
    res.status(500).json({ error: 'Failed to register commenter' });
  }
});

// Get comments for a blog post (public or transparency) (FIXED)
app.get('/api/comments/:blogPostId/:commentType', async (req, res) => {
  try {
    const { blogPostId, commentType } = req.params;
    const { userEmail } = req.query;

    if (!['blog', 'transparency'].includes(commentType)) {
      return res.status(400).json({ error: 'Invalid comment type' });
    }

    // ✅ FIX: Convert slug to ObjectId if needed
    const realBlogPostId = await getBlogPostId(blogPostId);

    const comments = await Comment.find({
      blogPostId: realBlogPostId,
      commentType,
      status: 'approved'
    })
    .select('-__v')
    .sort({ createdAt: -1 })
    .limit(100);

    // For transparency pages, check if user is a donor
    let canViewComments = true;
    let canComment = true;

    if (commentType === 'transparency') {
      if (!userEmail) {
        canViewComments = false;
        canComment = false;
      } else {
        const donation = await Donation.findOne({
          blogPostId: realBlogPostId,
          donorEmail: userEmail.toLowerCase(),
          status: 'completed'
        });

        if (!donation) {
          canViewComments = false;
          canComment = false;
        }
      }
    }

    res.json({
      comments: canViewComments ? comments : [],
      commentCount: comments.length,
      canViewComments,
      canComment,
      success: true
    });
  } catch (error) {
    console.error('Fetch comments error:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Submit a new comment (FIXED WITH NOTIFICATIONS)
app.post('/api/comments', submissionLimiter, async (req, res) => {
  try {
    const {
      blogPostId,
      commentType,
      commenterName,
      commenterEmail,
      commenterImage,
      commentText,
      notifyOnReplies
    } = req.body;

    console.log('💬 Comment submission:', { commenterName, commentType, blogPostId });

    if (!blogPostId || !commentType || !commentText) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    if (!['blog', 'transparency'].includes(commentType)) {
      return res.status(400).json({ error: 'Invalid comment type' });
    }

    if (commentText.length > 1000) {
      return res.status(400).json({ error: 'Comment too long (max 1000 characters)' });
    }

    // Validate email if provided
    if (commenterEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(commenterEmail)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }
    }

    // ✅ FIX: Convert slug to ObjectId if needed
    const realBlogPostId = await getBlogPostId(blogPostId);
    
    // Get blog post details for notifications
    const blogPost = await BlogPost.findById(realBlogPostId);
    if (!blogPost) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    // For transparency comments, verify donor status
    if (commentType === 'transparency') {
      if (!commenterEmail) {
        return res.status(403).json({ 
          error: 'Email required to comment on transparency pages' 
        });
      }

      const donation = await Donation.findOne({
        blogPostId: realBlogPostId,
        donorEmail: commenterEmail.toLowerCase(),
        status: 'completed'
      });

      if (!donation) {
        return res.status(403).json({ 
          error: 'Only donors can comment on transparency pages' 
        });
      }
    }

    const comment = new Comment({
      blogPostId: realBlogPostId,
      commentType,
      commenterName: commenterName || 'Anonymous',
      commenterEmail: commenterEmail ? commenterEmail.toLowerCase() : '',
      commenterImage: commenterImage || '',
      commentText: commentText.trim(),
      notifyOnReplies: notifyOnReplies || false,
      status: 'approved' // Auto-approve
    });

    await comment.save();
    console.log('✅ Comment saved:', comment._id);

    // ✅ FIX: Send notifications to subscribers who opted in
    if (sendCommentNotification) {
      // Find all commenters who opted in for notifications on this post/type
      const subscribers = await Comment.find({
        blogPostId: realBlogPostId,
        commentType,
        notifyOnReplies: true,
        commenterEmail: { $exists: true, $ne: '' },
        status: 'approved',
        _id: { $ne: comment._id } // Don't include the new comment
      }).select('commenterName commenterEmail');

      if (subscribers.length > 0) {
        console.log(`📧 Found ${subscribers.length} subscriber(s) to notify`);
        
        // Send notifications asynchronously (don't wait for completion)
        sendCommentNotification(comment, blogPost, subscribers)
          .then(result => {
            console.log(`✅ Notifications sent: ${result.successful} successful, ${result.failed} failed`);
          })
          .catch(err => {
            console.error('❌ Failed to send comment notifications:', err.message);
          });
      } else {
        console.log('ℹ️ No subscribers opted in for notifications');
      }
    }

    res.status(201).json({
      message: 'Comment posted successfully',
      comment: {
        _id: comment._id,
        commenterName: comment.commenterName,
        commenterImage: comment.commenterImage,
        commentText: comment.commentText,
        createdAt: comment.createdAt
      },
      success: true
    });
  } catch (error) {
    console.error('❌ Comment submission error:', error);
    res.status(500).json({ error: 'Failed to post comment' });
  }
});

// ============================================
// ADMIN COMMENT ROUTES
// ============================================

app.get('/api/admin/comments', authenticateAdmin, async (req, res) => {
  try {
    const { blogPostId, commentType, status, limit = 100 } = req.query;

    const query = {};
    if (blogPostId) query.blogPostId = blogPostId;
    if (commentType) query.commentType = commentType;
    if (status) query.status = status;

    const comments = await Comment.find(query)
      .populate('blogPostId', 'title slug')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({ comments, success: true });
  } catch (error) {
    console.error('Fetch comments error:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

app.patch('/api/admin/comments/:id', authenticateAdmin, async (req, res) => {
  try {
    const { status } = req.body;

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const comment = await Comment.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    res.json({ comment, success: true });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ error: 'Failed to update comment' });
  }
});

app.delete('/api/admin/comments/:id', authenticateAdmin, async (req, res) => {
  try {
    const comment = await Comment.findByIdAndDelete(req.params.id);

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    res.json({ message: 'Comment deleted successfully', success: true });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// ============================================
// ADMIN ROUTES
// ============================================

// Contacts
app.get('/api/admin/contacts', authenticateAdmin, async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;
    
    const query = status ? { status } : {};
    const contacts = await Contact.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({ contacts, success: true });
  } catch (error) {
    console.error('Fetch contacts error:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

app.patch('/api/admin/contacts/:id', authenticateAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['new', 'read', 'archived'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json({ contact, success: true });
  } catch (error) {
    console.error('Update contact error:', error);
    res.status(500).json({ error: 'Failed to update contact' });
  }
});

app.delete('/api/admin/contacts/:id', authenticateAdmin, async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json({ message: 'Contact deleted successfully', success: true });
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});

// Testimonials Admin
app.get('/api/admin/testimonials', authenticateAdmin, async (req, res) => {
  try {
    const { status, limit = 100 } = req.query;
    
    const query = status ? { status } : {};
    const testimonials = await Testimonial.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({ testimonials, success: true });
  } catch (error) {
    console.error('Fetch testimonials error:', error);
    res.status(500).json({ error: 'Failed to fetch testimonials' });
  }
});

app.patch('/api/admin/testimonials/:id', authenticateAdmin, async (req, res) => {
  try {
    const { status, image } = req.body;
    
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updateData = { status };
    if (status === 'approved') {
      updateData.approvedAt = new Date();
    }
    if (image) {
      updateData.image = image;
    }

    const testimonial = await Testimonial.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!testimonial) {
      return res.status(404).json({ error: 'Testimonial not found' });
    }

    res.json({ testimonial, success: true });
  } catch (error) {
    console.error('Update testimonial error:', error);
    res.status(500).json({ error: 'Failed to update testimonial' });
  }
});

app.delete('/api/admin/testimonials/:id', authenticateAdmin, async (req, res) => {
  try {
    const testimonial = await Testimonial.findByIdAndDelete(req.params.id);
    
    if (!testimonial) {
      return res.status(404).json({ error: 'Testimonial not found' });
    }

    res.json({ message: 'Testimonial deleted successfully', success: true });
  } catch (error) {
    console.error('Delete testimonial error:', error);
    res.status(500).json({ error: 'Failed to delete testimonial' });
  }
});

// Blog Posts Admin
app.post('/api/admin/blog/posts', authenticateAdmin, async (req, res) => {
  try {
    const {
      title,
      slug,
      content,
      contentFormat,
      excerpt,
      featuredImage,
      category,
      status,
      isDonationDrive,
      donationGoal,
      donationCurrency,
      paypalEmail
    } = req.body;

    console.log('📝 Creating blog post:', { 
      title, 
      contentFormat,
      contentLength: content?.length,
      firstChars: content?.substring(0, 50)
    });

    if (!title || !slug || !content || !excerpt) {
      return res.status(400).json({ error: 'Required fields are missing' });
    }

    const existing = await BlogPost.findOne({ slug });
    if (existing) {
      return res.status(400).json({ error: 'Slug already exists' });
    }

    // CRITICAL FIX: Always preserve original content
    let htmlContent = content;
    let markdownSource = content; // ALWAYS save the original input
    
    if (contentFormat === 'markdown') {
      console.log('🔄 Converting markdown to HTML...');
      htmlContent = markdownToHtml(content);
      console.log('✅ Conversion complete. HTML length:', htmlContent.length);
    } else {
      console.log('📄 Content is already HTML');
      // If HTML was provided, store it as-is
      htmlContent = content;
    }

    const post = new BlogPost({
      title,
      slug,
      content: htmlContent, // HTML for frontend display
      markdownSource, // Original input (markdown or HTML)
      excerpt,
      featuredImage: featuredImage || '',
      category: category || 'blog',
      status: status || 'draft',
      isDonationDrive: isDonationDrive || false,
      donationGoal: donationGoal || 0,
      donationCurrency: donationCurrency || 'PHP',
      paypalEmail: paypalEmail || '',
      publishedAt: status === 'published' ? new Date() : null
    });

    await post.save();
    console.log('✅ Blog post saved:', post._id);

    res.status(201).json({ post, success: true });
  } catch (error) {
    console.error('❌ Create blog post error:', error);
    res.status(500).json({ error: 'Failed to create blog post' });
  }
});


app.patch('/api/admin/blog/posts/:id', authenticateAdmin, async (req, res) => {
  try {
    console.log('📝 Updating blog post:', req.params.id);
    
    const updateData = { ...req.body, updatedAt: new Date() };
    
    // CRITICAL FIX: Properly handle markdown/HTML conversion on updates
    if (req.body.content) {
      const contentFormat = req.body.contentFormat || 'markdown';
      
      console.log('📝 Content update:', {
        format: contentFormat,
        contentLength: req.body.content?.length,
        firstChars: req.body.content?.substring(0, 50)
      });
      
      if (contentFormat === 'markdown') {
        console.log('🔄 Converting markdown to HTML...');
        updateData.content = markdownToHtml(req.body.content);
        updateData.markdownSource = req.body.content; // Save original markdown
        console.log('✅ Conversion complete');
      } else if (contentFormat === 'html') {
        console.log('📄 Content is HTML, storing directly');
        updateData.content = req.body.content;
        updateData.markdownSource = req.body.content; // Save HTML as source
      } else {
        // Default behavior: assume markdown
        console.log('⚠️ No format specified, assuming markdown');
        updateData.content = markdownToHtml(req.body.content);
        updateData.markdownSource = req.body.content;
      }
    }
    
    // Update published date if status changes to published
    if (req.body.status === 'published' && !req.body.publishedAt) {
      updateData.publishedAt = new Date();
    }

    // Remove contentFormat from updateData (it's not a schema field)
    delete updateData.contentFormat;

    const post = await BlogPost.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!post) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    console.log('✅ Blog post updated:', post._id);
    res.json({ post, success: true });
  } catch (error) {
    console.error('❌ Update blog post error:', error);
    res.status(500).json({ error: 'Failed to update blog post' });
  }
});

app.delete('/api/admin/blog/posts/:id', authenticateAdmin, async (req, res) => {
  try {
    const post = await BlogPost.findByIdAndDelete(req.params.id);
    
    if (!post) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    // Also delete associated donations and expenses
    await Donation.deleteMany({ blogPostId: post._id });
    await Expense.deleteMany({ blogPostId: post._id });

    res.json({ message: 'Blog post and associated data deleted successfully', success: true });
  } catch (error) {
    console.error('Delete blog post error:', error);
    res.status(500).json({ error: 'Failed to delete blog post' });
  }
});

// Donations Admin
app.get('/api/admin/donations', authenticateAdmin, async (req, res) => {
  try {
    const { blogPostId, paymentMethod, verificationStatus, limit = 100 } = req.query;
    
    const query = {};
    if (blogPostId) query.blogPostId = blogPostId;
    if (paymentMethod) query.paymentMethod = paymentMethod;
    if (verificationStatus) query.verificationStatus = verificationStatus;

    const donations = await Donation.find(query)
      .populate('blogPostId', 'title slug')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({ donations, success: true });
  } catch (error) {
    console.error('Fetch donations error:', error);
    res.status(500).json({ error: 'Failed to fetch donations' });
  }
});

// Expenses Admin
app.get('/api/admin/expenses', authenticateAdmin, async (req, res) => {
  try {
    const { blogPostId, status, limit = 100 } = req.query;
    
    const query = {};
    if (blogPostId) query.blogPostId = blogPostId;
    if (status) query.status = status;

    const expenses = await Expense.find(query)
      .populate('blogPostId', 'title slug')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({ expenses, success: true });
  } catch (error) {
    console.error('Fetch expenses error:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

app.post('/api/admin/expenses', authenticateAdmin, async (req, res) => {
  try {
    const {
      blogPostId,
      title,
      description,
      amount,
      currency,
      date,
      receipts,
      beneficiaries,
      category
    } = req.body;

    if (!blogPostId || !title || !description || !amount || !date) {
      return res.status(400).json({ error: 'Required fields are missing' });
    }

    const blogPost = await BlogPost.findById(blogPostId);
    if (!blogPost) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    const expense = new Expense({
      blogPostId,
      title,
      description,
      amount: parseFloat(amount),
      currency: currency || blogPost.donationCurrency || 'PHP',
      date: new Date(date),
      receipts: receipts || [],
      beneficiaries: beneficiaries || '',
      category: category || 'relief-goods',
      status: 'approved',
      approvedAt: new Date()
    });

    await expense.save();
    console.log('✅ Expense saved:', expense._id);

    // Send notifications to subscribers
    if (sendExpenseNotification) {
      const subscribers = await Donation.find({
        blogPostId,
        notifyOnUpdates: true,
        status: 'completed'
      }).select('donorEmail donorName');

      if (subscribers.length > 0) {
        console.log(`📧 Found ${subscribers.length} subscriber(s) to notify`);
        
        try {
          const result = await sendExpenseNotification(expense, blogPost, subscribers);
          console.log(`✅ Notification result:`, result);
          
          // Return success even if some emails failed
          res.status(201).json({ 
            expense, 
            success: true,
            emailResult: result
          });
        } catch (emailError) {
          // Email failed but expense was saved
          console.error('❌ Email notification error:', emailError);
          res.status(201).json({ 
            expense, 
            success: true,
            warning: 'Expense saved but email notifications failed',
            emailError: emailError.message
          });
        }
      } else {
        console.log('ℹ️ No subscribers opted in for updates');
        res.status(201).json({ expense, success: true });
      }
    } else {
      console.error('⚠️ Expense notification service not available');
      res.status(201).json({ 
        expense, 
        success: true,
        warning: 'Expense saved but email service unavailable'
      });
    }
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

app.patch('/api/admin/expenses/:id', authenticateAdmin, async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    if (req.body.status === 'approved' && !req.body.approvedAt) {
      updateData.approvedAt = new Date();
    }

    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json({ expense, success: true });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

app.delete('/api/admin/expenses/:id', authenticateAdmin, async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json({ message: 'Expense deleted successfully', success: true });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});


// TEST ENDPOINT

app.post('/api/admin/test-brevo', authenticateAdmin, async (req, res) => {
  try {
    console.log('🧪 Testing Brevo email...');
    
    if (!sendExpenseNotification) {
      return res.status(500).json({ error: 'Email service not initialized' });
    }
    
    // Create fake expense and subscriber for testing
    const testExpense = {
      title: 'Test Expense',
      amount: 100,
      currency: 'PHP',
      date: new Date(),
      description: 'This is a test expense notification',
      beneficiaries: 'Test beneficiaries'
    };
    
    const testBlogPost = {
      title: 'Test Campaign',
      slug: 'test-campaign'
    };
    
    const testSubscribers = [{
      donorEmail: 'devchollo@gmail.com', // Your email
      donorName: 'Kent Sevillejo'
    }];
    
    const result = await sendExpenseNotification(testExpense, testBlogPost, testSubscribers);
    
    res.json({
      success: true,
      result,
      message: 'Check your email and server logs'
    });
  } catch (error) {
    console.error('Test error:', error);
    res.status(500).json({ 
      error: error.message,
      stack: error.stack
    });
  }
});



// Admin Dashboard Stats
app.get('/api/admin/stats', authenticateAdmin, async (req, res) => {
  try {
    const [
      totalContacts,
      newContacts,
      pendingTestimonials,
      approvedTestimonials,
      totalTestimonials,
      totalBlogPosts,
      publishedBlogPosts,
      totalDonations,
      totalExpenses
    ] = await Promise.all([
      Contact.countDocuments(),
      Contact.countDocuments({ status: 'new' }),
      Testimonial.countDocuments({ status: 'pending' }),
      Testimonial.countDocuments({ status: 'approved' }),
      Testimonial.countDocuments(),
      BlogPost.countDocuments(),
      BlogPost.countDocuments({ status: 'published' }),
      Donation.countDocuments({ status: 'completed' }),
      Expense.countDocuments({ status: 'approved' })
    ]);

    const avgRating = await Testimonial.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);

    const donationSum = await Donation.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const expenseSum = await Expense.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.json({
      contacts: {
        total: totalContacts,
        new: newContacts
      },
      testimonials: {
        total: totalTestimonials,
        pending: pendingTestimonials,
        approved: approvedTestimonials,
        avgRating: avgRating[0]?.avgRating || 0
      },
      blog: {
        total: totalBlogPosts,
        published: publishedBlogPosts
      },
      donations: {
        total: totalDonations,
        totalAmount: donationSum[0]?.total || 0
      },
      expenses: {
        total: totalExpenses,
        totalAmount: expenseSum[0]?.total || 0
      },
      success: true
    });
  } catch (error) {
    console.error('Fetch stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});


// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);

  if (process.env.NODE_ENV === 'production') {
    setInterval(() => {
      fetch('https://ksevillejov2.onrender.com/api/health')
        .then(res => res.json())
        .then(() => console.log('✅ Self-ping successful'))
        .catch((err) => console.error('❌ Self-ping failed:', err.message));
    }, 14 * 60 * 1000);
  }
});