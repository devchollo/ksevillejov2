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
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // limit each IP to 100 requests per windowMs
//   message: 'Too many requests from this IP, please try again later.'
// });

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
// const submissionLimiter = rateLimit({
//   windowMs: 60 * 60 * 1000, // 1 hour
//   max: 5, // limit each IP to 5 submissions per hour
//   message: 'Too many submissions, please try again later.'
// });

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

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => console.error('❌ MongoDB Connection Error:', err));

// Schemas
const ContactSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  message: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['new', 'read', 'archived'], default: 'new' }
});

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

const Contact = mongoose.model('Contact', ContactSchema);
const Testimonial = mongoose.model('Testimonial', TestimonialSchema);

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

// Contact Form Submission
app.post('/api/contact', submissionLimiter, async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Validation
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (message.length > 5000) {
      return res.status(400).json({ error: 'Message is too long' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const contact = new Contact({ name, email, message });
    await contact.save();

    // TODO: Send email notification using Brevo
    // await sendEmailNotification(contact);

    res.status(201).json({ 
      message: 'Message sent successfully!',
      success: true 
    });
  } catch (error) {
    console.error('Contact submission error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Submit Testimonial
app.post('/api/testimonials', submissionLimiter, async (req, res) => {
  try {
    const { name, email, company, role, message, rating } = req.body;

    // Validation
    if (!name || !email || !message || !rating) {
      return res.status(400).json({ error: 'Required fields are missing' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    if (message.length > 1000) {
      return res.status(400).json({ error: 'Message is too long (max 1000 characters)' });
    }

    // Email validation
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

    res.status(201).json({ 
      message: 'Testimonial submitted successfully! It will be reviewed shortly.',
      success: true 
    });
  } catch (error) {
    console.error('Testimonial submission error:', error);
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

// Get All Contacts
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

// Update Contact Status
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

// Delete Contact
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

  setInterval(() => {
     fetch("https://ksevillejov2.onrender.com")
       .then(() => console.log("Pinged self to stay awake 🟢"))
       .catch((err) => console.error("Ping failed:", err));
   }, 30 * 1000);

});