import React, { useState, useEffect, useRef } from "react";
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
            <div className="text-2xl font-bold">
              <span className="bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent">
                Kent Sevillejo
              </span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-1 lg:space-x-6">
              {[
                "Home",
                "About",
                "Tech Stack",
                "Projects",
                "Work",
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
                "Testimonials",
                "Contact",
              ].map((item) => (
                <button
                  key={item}
                  onClick={() =>
                    scrollToSection(item.toLowerCase().replace(" ", ""))
                  }
                  className="block w-full text-left text-stone-600 hover:text-amber-600"
                >
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

      {/* About Section */}
      <section id="about" className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-amber-100 text-amber-900 rounded-full text-sm font-semibold mb-4">
              About Me
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Crafting Meaningful Brands &<br />
              Intuitive Experiences
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <p className="text-lg text-stone-600 leading-relaxed">
                I'm Kent, a UI/UX and brand designer passionate about creating
                visually compelling and user-friendly digital experiences.
              </p>
              <p className="text-lg text-stone-600 leading-relaxed">
                With a keen eye for aesthetics and a deep understanding of user
                behavior, I design brands and interfaces that not only look
                great but also resonate with audiences.
              </p>
              <p className="text-lg text-stone-600 leading-relaxed">
                Whether it's building a brand identity from the ground up or
                refining a digital product for seamless usability, I blend
                strategy, creativity, and functionality to bring ideas to life.
              </p>
              <p className="text-lg font-semibold text-amber-600">
                Let's collaborate and make something extraordinary.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {[
                {
                  icon: Layout,
                  title: "User-Centered Design",
                  desc: "Intuitive interfaces tailored for your audience",
                },
                {
                  icon: Award,
                  title: "Brand Identity",
                  desc: "Unique brand strategies that stand out",
                },
                {
                  icon: Code,
                  title: "Responsive & Modern UI",
                  desc: "Optimized for all devices",
                },
                {
                  icon: Wrench,
                  title: "Seamless Prototyping",
                  desc: "Bring ideas to life before development",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="p-6 bg-stone-50 rounded-2xl hover:bg-amber-50 hover:scale-105 transition-all group"
                >
                  <item.icon className="w-12 h-12 text-amber-600 mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-stone-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-16">
            <h3 className="text-2xl font-bold mb-6 text-center">
              GitHub Contributions
            </h3>
            <div className="bg-stone-50 p-6 rounded-2xl">
              <img
                src="https://ghchart.rshah.org/409775/devchollo"
                alt="Kent's GitHub Contributions"
                className="w-full rounded-lg"
              />
              <div className="flex justify-center gap-8 mt-6">
                <a
                  href="https://github.com/devchollo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-amber-600 hover:text-amber-700 font-semibold"
                >
                  <Github size={20} />
                  <span>View GitHub Profile</span>
                  <ExternalLink size={16} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section
        id="techstack"
        className="py-20 px-4 bg-stone-900 relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(rgba(251, 191, 36, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(251, 191, 36, 0.3) 1px, transparent 1px)",
              backgroundSize: "50px 50px",
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-amber-600/20 text-amber-400 rounded-full text-sm font-semibold mb-4">
              My Arsenal
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
              Tech Stack & Skills
            </h2>
            <p className="text-lg text-stone-400 max-w-2xl mx-auto">
              Cutting-edge technologies I use to craft exceptional digital
              experiences
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {[
              "All",
              "Frontend",
              "Backend",
              "Database",
              "Cloud",
              "CMS",
              "Tools",
            ].map((filter) => (
              <button
                key={filter}
                onClick={() => setTechFilter(filter)}
                className={`px-6 py-3 rounded-full font-semibold transition-all ${
                  techFilter === filter
                    ? "bg-gradient-to-r from-amber-600 to-orange-500 text-white shadow-lg shadow-amber-500/50 scale-105"
                    : "bg-stone-800 text-stone-300 hover:bg-stone-700 border border-stone-700"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {filteredTech.map((tech, idx) => {
              const Icon = tech.icon;
              return (
                <div
                  key={idx}
                  className="group relative bg-stone-800/50 backdrop-blur-sm border border-stone-700/50 rounded-2xl p-6 hover:border-amber-500/50 transition-all duration-500 hover:scale-105 hover:shadow-xl hover:shadow-amber-500/20 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 via-orange-500/0 to-amber-500/0 group-hover:from-amber-500/10 group-hover:via-orange-500/5 group-hover:to-amber-500/10 rounded-2xl transition-all duration-500" />

                  <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="w-12 h-12 mb-3 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                      <Icon className="w-6 h-6 text-amber-400" />
                    </div>

                    <h3 className="font-bold text-sm text-white mb-2 group-hover:text-amber-400 transition-colors">
                      {tech.name}
                    </h3>

                    <div className="relative w-16 h-16 mb-2">
                      <svg className="transform -rotate-90 w-16 h-16">
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                          className="text-stone-700"
                        />
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          stroke="url(#gradient)"
                          strokeWidth="4"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 28}`}
                          strokeDashoffset={`${
                            2 * Math.PI * 28 * (1 - tech.level / 100)
                          }`}
                          className="transition-all duration-1000 drop-shadow-lg"
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-amber-400">
                        {tech.level}%
                      </span>
                      <defs>
                        <linearGradient
                          id="gradient"
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="100%"
                        >
                          <stop offset="0%" stopColor="#f59e0b" />
                          <stop offset="100%" stopColor="#f97316" />
                        </linearGradient>
                      </defs>
                    </div>

                    <span className="text-xs text-stone-500 font-medium">
                      {tech.category}
                    </span>
                  </div>

                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent transform translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000" />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid md:grid-cols-4 gap-6 mt-16">
            {[
              { label: "Technologies Mastered", value: "18+" },
              { label: "Years of Experience", value: "15+" },
              { label: "Projects Completed", value: "280+" },
              { label: "Client Satisfaction", value: "99%" },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="bg-stone-800/50 backdrop-blur-sm border border-stone-700/50 rounded-2xl p-6 text-center"
              >
                <div className="text-4xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-stone-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="py-20 px-4 bg-stone-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-amber-600/20 text-amber-400 rounded-full text-sm font-semibold mb-4">
              Portfolio
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Featured Projects
            </h2>
            <p className="text-lg text-stone-400 max-w-2xl mx-auto">
              Explore my recent work and discover how I transform visions into
              reality
            </p>
          </div>

          <div className="relative mb-12">
            <div
              className="overflow-hidden rounded-3xl"
              {...projectSwipeHandlers}
            >
              {projects.map((project, idx) => (
                <div
                  key={project.id}
                  className={`transition-all duration-700 ${
                    idx === activeProject
                      ? "opacity-100 relative"
                      : "opacity-0 absolute inset-0"
                  }`}
                >
                  <div className="grid md:grid-cols-2 gap-8 bg-stone-800 rounded-3xl overflow-hidden">
                    <div className="relative h-96 md:h-auto overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-900 to-transparent z-10" />
                      <img
                        src={project.image}
                        alt={project.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    </div>
                    <div className="p-8 md:p-12 flex flex-col justify-center">
                      <div className="flex gap-3 mb-4">
                        <span className="px-3 py-1 bg-amber-600/20 text-amber-400 rounded-full text-sm">
                          {project.year}
                        </span>
                        <span className="px-3 py-1 bg-stone-700 text-stone-300 rounded-full text-sm">
                          {project.category}
                        </span>
                      </div>
                      <h3 className="text-3xl font-bold mb-4">
                        {project.title}
                      </h3>
                      <p className="text-stone-400 mb-6 text-lg">
                        {project.description}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-6">
                        {project.tech.map((t) => (
                          <span
                            key={t}
                            className="px-4 py-2 bg-stone-700 rounded-full text-sm"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                      <a
                        href={project.link}
                        target="_blank"
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-500 text-white px-6 py-3 rounded-full hover:shadow-2xl hover:scale-105 transition-all w-fit font-semibold z-40"
                      >
                        <span>View Project</span>
                        <ExternalLink size={18} />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center gap-3 mt-8">
              {projects.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveProject(idx)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    idx === activeProject
                      ? "bg-amber-500 w-8"
                      : "bg-stone-600 hover:bg-stone-500"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="mt-16">
            <button
              onClick={() => setShowAllProjects(!showAllProjects)}
              className="flex items-center justify-center gap-3 mx-auto bg-stone-800 hover:bg-stone-700 px-8 py-4 rounded-full transition-all group"
            >
              <span className="text-lg font-semibold">
                {showAllProjects ? "Hide All Projects" : "View All Projects"}
              </span>
              <ChevronDown
                size={20}
                className={`transition-transform duration-300 ${
                  showAllProjects ? "rotate-180" : ""
                }`}
              />
            </button>

            <div
              className={`overflow-hidden transition-all duration-500 ${
                showAllProjects
                  ? "max-h-[10000px] opacity-100 mt-12"
                  : "max-h-0 opacity-0"
              }`}
            >
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {allProjects.map((project) => (
                  <div
                    key={project.id}
                    className="bg-stone-800 rounded-2xl overflow-hidden hover:scale-105 transition-all duration-300 group"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-900 to-transparent z-10" />
                      <img
                        src={project.image}
                        alt={project.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold mb-2">
                        {project.title}
                      </h3>
                      <p className="text-stone-400 text-sm mb-4 line-clamp-2">
                        {project.description}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {project.tech.slice(0, 3).map((t) => (
                          <span
                            key={t}
                            className="px-3 py-1 bg-stone-700 rounded-full text-xs"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                      <a
                        href={project.link}
                        target="_blank"
                        className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 font-semibold group"
                      >
                        <span>View Project</span>
                        <ExternalLink
                          size={16}
                          className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"
                        />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Work History Section */}
      <section id="work" className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-amber-100 text-amber-900 rounded-full text-sm font-semibold mb-4">
              Experience
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Work History
            </h2>
            <p className="text-lg text-stone-600 max-w-2xl mx-auto">
              My professional journey and the impact I've made
            </p>
          </div>

          <div className="space-y-8">
            {workHistory.map((job, idx) => (
              <div
                key={idx}
                className="group bg-stone-50 p-8 rounded-3xl hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 hover:shadow-2xl transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Briefcase className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div className="flex-grow">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-bold mb-1">{job.role}</h3>
                        <p className="text-lg text-amber-600 font-semibold">
                          {job.company}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-stone-600 mt-2 md:mt-0">
                        <Calendar size={18} />
                        <span className="font-medium">{job.period}</span>
                      </div>
                    </div>
                    <p className="text-stone-600 mb-4 text-lg">
                      {job.description}
                    </p>
                    <div className="space-y-2">
                      <p className="font-semibold text-stone-900">
                        Key Achievements:
                      </p>
                      <ul className="grid md:grid-cols-3 gap-3">
                        {job.achievements.map((achievement, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-stone-600"
                          >
                            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0" />
                            <span>{achievement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 bg-stone-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-amber-100 text-amber-900 rounded-full text-sm font-semibold mb-4">
              Testimonials
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              What Clients Say
            </h2>
            <p className="text-lg text-stone-600 max-w-2xl mx-auto mb-6">
              Trusted by companies already building their websites with
              excellence
            </p>

            {testimonialStats.totalCount > 0 && (
              <div className="flex flex-wrap justify-center gap-6 mb-8">
                <div className="flex items-center gap-2 bg-white px-6 py-3 rounded-full shadow-md">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className="w-5 h-5 text-amber-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="font-bold text-xl text-stone-900">
                    {testimonialStats.avgRating.toFixed(1)}
                  </span>
                  <span className="text-stone-600">Average Rating</span>
                </div>
                <div className="flex items-center gap-2 bg-white px-6 py-3 rounded-full shadow-md">
                  <Award className="w-5 h-5 text-amber-600" />
                  <span className="font-bold text-xl text-stone-900">
                    {testimonialStats.totalCount}
                  </span>
                  <span className="text-stone-600">Reviews</span>
                </div>
              </div>
            )}

            <button
              onClick={() => setIsTestimonialModalOpen(true)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-500 text-white px-6 py-3 rounded-full hover:shadow-xl hover:scale-105 transition-all font-semibold"
            >
              <Users size={20} />
              <span>Share Your Experience</span>
            </button>
          </div>

          {testimonialsLoading ? (
            <div className="text-center py-12">
              <div className="inline-block w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-stone-600 mt-4">Loading testimonials...</p>
            </div>
          ) : approvedTestimonials.length > 0 ? (
            <>
              <div
                className="relative max-w-4xl mx-auto"
                {...testimonialSwipeHandlers}
              >
                <div className="overflow-hidden">
                  {approvedTestimonials.map((testimonial, idx) => (
                    <div
                      key={testimonial._id || idx}
                      className={`transition-all duration-700 ${
                        idx === activeTestimonial
                          ? "opacity-100 relative"
                          : "opacity-0 absolute inset-0"
                      }`}
                    >
                      <div className="bg-white p-8 md:p-12 rounded-3xl shadow-2xl">
                        <div className="flex justify-center mb-6">
                          <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
                            <svg
                              className="w-8 h-8 text-white"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M6.5 10c-1.9 0-3.5 1.6-3.5 3.5S4.6 17 6.5 17 10 15.4 10 13.5 8.4 10 6.5 10zm0 5c-.8 0-1.5-.7-1.5-1.5S5.7 12 6.5 12s1.5.7 1.5 1.5S7.3 15 6.5 15zm11-5c-1.9 0-3.5 1.6-3.5 3.5s1.6 3.5 3.5 3.5 3.5-1.6 3.5-3.5-1.6-3.5-3.5-3.5zm0 5c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5z" />
                            </svg>
                          </div>
                        </div>

                        <div className="flex justify-center gap-1 mb-6">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`w-6 h-6 ${
                                i < testimonial.rating
                                  ? "text-amber-500"
                                  : "text-stone-300"
                              }`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>

                        <p className="text-xl text-stone-700 mb-8 italic leading-relaxed text-center">
                          "{testimonial.message}"
                        </p>

                        <div className="text-center border-t border-stone-200 pt-6">
                          <p className="font-bold text-lg text-stone-900">
                            {testimonial.name}
                          </p>
                          {testimonial.role && (
                            <p className="text-amber-600 font-medium">
                              {testimonial.role}
                            </p>
                          )}
                          {testimonial.company && (
                            <p className="text-stone-500 text-sm">
                              {testimonial.company}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {approvedTestimonials.length > 1 && (
                  <div className="flex justify-center gap-3 mt-8">
                    {approvedTestimonials.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveTestimonial(idx)}
                        className={`w-3 h-3 rounded-full transition-all ${
                          idx === activeTestimonial
                            ? "bg-amber-500 w-8"
                            : "bg-stone-300 hover:bg-stone-400"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="max-w-2xl mx-auto">
              <div className="bg-white p-12 rounded-3xl shadow-xl text-center border-2 border-dashed border-stone-200">
                <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="w-10 h-10 text-amber-600" />
                </div>
                <h3 className="text-2xl font-bold text-stone-900 mb-3">
                  No Reviews Yet
                </h3>
                <p className="text-stone-600 mb-8 text-lg">
                  Be the first to share your experience working with Kent!
                  <br />
                  Your feedback helps others and contributes to continuous
                  improvement.
                </p>
                <button
                  onClick={() => setIsTestimonialModalOpen(true)}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-500 text-white px-8 py-4 rounded-full hover:shadow-xl hover:scale-105 transition-all font-semibold"
                >
                  <Users size={20} />
                  <span>Write the First Review</span>
                </button>
              </div>
            </div>
          )}

          <div className="mt-16">
            <p className="text-center text-stone-600 mb-8">
              Trusted by companies building excellent websites
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 opacity-50">
              {companyLogos.map((company, idx) => (
                <a
                  key={idx}
                  href={company.url}
                  target={company.url !== "#" ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className="flex items-center justify-center p-6 bg-white rounded-2xl hover:opacity-100 transition-opacity group"
                >
                  {company.logo ? (
                    <div style="display: flex; flex-direction: column; row-gap: 10px; align-items: center; justify-content: center;">
                      <img
                        src={company.logo}
                        alt={company.name}
                        className="max-w-full h-12 object-contain group-hover:scale-110 transition-transform"
                      />
                      <span className="text-sm font-medium text-stone-400 group-hover:text-stone-600 transition-colors text-center">
                        {company.name}
                      </span>
                    </div>
                  ) : (
                    <span className="text-lg font-semibold text-stone-400 group-hover:text-stone-600 transition-colors">
                      {company.name}
                    </span>
                  )}
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-4 bg-stone-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-amber-600/20 text-amber-400 rounded-full text-sm font-semibold mb-4">
              Get In Touch
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Let's Work Together
            </h2>
            <p className="text-lg text-stone-400 max-w-2xl mx-auto">
              Have a project in mind? Let's create something extraordinary
              together
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-stone-800 p-8 rounded-3xl">
              <h3 className="text-2xl font-bold mb-6">Send Me a Message</h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-stone-700 border border-stone-600 rounded-xl focus:outline-none focus:border-amber-500 transition-colors"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Your Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-stone-700 border border-stone-600 rounded-xl focus:outline-none focus:border-amber-500 transition-colors"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Your Message
                  </label>
                  <textarea
                    required
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    rows="5"
                    className="w-full px-4 py-3 bg-stone-700 border border-stone-600 rounded-xl focus:outline-none focus:border-amber-500 transition-colors resize-none"
                    placeholder="Tell me about your project..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-amber-600 to-orange-500 text-white py-4 rounded-xl font-semibold hover:shadow-2xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Sending..." : "Send Message"}
                </button>
                {submitStatus === "success" && (
                  <p className="text-green-400 text-center">
                    Message sent successfully!
                  </p>
                )}
                {submitStatus === "error" && (
                  <p className="text-red-400 text-center">
                    Failed to send message. Please try again.
                  </p>
                )}
              </form>
            </div>

            <div className="space-y-8">
              <div className="space-y-6">
                <div className="flex items-start gap-4 p-6 bg-stone-800 rounded-2xl hover:bg-stone-750 transition-colors">
                  <div className="w-12 h-12 bg-amber-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Email</p>
                    <a
                      href="mailto:devchollo@gmail.com"
                      className="text-amber-400 hover:text-amber-300"
                    >
                      devchollo@gmail.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-6 bg-stone-800 rounded-2xl hover:bg-stone-750 transition-colors">
                  <div className="w-12 h-12 bg-amber-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Phone className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Phone</p>
                    <a
                      href="tel:+639959625392"
                      className="text-amber-400 hover:text-amber-300"
                    >
                      +63 995 962 5392
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-6 bg-stone-800 rounded-2xl hover:bg-stone-750 transition-colors">
                  <div className="w-12 h-12 bg-amber-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Location</p>
                    <p className="text-stone-400">
                      Naga City, Cebu, Philippines
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <a
                    href="https://github.com/devchollo"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 bg-stone-800 rounded-xl flex items-center justify-center hover:bg-amber-600 transition-colors"
                  >
                    <Github size={20} />
                  </a>
                  <a
                    href="https://www.linkedin.com/in/kent-johndear-sevillejo-90455b2a5/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 bg-stone-800 rounded-xl flex items-center justify-center hover:bg-amber-600 transition-colors"
                  >
                    <Linkedin size={20} />
                  </a>
                </div>
              </div>

              <div className="bg-stone-800 p-4 rounded-3xl overflow-hidden">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d31409.86983672147!2d123.75079427614921!3d10.242724034158591!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33a978201b812a71%3A0x139cddc712bcdf1e!2sInayagan%2C%20Naga%2C%20Cebu!5e0!3m2!1sen!2sph!4v1761476849154!5m2!1sen!2sph"
                  width="100%"
                  height="300"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  className="rounded-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-8 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-stone-400">
            © 2025 Kent Sevillejo. All rights reserved. Crafted with passion and
            precision.
          </p>
        </div>
      </footer>

      {/* Testimonial Submission Modal */}
      {isTestimonialModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-3xl font-bold text-stone-900 mb-2">
                    Share Your Experience
                  </h3>
                  <p className="text-stone-600">
                    Your feedback helps me improve and grow
                  </p>
                </div>
                <button
                  onClick={() => setIsTestimonialModalOpen(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-stone-100 transition-colors"
                >
                  <X size={24} className="text-stone-600" />
                </button>
              </div>

              <form onSubmit={handleTestimonialSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-stone-900 mb-3">
                    Your Rating *
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() =>
                          setTestimonialForm({
                            ...testimonialForm,
                            rating: star,
                          })
                        }
                        className="transition-all hover:scale-110"
                      >
                        <svg
                          className={`w-10 h-10 ${
                            star <= testimonialForm.rating
                              ? "text-amber-500"
                              : "text-stone-300"
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-stone-900 mb-2">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={testimonialForm.name}
                    onChange={(e) =>
                      setTestimonialForm({
                        ...testimonialForm,
                        name: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 bg-stone-50 border-2 border-stone-200 rounded-xl focus:outline-none focus:border-amber-500 transition-colors"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-stone-900 mb-2">
                    Your Email *{" "}
                    <span className="text-xs text-stone-500 font-normal">
                      (For internal use only, won't be displayed)
                    </span>
                  </label>
                  <input
                    type="email"
                    required
                    value={testimonialForm.email}
                    onChange={(e) =>
                      setTestimonialForm({
                        ...testimonialForm,
                        email: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 bg-stone-50 border-2 border-stone-200 rounded-xl focus:outline-none focus:border-amber-500 transition-colors"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-stone-900 mb-2">
                    Company{" "}
                    <span className="text-stone-400 font-normal">
                      (Optional)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={testimonialForm.company}
                    onChange={(e) =>
                      setTestimonialForm({
                        ...testimonialForm,
                        company: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 bg-stone-50 border-2 border-stone-200 rounded-xl focus:outline-none focus:border-amber-500 transition-colors"
                    placeholder="Acme Inc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-stone-900 mb-2">
                    Your Role{" "}
                    <span className="text-stone-400 font-normal">
                      (Optional)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={testimonialForm.role}
                    onChange={(e) =>
                      setTestimonialForm({
                        ...testimonialForm,
                        role: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 bg-stone-50 border-2 border-stone-200 rounded-xl focus:outline-none focus:border-amber-500 transition-colors"
                    placeholder="CEO, Product Manager, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-stone-900 mb-2">
                    Your Review *
                  </label>
                  <textarea
                    required
                    value={testimonialForm.message}
                    onChange={(e) =>
                      setTestimonialForm({
                        ...testimonialForm,
                        message: e.target.value,
                      })
                    }
                    rows="5"
                    className="w-full px-4 py-3 bg-stone-50 border-2 border-stone-200 rounded-xl focus:outline-none focus:border-amber-500 transition-colors resize-none"
                    placeholder="Share your experience working with Kent..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={testimonialSubmitting}
                  className="w-full bg-gradient-to-r from-amber-600 to-orange-500 text-white py-4 rounded-xl font-semibold hover:shadow-2xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {testimonialSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Users size={20} />
                      <span>Submit Review</span>
                    </>
                  )}
                </button>

                {testimonialStatus === "success" && (
                  <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl text-green-800 text-center font-medium">
                    ✓ Thank you! Your review has been submitted and is pending
                    approval.
                  </div>
                )}
                {testimonialStatus === "error" && (
                  <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-800 text-center font-medium">
                    ✗ Something went wrong. Please try again later.
                  </div>
                )}

                <p className="text-xs text-stone-500 text-center">
                  Your review will be reviewed and approved before being
                  displayed publicly.
                </p>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Portfolio;
