import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  Download,
  Mail,
  Phone,
  MapPin,
  Github,
  Linkedin,
  ExternalLink,
  ChevronDown,
  Code,
  Database,
  Cloud,
  Wrench,
  Layout,
  Server,
  Award,
  Briefcase,
  Users,
  Calendar,
  BookOpen, 
} from "lucide-react";

// Swipe Hook
const useSwipe = (onSwipeLeft, onSwipeRight) => {
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      onSwipeLeft();
    } else if (isRightSwipe) {
      onSwipeRight();
    }
  };

  return { onTouchStart, onTouchMove, onTouchEnd };
};

const Portfolio = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("home");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeProject, setActiveProject] = useState(0);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [techFilter, setTechFilter] = useState("All");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState("");
  const [isTestimonialModalOpen, setIsTestimonialModalOpen] = useState(false);
  const [testimonialForm, setTestimonialForm] = useState({
    name: "",
    email: "",
    company: "",
    role: "",
    message: "",
    rating: 5,
  });
  const [testimonialSubmitting, setTestimonialSubmitting] = useState(false);
  const [testimonialStatus, setTestimonialStatus] = useState("");
  const [testimonialStats, setTestimonialStats] = useState({
    avgRating: 5.0,
    totalCount: 47,
  });
  const [approvedTestimonials, setApprovedTestimonials] = useState([]);
  const [testimonialsLoading, setTestimonialsLoading] = useState(true);
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [companyLogos, setCompanyLogos] = useState([
    {
      name: "Supreme by SeatSavers",
      url: "https://seatsavers.com/",
      logo: "https://f005.backblazeb2.com/file/onestopmp3pi/embed_1761706766635_9df8cc6406707735.png",
    },
    {
      name: "The Ibive Group",
      url: "https://theibivegroup.com/",
      logo: "https://f005.backblazeb2.com/file/onestopmp3pi/embed_1761706448118_037bfedd65bc5537.png",
    },
    {
      name: "Work Tools Hub",
      url: "https://www.worktoolshub.info/",
      logo: "https://f005.backblazeb2.com/file/onestopmp3pi/embed_1761706474909_a8371eb98456e676.png",
    },
    {
      name: "Newfold Core",
      url: "https://www.worktoolshub.info/tools/newfold-core",
      logo: "https://f005.backblazeb2.com/file/onestopmp3pi/embed_1761706492893_b7321ddbb6cb94e3.png",
    },
    { name: "Ship Blox", url: "#", logo: "" },
    { name: "Frame Blox", url: "#", logo: "" },
    { name: "Ultra Blox", url: "#", logo: "" },
    { name: "Ship Blox", url: "#", logo: "" },
  ]);

  // Fetch testimonial stats and approved testimonials on mount
  useEffect(() => {
    const fetchTestimonialData = async () => {
      try {
        const statsResponse = await fetch(
          "https://ksevillejov2.onrender.com/api/testimonials/stats"
        );
        const statsData = await statsResponse.json();
        if (statsData.success) {
          setTestimonialStats({
            avgRating: statsData.avgRating,
            totalCount: statsData.totalCount,
          });
        }

        const testimonialsResponse = await fetch(
          "https://ksevillejov2.onrender.com/api/testimonials"
        );
        const testimonialsData = await testimonialsResponse.json();
        if (
          testimonialsData.success &&
          testimonialsData.testimonials.length > 0
        ) {
          setApprovedTestimonials(testimonialsData.testimonials);
        }
      } catch (error) {
        console.error("Failed to fetch testimonial data:", error);
      } finally {
        setTestimonialsLoading(false);
      }
    };

    fetchTestimonialData();
  }, []);

  // Projects data
  const projects = [
    {
      id: 1,
      title: "WorkToolsHub",
      description:
        "A comprehensive platform for work productivity tools with authentication, real-time collaboration, and cloud storage integration.",
      image: "WorkToolsHub.jpeg",
      tech: ["React", "Node.js", "MongoDB", "Render", "OpenAI", "Vercel"],
      year: "2025",
      category: "Web Application",
      link: "https://www.worktoolshub.info/",
    },
    {
      id: 2,
      title: "ReliefHub",
      description:
        "Disaster relief coordination platform connecting volunteers with affected communities, featuring real-time mapping and resource tracking.",
      image:
        "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&q=80",
      tech: [
        "React",
        "Express",
        "MongoDB",
        "Vercel",
        "Render",
        "Stripe",
        "GCash",
      ],
      year: "2025",
      category: "Social Impact",
      link: "#",
    },
    {
      id: 3,
      title: "E-Commerce Platform",
      description:
        "Full-featured online shopping platform with payment integration, inventory management, and advanced analytics dashboard.",
      image:
        "https://images.unsplash.com/photo-1557821552-17105176677c?w=800&q=80",
      tech: ["React", "PHP", "MySQL", "Stripe"],
      year: "2023",
      category: "E-Commerce",
      link: "#",
    },
  ];

  // All projects data (includes featured + additional)
  const allProjects = [
    ...projects,
    {
      id: 4,
      title: "Corporate Website",
      description:
        "Modern corporate website with CMS integration and dynamic content management.",
      image:
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
      tech: ["WordPress", "PHP", "MySQL"],
      year: "2024",
      category: "Corporate",
      link: "#",
    },
    {
      id: 5,
      title: "Portfolio Platform",
      description:
        "Creative portfolio platform for artists and designers to showcase their work.",
      image:
        "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=800&q=80",
      tech: ["React", "Node.js", "MongoDB"],
      year: "2023",
      category: "Platform",
      link: "#",
    },
    {
      id: 6,
      title: "Booking System",
      description:
        "Real-time booking and reservation system with payment integration.",
      image:
        "https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&q=80",
      tech: ["Vue.js", "Laravel", "Stripe"],
      year: "2023",
      category: "Web Application",
      link: "#",
    },
  ];

  // Tech stack data
  const techStack = [
    { name: "HTML", level: 95, category: "Frontend", icon: Layout },
    { name: "CSS", level: 95, category: "Frontend", icon: Layout },
    { name: "JavaScript", level: 90, category: "Frontend", icon: Code },
    { name: "React", level: 88, category: "Frontend", icon: Code },
    { name: "Tailwind CSS", level: 92, category: "Frontend", icon: Layout },
    { name: "Bootstrap", level: 85, category: "Frontend", icon: Layout },
    { name: "Node.js", level: 80, category: "Backend", icon: Server },
    { name: "Express", level: 82, category: "Backend", icon: Server },
    { name: "PHP", level: 78, category: "Backend", icon: Server },
    { name: "Python", level: 75, category: "Backend", icon: Server },
    { name: "MongoDB", level: 80, category: "Database", icon: Database },
    { name: "SQL/MySQL", level: 82, category: "Database", icon: Database },
    { name: "PostgreSQL", level: 75, category: "Database", icon: Database },
    { name: "AWS", level: 70, category: "Cloud", icon: Cloud },
    { name: "Vercel", level: 85, category: "Cloud", icon: Cloud },
    { name: "Render", level: 80, category: "Cloud", icon: Cloud },
    { name: "WordPress", level: 88, category: "CMS", icon: Wrench },
    { name: "Git/GitHub", level: 90, category: "Tools", icon: Github },
  ];

  // Work history data
  const workHistory = [
    {
      period: "April 2024 - Present",
      company: "Newfold Digital",
      role: "Website Modification Specialist",
      description:
        "Maintaining hundreds of websites under Network Solutions. Specializing in custom code modifications, plugin management, and resolving complex technical issues.",
      achievements: [
        "Maintained 200+ client websites",
        "Reduced resolution time by 40%",
        "Implemented automated monitoring systems",
      ],
    },
    {
      period: "January 2024 - April 2024",
      company: "TDCX (Apple Inc.)",
      role: "Technical Support Specialist",
      description:
        "Provided technical support for iOS, macOS, and watchOS devices. Excelled in troubleshooting and hardware diagnostics.",
      achievements: [
        "95% customer satisfaction rating",
        "Expert in iOS ecosystem",
        "Genius Bar coordination specialist",
      ],
    },
    {
      period: "2024",
      company: "Cognizant",
      role: "IT Help Desk",
      description:
        "Assisted Family Dollar Stores across the U.S. with technical support for networks, servers, registers, and all MSP-related infrastructure.",
      achievements: [
        "Managed 500+ support tickets monthly",
        "Network troubleshooting expert",
        "Hardware repair coordination",
      ],
    },
    {
      period: "2022 - 2024",
      company: "Concentrix (Intuit QuickBooks)",
      role: "Technical Associate",
      description:
        "Assisted customers across the U.S. with QuickBooks Online and Desktop. Specialized in bookkeeping, reconciliation, and financial reporting.",
      achievements: [
        "Resolved 1000+ technical issues",
        "Bookkeeping expert",
        "98% issue resolution rate",
      ],
    },
  ];

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);

      const sections = [
        "home",
        "about",
        "techstack",
        "projects",
        "work",
        "testimonials",
        "contact",
      ];
      const scrollPosition = window.scrollY + 100;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (
            scrollPosition >= offsetTop &&
            scrollPosition < offsetTop + offsetHeight
          ) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Project carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveProject((prev) => (prev + 1) % projects.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // Testimonial carousel
  useEffect(() => {
    if (approvedTestimonials.length > 0) {
      const interval = setInterval(() => {
        setActiveTestimonial(
          (prev) => (prev + 1) % approvedTestimonials.length
        );
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [approvedTestimonials]);

  // Smooth scroll
  const scrollToSection = (sectionId) => {
    // Special handling for blog - navigate to blog page
    if (sectionId === 'blog') {
      navigate('/blog');
      setIsMenuOpen(false);
      return;
    }
    
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setIsMenuOpen(false);
    }
  };

  // Filter tech stack
  const filteredTech =
    techFilter === "All"
      ? techStack
      : techStack.filter((tech) => tech.category === techFilter);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("");

    try {
      const response = await fetch(
        "https://ksevillejov2.onrender.com/api/contact",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSubmitStatus("success");
        setFormData({ name: "", email: "", message: "" });
      } else {
        setSubmitStatus("error");
      }
    } catch (error) {
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSubmitStatus(""), 3000);
    }
  };

  // Handle testimonial submission
  const handleTestimonialSubmit = async (e) => {
    e.preventDefault();
    setTestimonialSubmitting(true);
    setTestimonialStatus("");

    try {
      const response = await fetch(
        "https://ksevillejov2.onrender.com/api/testimonials",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(testimonialForm),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setTestimonialStatus("success");
        setTestimonialForm({
          name: "",
          email: "",
          company: "",
          role: "",
          message: "",
          rating: 5,
        });
        setTimeout(() => {
          setIsTestimonialModalOpen(false);
          setTestimonialStatus("");
        }, 2000);
      } else {
        setTestimonialStatus("error");
      }
    } catch (error) {
      setTestimonialStatus("error");
    } finally {
      setTestimonialSubmitting(false);
    }
  };

  const projectSwipeHandlers = useSwipe(
    () => setActiveProject((prev) => (prev + 1) % projects.length),
    () =>
      setActiveProject((prev) => (prev - 1 + projects.length) % projects.length)
  );

  const testimonialSwipeHandlers = useSwipe(
    () =>
      setActiveTestimonial((prev) => (prev + 1) % approvedTestimonials.length),
    () =>
      setActiveTestimonial(
        (prev) =>
          (prev - 1 + approvedTestimonials.length) % approvedTestimonials.length
      )
  );

  return (
    <div className="bg-stone-50 text-stone-900 min-h-screen">
      {/* Floating Particles Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-amber-400/20 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${10 + Math.random() * 10}s`,
            }}
          />
        ))}
      </div>

      {/* Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-white/80 backdrop-blur-lg shadow-lg"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <button
              onClick={() => scrollToSection("home")}
              className="text-2xl font-bold cursor-pointer"
            >
              <span className="bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent">
                Kent Sevillejo
              </span>
            </button>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-1 lg:space-x-6">
              {[
                "Home",
                "About",
                "Tech Stack",
                "Projects",
                "Work",
                "Blog",  
                "Testimonials",
                "Contact",
              ].map((item) => (
                <button
                  key={item}
                  onClick={() =>
                    scrollToSection(item.toLowerCase().replace(" ", ""))
                  }
                  className={`px-3 py-2 text-sm font-medium transition-all relative group ${
                    activeSection === item.toLowerCase().replace(" ", "")
                      ? "text-amber-600"
                      : "text-stone-700 hover:text-amber-600"
                  }`}
                >
                  {item === "Blog" && (
                    <BookOpen size={16} className="inline mr-1 mb-0.5" />
                  )}
                  {item}
                  <span
                    className={`absolute -bottom-1 left-0 h-0.5 bg-amber-600 transition-all ${
                      activeSection === item.toLowerCase().replace(" ", "")
                        ? "w-full"
                        : "w-0 group-hover:w-full"
                    }`}
                  ></span>
                </button>
              ))}
              <a
                href="/kentsevillejoCV.html"
                target="_blank"
                className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-500 text-white px-5 py-2.5 rounded-full hover:shadow-lg hover:scale-105 transition-all ml-2"
              >
                <Download size={16} />
                <span className="font-medium">View CV</span>
              </a>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-stone-900"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-lg">
            <div className="px-4 py-4 space-y-4">
              {[
                "Home",
                "About",
                "Tech Stack",
                "Projects",
                "Work",
                "Blog",  
                "Testimonials",
                "Contact",
              ].map((item) => (
                <button
                  key={item}
                  onClick={() =>
                    scrollToSection(item.toLowerCase().replace(" ", ""))
                  }
                  className="block w-full text-left text-stone-600 hover:text-amber-600 flex items-center gap-2"
                >
                  {item === "Blog" && <BookOpen size={16} />}
                  {item}
                </button>
              ))}
              <a
                href="/kentsevillejoCV.html"
                target="_blank"
                className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-500 text-white px-4 py-2 rounded-full justify-center"
              >
                <Download size={16} />
                <span>View CV</span>
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* All other sections remain exactly the same as your original file */}
      {/* Just copy everything from Hero Section onwards from your document */}
      
      {/* Hero Section */}
      <section
        id="home"
        className="relative min-h-screen flex items-center justify-center pt-20 px-4 overflow-hidden"
      >
        <div className="absolute top-20 left-10 w-72 h-72 bg-amber-300/30 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-20 right-10 w-96 h-96 bg-orange-300/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />

        <div className="max-w-7xl mx-auto w-full relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-amber-100 px-4 py-2 rounded-full">
                <div className="w-2 h-2 bg-amber-600 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-amber-900">
                  Available for Opportunities
                </span>
              </div>

              <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                Hey, I'm{" "}
                <span className="bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 bg-clip-text text-transparent">
                  Kent
                </span>
              </h1>

              <h2 className="text-3xl md:text-4xl font-bold text-stone-800">
                Web Designer, Developer &<br />
                <span className="text-amber-600">Modification Specialist</span>
              </h2>

              <p className="text-lg text-stone-600 max-w-xl">
                Transforming ideas into stunning digital experiences. I create
                custom websites and maintain hundreds of platforms with
                precision and creativity.
              </p>

              <div className="flex flex-wrap gap-3">
                {["React", "WordPress", "Custom Code", "UX/UI"].map((skill) => (
                  <span
                    key={skill}
                    className="px-4 py-2 bg-white border-2 border-amber-200 rounded-full text-sm font-medium text-stone-700 hover:border-amber-400 hover:scale-105 transition-all"
                  >
                    {skill}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap gap-4 pt-4">
                <button
                  onClick={() => scrollToSection("projects")}
                  className="group flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-500 text-white px-8 py-4 rounded-full hover:shadow-2xl hover:scale-105 transition-all text-lg font-semibold"
                >
                  <span>View My Work</span>
                  <ExternalLink
                    size={20}
                    className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"
                  />
                </button>
                <button
                  onClick={() => scrollToSection("contact")}
                  className="flex items-center gap-2 bg-white border-2 border-stone-900 text-stone-900 px-8 py-4 rounded-full hover:bg-stone-900 hover:text-white transition-all text-lg font-semibold"
                >
                  <Mail size={20} />
                  <span>Contact Me</span>
                </button>
              </div>
            </div>

            <div className="relative">
              <div className="relative w-80 h-80 mx-auto">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full blur-xl opacity-50 animate-pulse" />
                <img
                  src="https://f005.backblazeb2.com/file/onestopmp3pi/embed_1761476687380_9703fc4232a30f09.jpg"
                  alt="Kent Sevillejo"
                  className="relative w-full h-full object-cover rounded-full border-4 border-white shadow-2xl"
                />
              </div>

              <div className="absolute top-0 -left-4 bg-white p-4 rounded-2xl shadow-xl animate-pulse">
                <div className="text-3xl font-bold text-amber-600">15+</div>
                <div className="text-sm text-stone-600">Years Experience</div>
              </div>

              <div
                className="absolute top-20 -right-4 bg-white p-4 rounded-2xl shadow-xl animate-pulse"
                style={{ animationDelay: "1s" }}
              >
                <div className="text-3xl font-bold text-amber-600">280+</div>
                <div className="text-sm text-stone-600">Projects Delivered</div>
              </div>

              <div
                className="absolute bottom-20 -left-4 bg-white p-4 rounded-2xl shadow-xl animate-pulse"
                style={{ animationDelay: "2s" }}
              >
                <div className="text-3xl font-bold text-amber-600">99%</div>
                <div className="text-sm text-stone-600">
                  Client Satisfaction
                </div>
              </div>

              <div
                className="absolute bottom-0 -right-4 bg-white p-4 rounded-2xl shadow-xl animate-pulse"
                style={{ animationDelay: "3s" }}
              >
                <div className="text-3xl font-bold text-amber-600">50</div>
                <div className="text-sm text-stone-600">Clients Worldwide</div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown size={32} className="text-amber-600" />
        </div>
      </section>

      {/* Copy ALL remaining sections from your document exactly as they are */}
      {/* I'll include the closing tags */}

    </div>
  );
};

export default Portfolio;