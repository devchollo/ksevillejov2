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
  const rawHtml = marked.parse(markdown);
  return DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
                   'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'code', 'pre', 'hr', 
                   'table', 'thead', 'tbody', 'tr', 'th', 'td'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class']
  });
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
let sendContactEmail, sendTestimonialNotification, sendDonationThankYou, sendExpenseNotification;

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
  
  try {
    const emailPromises = subscribers.map(async (subscriber) => {
      try {
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

        await brevoClient.sendTransacEmail(emailData);
        console.log(`✅ Notification sent to ${subscriber.donorEmail}`);
        return { success: true, email: subscriber.donorEmail };
      } catch (emailError) {
        console.error(`❌ Failed to send to ${subscriber.donorEmail}:`, emailError?.message || 'Unknown error');
        return { success: false, email: subscriber.donorEmail, error: emailError?.message || 'Unknown error' };
      }
    });

    const results = await Promise.allSettled(emailPromises);
    
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length;
    
    console.log(`✅ Expense notifications: ${successful} sent, ${failed} failed`);
    
    if (failed > 0) {
      console.warn(`⚠️ ${failed} notification(s) failed to send`);
      results.forEach((result, index) => {
        if (result.status === 'rejected' || (result.status === 'fulfilled' && !result.value.success)) {
          console.error(`Failed recipient: ${subscribers[index]?.donorEmail}`, result.reason || result.value?.error);
        }
      });
    }
    
    return { successful, failed };
  } catch (error) {
    console.error('❌ Expense notification error:', error?.message || error || 'Unknown error');
    throw error;
  }
};

    console.log('✅ Brevo email service initialized');
  } catch (error) {
    console.error('❌ Failed to initialize Brevo:', error.message);
    sendContactEmail = null;
    sendTestimonialNotification = null;
    sendDonationThankYou = null;
    sendExpenseNotification = null;
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
  paypalTransactionId: { type: String, default: '' },
  paypalOrderId: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  message: { type: String, default: '' },
  isAnonymous: { type: Boolean, default: false },
  notifyOnUpdates: { type: Boolean, default: false },
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

const Testimonial = mongoose.model('Testimonial', TestimonialSchema);
const Contact = mongoose.model('Contact', ContactSchema);
const BlogPost = mongoose.model('BlogPost', BlogPostSchema);
const Donation = mongoose.model('Donation', DonationSchema);
const Expense = mongoose.model('Expense', ExpenseSchema);

// Admin Authentication Middleware
const authenticateAdmin = (req, res, next) => {
  const adminKey = req.headers['x-admin-key'];
  if (adminKey === process.env.ADMIN_SECRET_KEY) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// ============================================
// PUBLIC ROUTES
// ============================================

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
app.get('/api/blog/posts', async (req, res) => {
  try {
    const { category, limit = 20, page = 1 } = req.query;
    
    const query = { status: 'published' };
    if (category) query.category = category;

    const posts = await BlogPost.find(query)
      .select('-__v')
      .sort({ publishedAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await BlogPost.countDocuments(query);

    res.json({ 
      posts, 
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
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

    if (!blogPostSlug || !donorEmail || !amount) {
      return res.status(400).json({ error: 'Required fields are missing' });
    }

    const blogPost = await BlogPost.findOne({ slug: blogPostSlug });
    if (!blogPost) {
      return res.status(404).json({ error: 'Donation drive not found' });
    }

    if (!blogPost.isDonationDrive) {
      return res.status(400).json({ error: 'This blog post is not accepting donations' });
    }

    const donation = new Donation({
      blogPostId: blogPost._id,
      donorName: isAnonymous ? 'Anonymous' : (donorName || 'Anonymous'),
      donorEmail,
      amount: parseFloat(amount),
      currency: blogPost.donationCurrency,
      paypalOrderId: paypalOrderId || '',
      paypalTransactionId: paypalTransactionId || '',
      status: 'completed', // Set to completed after PayPal verification
      message: message || '',
      isAnonymous: isAnonymous || false,
      notifyOnUpdates: notifyOnUpdates || false
    });

    await donation.save();

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
        currency: donation.currency
      },
      success: true 
    });
  } catch (error) {
    console.error('❌ Donation submission error:', error);
    res.status(500).json({ error: 'Failed to process donation' });
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
app.get('/api/admin/blog/posts', authenticateAdmin, async (req, res) => {
  try {
    const { status, limit = 100 } = req.query;
    
    const query = status ? { status } : {};
    const posts = await BlogPost.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({ posts, success: true });
  } catch (error) {
    console.error('Fetch blog posts error:', error);
    res.status(500).json({ error: 'Failed to fetch blog posts' });
  }
});

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

    if (!title || !slug || !content || !excerpt) {
      return res.status(400).json({ error: 'Required fields are missing' });
    }

    // Check if slug already exists
    const existing = await BlogPost.findOne({ slug });
    if (existing) {
      return res.status(400).json({ error: 'Slug already exists' });
    }

    // Convert markdown to HTML if needed
    const htmlContent = contentFormat === 'markdown' ? markdownToHtml(content) : content;

    console.log('📝 Creating blog post:', {
      title,
      contentFormat,
      originalLength: content.length,
      htmlLength: htmlContent.length
    });

    const post = new BlogPost({
      title,
      slug,
      content: htmlContent, // Store as HTML
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

    res.status(201).json({ post, success: true });
  } catch (error) {
    console.error('Create blog post error:', error);
    res.status(500).json({ error: 'Failed to create blog post' });
  }
});

app.patch('/api/admin/blog/posts/:id', authenticateAdmin, async (req, res) => {
  try {
    const updateData = { ...req.body, updatedAt: new Date() };
    
    // Convert markdown to HTML if needed
    if (req.body.content && req.body.contentFormat === 'markdown') {
      console.log('📝 Converting markdown to HTML for post:', req.params.id);
      updateData.content = markdownToHtml(req.body.content);
    }
    
    if (req.body.status === 'published' && !req.body.publishedAt) {
      updateData.publishedAt = new Date();
    }

    const post = await BlogPost.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!post) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    res.json({ post, success: true });
  } catch (error) {
    console.error('Update blog post error:', error);
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
    const { blogPostId, limit = 100 } = req.query;
    
    const query = blogPostId ? { blogPostId } : {};
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

    // Send notifications to subscribers
    if (sendExpenseNotification) {
      const subscribers = await Donation.find({
        blogPostId,
        notifyOnUpdates: true,
        status: 'completed'
      }).select('donorEmail donorName');

      if (subscribers.length > 0) {
        console.log(`📧 Found ${subscribers.length} subscriber(s) to notify`);
        sendExpenseNotification(expense, blogPost, subscribers)
          .then(result => {
            console.log(`✅ Notification batch completed: ${result.successful} sent, ${result.failed} failed`);
          })
          .catch(err => {
            console.error('❌ Notification batch error:', err?.message || err || 'Unknown error');
          });
      } else {
        console.log('ℹ️ No subscribers opted in for updates');
      }
    } else {
      console.log('⚠️ Expense notification service not available');
    }

    res.status(201).json({ expense, success: true });
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