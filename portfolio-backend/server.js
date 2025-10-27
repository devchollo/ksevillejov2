const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const dotenv = require('dotenv');

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
    
    // Allow requests with no origin (like mobile apps, curl, Postman)
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
app.use(mongoSanitize()); // Prevent NoSQL injection
app.use(xss()); // Prevent XSS attacks

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  handler: (req, res) => {
    console.log('🚫 GENERAL RATE LIMIT HIT for IP:', req.ip);
    res.status(429).json({ error: 'Too many requests from this IP, please try again later.' });
  }
});
app.use('/api/', limiter);

// Stricter rate limit for submissions
const submissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 submissions per hour
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

// Brevo Email Setup - REQUIRED for contact form to work
let sendContactEmail, sendTestimonialNotification;

if (process.env.BREVO_API_KEY) {
  try {
    const SibApiV3Sdk = require('@sendinblue/client');
    const brevoClient = new SibApiV3Sdk.TransactionalEmailsApi();
    brevoClient.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

    // Send contact form email directly (no database)
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
            <p><small>You can reply directly to this email to respond to ${contactData.name}</small></p>
          `
        };

        await brevoClient.sendTransacEmail(emailData);
        console.log('✅ Contact email sent via Brevo to devchollo@gmail.com');
        return true;
      } catch (error) {
        console.error('❌ Brevo contact email error:', error.message);
        throw error;
      }
    };

    // Send testimonial notification email
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
        console.log('✅ Testimonial notification sent via Brevo to devchollo@gmail.com');
      } catch (error) {
        console.error('❌ Brevo testimonial email error:', error.message);
        // Don't throw - testimonial should still be saved even if email fails
      }
    };

    console.log('✅ Brevo email service initialized');
  } catch (error) {
    console.error('❌ Failed to initialize Brevo:', error.message);
    sendContactEmail = null;
    sendTestimonialNotification = null;
  }
} else {
  console.log('⚠️  BREVO_API_KEY not set - email notifications disabled');
  sendContactEmail = null;
  sendTestimonialNotification = null;
}

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => console.error('❌ MongoDB Connection Error:', err));

// Schemas - ONLY Testimonials (Contact removed since we're not saving them)
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

const Testimonial = mongoose.model('Testimonial', TestimonialSchema);

// Keep Contact model for backward compatibility with existing admin dashboard
const ContactSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  message: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['new', 'read', 'archived'], default: 'new' }
});
const Contact = mongoose.model('Contact', ContactSchema);

// Admin Authentication Middleware (simple version)
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

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Contact Form Submission - ONLY sends email (no database save)
app.post('/api/contact', submissionLimiter, async (req, res) => {
  console.log('📧 Contact form received:', { name: req.body.name, email: req.body.email });
  
  try {
    const { name, email, message } = req.body;

    // Validation
    if (!name || !email || !message) {
      console.log('❌ Missing fields');
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (message.length > 5000) {
      console.log('❌ Message too long');
      return res.status(400).json({ error: 'Message is too long' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('❌ Invalid email format');
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if Brevo is configured
    if (!sendContactEmail) {
      console.log('❌ Brevo not configured');
      return res.status(500).json({ 
        error: 'Email service not configured. Please contact the administrator.' 
      });
    }

    // Send email directly (no database save)
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

// Submit Testimonial - Saves to MongoDB + sends notification
app.post('/api/testimonials', submissionLimiter, async (req, res) => {
  console.log('⭐ Testimonial received:', { name: req.body.name, email: req.body.email, rating: req.body.rating });
  
  try {
    const { name, email, company, role, message, rating } = req.body;

    // Validation
    if (!name || !email || !message || !rating) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ error: 'Required fields are missing' });
    }

    if (rating < 1 || rating > 5) {
      console.log('❌ Invalid rating');
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    if (message.length > 1000) {
      console.log('❌ Message too long');
      return res.status(400).json({ error: 'Message is too long (max 1000 characters)' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('❌ Invalid email format');
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Save to MongoDB
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
    console.log('✅ Testimonial saved successfully:', testimonial._id);

    // Send notification email (non-blocking)
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

// Get Approved Testimonials
app.get('/api/testimonials', async (req, res) => {
  try {
    const testimonials = await Testimonial.find({ status: 'approved' })
      .select('-email -__v') // Don't expose emails publicly
      .sort({ approvedAt: -1 })
      .limit(50);

    res.json({ testimonials, success: true });
  } catch (error) {
    console.error('Fetch testimonials error:', error);
    res.status(500).json({ error: 'Failed to fetch testimonials' });
  }
});

// Get Testimonial Stats (for public display)
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

// ============================================
// ADMIN ROUTES (Protected)
// ============================================

// Get All Contacts (kept for backward compatibility)
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

// Update Contact Status (kept for backward compatibility)
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

// Delete Contact (kept for backward compatibility)
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

// Get All Testimonials (Admin)
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

// Approve/Reject Testimonial
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

// Delete Testimonial
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

// Get Admin Dashboard Stats
app.get('/api/admin/stats', authenticateAdmin, async (req, res) => {
  try {
    const [
      totalContacts,
      newContacts,
      pendingTestimonials,
      approvedTestimonials,
      totalTestimonials
    ] = await Promise.all([
      Contact.countDocuments(),
      Contact.countDocuments({ status: 'new' }),
      Testimonial.countDocuments({ status: 'pending' }),
      Testimonial.countDocuments({ status: 'approved' }),
      Testimonial.countDocuments()
    ]);

    const avgRating = await Testimonial.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
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

  // Self-ping every 14 minutes to prevent Render free tier sleep (production only)
  if (process.env.NODE_ENV === 'production') {
    setInterval(() => {
      fetch('https://ksevillejov2.onrender.com/api/health')
        .then(res => res.json())
        .then(() => console.log('✅ Self-ping successful'))
        .catch((err) => console.error('❌ Self-ping failed:', err.message));
    }, 14 * 60 * 1000); // 14 minutes
  }
});