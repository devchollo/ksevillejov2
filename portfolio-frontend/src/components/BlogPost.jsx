import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Calendar,
  Heart,
  DollarSign,
  Users,
  Target,
  TrendingUp,
  ArrowLeft,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import MetaTags from "./MetaTags";
import CommentSection from "./CommentSection";
import mediumZoom from "medium-zoom"; // for image enlargement 

const BlogPost = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [donationStats, setDonationStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [donationAmount, setDonationAmount] = useState("");
  const [donorInfo, setDonorInfo] = useState({
    name: "",
    email: "",
    message: "",
    isAnonymous: false,
    notifyOnUpdates: true,
  });
  const [paypalLoaded, setPaypalLoaded] = useState(false);
  const [paypalError, setPaypalError] = useState(null);
  const [donationStatus, setDonationStatus] = useState("");
  const paypalButtonRendered = useRef(false);
  const paypalScriptLoading = useRef(false);
  const [paymentMode, setPaymentMode] = useState("paypal");
  const [gcashReference, setGcashReference] = useState("");

  useEffect(() => {
    fetchPost();
  }, [slug]);

  // ✅ Apply zoom to images in post content
  useEffect(() => {
    if (!post) return;
    const zoom = mediumZoom(".prose img", {
      background: "rgba(0,0,0,0.8)",
      margin: 24,
    });
    return () => zoom.detach(); // cleanup
  }, [post]);
  
  useEffect(() => {
    if (
      post &&
      post.isDonationDrive &&
      !paypalLoaded &&
      !paypalScriptLoading.current
    ) {
      loadPayPalScript();
    }
  }, [post, paypalLoaded]);

  useEffect(() => {
    const shouldRenderButton =
      paypalLoaded &&
      donationAmount &&
      parseFloat(donationAmount) >= 1 &&
      donorInfo.email &&
      !paypalError;

    if (shouldRenderButton && !paypalButtonRendered.current) {
      setTimeout(() => {
        if (!paypalButtonRendered.current) {
          renderPayPalButton();
        }
      }, 100);
    } else if (!shouldRenderButton && paypalButtonRendered.current) {
      const container = document.getElementById("paypal-button-container");
      if (container) {
        container.innerHTML = "";
        paypalButtonRendered.current = false;
      }
    }
  }, [paypalLoaded, donationAmount, donorInfo.email, paypalError]);

  const fetchPost = async () => {
    try {
      const response = await fetch(
        `https://ksevillejov2.onrender.com/api/blog/posts/${slug}`
      );
      const data = await response.json();
      if (data.success) {
        setPost(data.post);
        setDonationStats(data.donationStats);
      }
    } catch (error) {
      console.error("Failed to fetch post:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadPayPalScript = () => {
    if (window.paypal && window.paypal.Buttons) {
      setPaypalLoaded(true);
      return;
    }
    if (paypalScriptLoading.current) return;

    const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;
    if (!clientId || clientId === "undefined") {
      setPaypalError(
        "PayPal Client ID not configured. Please contact support."
      );
      return;
    }

    const currency = post?.donationCurrency || "PHP";
    paypalScriptLoading.current = true;

    const existingScript = document.querySelector(
      'script[src*="paypal.com/sdk/js"]'
    );
    if (existingScript) existingScript.remove();

    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}&intent=capture&vault=false&commit=true`;
    script.async = true;

    script.onload = () => {
      if (window.paypal && window.paypal.Buttons) {
        setPaypalLoaded(true);
        setPaypalError(null);
        paypalScriptLoading.current = false;
      }
    };

    script.onerror = () => {
      setPaypalError("Failed to load PayPal. Please refresh the page.");
      setPaypalLoaded(false);
      paypalScriptLoading.current = false;
    };

    document.body.appendChild(script);
  };

  const renderPayPalButton = () => {
    if (paypalButtonRendered.current) return;

    const container = document.getElementById("paypal-button-container");
    if (!container || !window.paypal || !window.paypal.Buttons) return;

    container.innerHTML = "";
    paypalButtonRendered.current = true;

    try {
      const buttons = window.paypal.Buttons({
        style: {
          layout: "vertical",
          color: "gold",
          shape: "rect",
          label: "donate",
          height: 45,
        },
        createOrder: (data, actions) => {
          const amount = parseFloat(donationAmount).toFixed(2);
          return actions.order.create({
            purchase_units: [
              {
                amount: {
                  value: amount,
                  currency_code: post.donationCurrency,
                },
                description: `Donation to ${post.title}`,
                custom_id: `${slug}-${Date.now()}`,
              },
            ],
            application_context: {
              shipping_preference: "NO_SHIPPING",
              brand_name: "Kent Sevillejo Donations",
              user_action: "PAY_NOW",
            },
          });
        },
        onApprove: async (data, actions) => {
          setDonationStatus("processing");
          try {
            const details = await actions.order.capture();
            await handleDonationSuccess(details);
          } catch (error) {
            setDonationStatus("error");
            setPaypalError(`Payment capture failed: ${error.message}`);
          }
        },
        onCancel: () => setDonationStatus(""),
        onError: (err) => {
          setDonationStatus("error");
          setPaypalError(`Payment failed: ${err.message || "Unknown error"}`);
        },
      });

      buttons.render(container).catch((error) => {
        setPaypalError(`Failed to render button: ${error.message}`);
        paypalButtonRendered.current = false;
      });
    } catch (error) {
      setPaypalError(`Critical error: ${error.message}`);
      paypalButtonRendered.current = false;
    }
  };

  const handleDonationSuccess = async (paypalDetails) => {
    try {
      const donationData = {
        blogPostSlug: slug,
        donorName: donorInfo.isAnonymous
          ? "Anonymous"
          : donorInfo.name || "Anonymous",
        donorEmail: donorInfo.email,
        amount: parseFloat(donationAmount),
        message: donorInfo.message,
        isAnonymous: donorInfo.isAnonymous,
        notifyOnUpdates: donorInfo.notifyOnUpdates,
        paypalOrderId: paypalDetails.id,
        paypalTransactionId:
          paypalDetails.purchase_units[0].payments.captures[0].id,
      };

      const response = await fetch(
        "https://ksevillejov2.onrender.com/api/donations",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(donationData),
        }
      );

      const result = await response.json();
      if (result.success) {
        setDonationStatus("success");
        setDonationAmount("");
        setDonorInfo({
          name: "",
          email: "",
          message: "",
          isAnonymous: false,
          notifyOnUpdates: true,
        });
        paypalButtonRendered.current = false;
        await fetchPost();
        setTimeout(() => {
          document
            .getElementById("donation-form")
            ?.scrollIntoView({ behavior: "smooth" });
        }, 500);
      } else {
        throw new Error(result.error || "Failed to record donation");
      }
    } catch (error) {
      setDonationStatus("error");
      setPaypalError(`Payment received but recording failed: ${error.message}`);
    }
  };

  const handleGCashSubmit = async () => {
    try {
      setDonationStatus("processing");
      const donationData = {
        blogPostSlug: slug,
        donorName: donorInfo.isAnonymous
          ? "Anonymous"
          : donorInfo.name || "Anonymous",
        donorEmail: donorInfo.email,
        amount: parseFloat(donationAmount),
        gcashReferenceNumber: gcashReference,
        message: donorInfo.message,
        isAnonymous: donorInfo.isAnonymous,
        notifyOnUpdates: donorInfo.notifyOnUpdates,
      };

      const response = await fetch(
        "https://ksevillejov2.onrender.com/api/donations/gcash",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(donationData),
        }
      );

      const result = await response.json();
      if (result.success) {
        setDonationStatus("success");
        setDonationAmount("");
        setGcashReference("");
        setDonorInfo({
          name: "",
          email: "",
          message: "",
          isAnonymous: false,
          notifyOnUpdates: true,
        });
        await fetchPost();
        setTimeout(() => {
          document
            .getElementById("donation-form")
            ?.scrollIntoView({ behavior: "smooth" });
        }, 500);
      } else {
        throw new Error(result.error || "Failed to submit donation");
      }
    } catch (error) {
      setDonationStatus("error");
      setPaypalError(`Failed to submit donation: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <MetaTags
          title="Loading..."
          description="Loading blog post..."
          url={`/blog/${slug}`}
        />
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-stone-600">Loading post...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <MetaTags
          title="Post Not Found"
          description="The requested blog post could not be found."
          url={`/blog/${slug}`}
        />
        <div className="text-center">
          <h1 className="text-3xl font-bold text-stone-900 mb-4">
            Post Not Found
          </h1>
          <button
            onClick={() => navigate("/blog")}
            className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 font-semibold"
          >
            <ArrowLeft size={20} />
            Back to Blog
          </button>
        </div>
      </div>
    );
  }

  const keywords = [
    post.category,
    post.isDonationDrive ? "donation drive" : null,
    post.isDonationDrive ? "charity" : null,
    post.isDonationDrive ? "fundraising" : null,
    "Kent Sevillejo",
    "blog",
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-stone-50">
      <MetaTags
        title={post.title}
        description={post.excerpt}
        image={post.featuredImage}
        url={`/blog/${post.slug}`}
        type="article"
        publishedTime={post.publishedAt}
        modifiedTime={post.updatedAt}
        keywords={keywords}
      />

      <nav className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <button
            onClick={() => navigate("/blog")}
            className="flex items-center gap-2 text-stone-700 hover:text-amber-600 font-semibold transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Blog
          </button>
          <button
            onClick={() => navigate("/")}
            className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent"
          >
            Kent Sevillejo
          </button>
        </div>
      </nav>

      <div className="py-12 px-4">
        <article className="max-w-4xl mx-auto">
          <header className="mb-8">
            <div className="flex flex-wrap items-center gap-4 text-sm text-stone-500 mb-4">
              <span className="flex items-center gap-1">
                <Calendar size={14} />
                {new Date(post.publishedAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              <span className="px-3 py-1 bg-stone-200 rounded-full capitalize">
                {post.category}
              </span>
              {post.isDonationDrive && (
                <span className="px-3 py-1 bg-amber-100 text-amber-900 rounded-full flex items-center gap-1 font-semibold">
                  <Heart size={14} />
                  Donation Drive
                </span>
              )}
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
              {post.title}
            </h1>
            <p className="text-xl text-stone-600 leading-relaxed">
              {post.excerpt}
            </p>
          </header>

          {post.isDonationDrive && donationStats && (
            <div className="bg-white rounded-3xl p-8 mb-8 shadow-xl border-2 border-amber-100">
              <h2 className="text-2xl font-bold mb-6 text-center">
                Campaign Progress
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-green-50 rounded-xl">
                  <div className="flex justify-center mb-2">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {post.donationCurrency}{" "}
                    {donationStats.totalDonations.toLocaleString()}
                  </div>
                  <div className="text-xs text-stone-600 mt-1">Raised</div>
                </div>

                <div className="text-center p-4 bg-blue-50 rounded-xl">
                  <div className="flex justify-center mb-2">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {post.donationCurrency}{" "}
                    {donationStats.totalExpenses.toLocaleString()}
                  </div>
                  <div className="text-xs text-stone-600 mt-1">Distributed</div>
                </div>

                <div className="text-center p-4 bg-amber-50 rounded-xl">
                  <div className="flex justify-center mb-2">
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                      <Target className="w-6 h-6 text-amber-600" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-amber-600">
                    {post.donationCurrency}{" "}
                    {donationStats.remainingBalance.toLocaleString()}
                  </div>
                  <div className="text-xs text-stone-600 mt-1">Remaining</div>
                </div>

                <div className="text-center p-4 bg-purple-50 rounded-xl">
                  <div className="flex justify-center mb-2">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-purple-600">
                    {donationStats.donorCount}
                  </div>
                  <div className="text-xs text-stone-600 mt-1">Donors</div>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex justify-between text-sm text-stone-600 mb-2">
                  <span className="font-semibold">Progress to Goal</span>
                  <span className="font-bold text-amber-600">
                    {donationStats.percentComplete}%
                  </span>
                </div>
                <div className="w-full h-4 bg-stone-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-600 to-orange-500 transition-all duration-500 rounded-full"
                    style={{
                      width: `${Math.min(100, donationStats.percentComplete)}%`,
                    }}
                  ></div>
                </div>
                <div className="text-right text-sm text-stone-500 mt-1">
                  Goal: {post.donationCurrency}{" "}
                  {post.donationGoal.toLocaleString()}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <button
                  onClick={() =>
                    document
                      .getElementById("donation-form")
                      .scrollIntoView({ behavior: "smooth" })
                  }
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-orange-500 text-white py-4 rounded-xl font-semibold hover:shadow-2xl hover:scale-105 transition-all"
                >
                  <Heart size={20} />
                  Donate Now
                </button>
                <button
                  onClick={() => navigate(`/transparency/${post.slug}`)}
                  className="flex items-center justify-center gap-2 bg-white border-2 border-stone-900 text-stone-900 py-4 rounded-xl font-semibold hover:bg-stone-900 hover:text-white transition-all"
                >
                  <ExternalLink size={20} />
                  View Transparency
                </button>
              </div>
            </div>
          )}

          {post.featuredImage && (
            <div className="mb-8 rounded-3xl overflow-hidden shadow-xl">
              <img
                src={post.featuredImage}
                alt={post.title}
                className="w-full h-auto"
              />
            </div>
          )}

          <div
            className="prose prose-lg prose-stone max-w-none mb-12 bg-white rounded-3xl p-8 md:p-12 shadow-xl
             prose-headings:font-bold prose-headings:text-stone-900
             prose-h1:text-4xl prose-h1:mb-6 prose-h1:mt-8
             prose-h2:text-3xl prose-h2:mb-4 prose-h2:mt-8
             prose-h3:text-2xl prose-h3:mb-3 prose-h3:mt-6
             prose-p:text-stone-700 prose-p:leading-relaxed prose-p:mb-4
             prose-a:text-amber-600 prose-a:no-underline prose-a:font-medium hover:prose-a:underline
             prose-strong:text-stone-900 prose-strong:font-bold
             prose-em:italic
             prose-ul:list-disc prose-ul:my-6 prose-ul:pl-6
             prose-ol:list-decimal prose-ol:my-6 prose-ol:pl-6
             prose-li:text-stone-700 prose-li:my-2
             prose-blockquote:border-l-4 prose-blockquote:border-amber-500 
             prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-stone-600 prose-blockquote:my-6
             prose-code:bg-stone-100 prose-code:text-amber-600 prose-code:px-2 prose-code:py-1 
             prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:before:content-[''] prose-code:after:content-['']
             prose-pre:bg-stone-900 prose-pre:text-stone-100 prose-pre:p-6 prose-pre:rounded-xl 
             prose-pre:overflow-x-auto prose-pre:my-6
             prose-img:rounded-2xl prose-img:shadow-lg prose-img:my-8
             prose-hr:border-stone-300 prose-hr:my-8"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {post.isDonationDrive && (
            <div
              id="donation-form"
              className="bg-gradient-to-br from-white to-amber-50 rounded-3xl p-8 md:p-12 shadow-2xl border-2 border-amber-100"
            >
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full mb-4">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-3">
                  Support This Cause
                </h2>
                <p className="text-stone-600 max-w-2xl mx-auto">
                  Your contribution makes a real difference. Every donation
                  helps us reach those in need.
                </p>
              </div>

              <div className="max-w-2xl mx-auto space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-stone-900 mb-3">
                    Select Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setPaymentMode("paypal")}
                      className={`py-4 px-6 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                        paymentMode === "paypal"
                          ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg scale-105"
                          : "bg-white text-stone-700 hover:bg-stone-50 border-2 border-stone-200"
                      }`}
                    >
                      <span className="text-2xl">💳</span>
                      PayPal
                    </button>
                    <button
                      onClick={() => setPaymentMode("gcash")}
                      className={`py-4 px-6 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                        paymentMode === "gcash"
                          ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg scale-105"
                          : "bg-white text-stone-700 hover:bg-stone-50 border-2 border-stone-200"
                      }`}
                    >
                      <span className="text-2xl">📱</span>
                      GCash
                    </button>
                  </div>
                </div>

                {paymentMode === "gcash" && (
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                    <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                      <span className="text-2xl">📱</span>
                      GCash Payment Instructions
                    </h3>
                    <ol className="space-y-2 text-sm text-blue-800 mb-4">
                      <li className="flex gap-2">
                        <span className="font-bold">1.</span>
                        <span>Open your GCash app</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="font-bold">2.</span>
                        <span>
                          Send to:{" "}
                          <strong className="font-mono bg-white px-2 py-0.5 rounded">
                            0995 962 5392
                          </strong>
                        </span>
                      </li>
                      <li className="flex gap-2">
                        <span className="font-bold">3.</span>
                        <span>
                          Amount:{" "}
                          <strong className="font-mono bg-white px-2 py-0.5 rounded">
                            PHP {donationAmount || "___"}
                          </strong>
                        </span>
                      </li>
                      <li className="flex gap-2">
                        <span className="font-bold">4.</span>
                        <span>
                          Copy the reference number from your transaction
                        </span>
                      </li>
                      <li className="flex gap-2">
                        <span className="font-bold">5.</span>
                        <span>Paste it in the form below and submit</span>
                      </li>
                    </ol>
                    <div className="bg-blue-100 rounded-lg p-3 text-xs text-blue-900">
                      <strong>⏱️ Verification Process:</strong> Your donation
                      will be verified within 24 hours. You'll receive an email
                      confirmation once approved.
                    </div>
                  </div>
                )}

                {paypalError && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-red-800 font-semibold mb-1">
                        Payment Error
                      </p>
                      <p className="text-red-700 text-sm">{paypalError}</p>
                      <button
                        onClick={() => window.location.reload()}
                        className="mt-2 text-xs text-red-600 underline hover:text-red-800"
                      >
                        Refresh Page
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-stone-900 mb-3">
                    Select Amount or Enter Custom
                  </label>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[100, 500, 1000, 2500, 5000, 10000].map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setDonationAmount(amount.toString())}
                        className={`py-3 rounded-xl font-semibold transition-all ${
                          donationAmount === amount.toString()
                            ? "bg-gradient-to-r from-amber-600 to-orange-500 text-white shadow-lg scale-105"
                            : "bg-white text-stone-700 hover:bg-stone-50 border-2 border-stone-200"
                        }`}
                      >
                        {post.donationCurrency} {amount.toLocaleString()}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    value={donationAmount}
                    onChange={(e) => setDonationAmount(e.target.value)}
                    placeholder="Enter custom amount"
                    min="1"
                    className="w-full px-4 py-3 bg-white border-2 border-stone-200 rounded-xl focus:outline-none focus:border-amber-500 transition-colors text-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-stone-900 mb-2">
                    Your Name{" "}
                    {!donorInfo.isAnonymous && (
                      <span className="text-red-500">*</span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={donorInfo.name}
                    onChange={(e) =>
                      setDonorInfo({ ...donorInfo, name: e.target.value })
                    }
                    disabled={donorInfo.isAnonymous}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 bg-white border-2 border-stone-200 rounded-xl focus:outline-none focus:border-amber-500 transition-colors disabled:bg-stone-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-stone-900 mb-2">
                    Your Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={donorInfo.email}
                    onChange={(e) =>
                      setDonorInfo({ ...donorInfo, email: e.target.value })
                    }
                    placeholder="john@example.com"
                    className="w-full px-4 py-3 bg-white border-2 border-stone-200 rounded-xl focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                {paymentMode === "gcash" && (
                  <div>
                    <label className="block text-sm font-semibold text-stone-900 mb-2">
                      GCash Reference Number{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={gcashReference}
                      onChange={(e) => setGcashReference(e.target.value)}
                      placeholder="e.g., 1234567890123"
                      className="w-full px-4 py-3 bg-white border-2 border-stone-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors font-mono"
                    />
                    <p className="text-xs text-stone-500 mt-1">
                      📝 Find this in your GCash transaction history after
                      sending the payment
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-stone-900 mb-2">
                    Message{" "}
                    <span className="text-stone-400 font-normal">
                      (Optional)
                    </span>
                  </label>
                  <textarea
                    value={donorInfo.message}
                    onChange={(e) =>
                      setDonorInfo({ ...donorInfo, message: e.target.value })
                    }
                    rows="3"
                    placeholder="Leave a message of support..."
                    className="w-full px-4 py-3 bg-white border-2 border-stone-200 rounded-xl focus:outline-none focus:border-amber-500 transition-colors resize-none"
                  />
                </div>

                <div className="space-y-3 bg-white rounded-xl p-4 border-2 border-stone-200">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={donorInfo.isAnonymous}
                      onChange={(e) =>
                        setDonorInfo({
                          ...donorInfo,
                          isAnonymous: e.target.checked,
                        })
                      }
                      className="mt-1 w-5 h-5 text-amber-600 rounded focus:ring-amber-500 cursor-pointer"
                    />
                    <span className="text-sm text-stone-700 group-hover:text-stone-900">
                      <strong>Donate Anonymously</strong>
                      <br />
                      <span className="text-stone-500">
                        Your name will not be displayed publicly
                      </span>
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={donorInfo.notifyOnUpdates}
                      onChange={(e) =>
                        setDonorInfo({
                          ...donorInfo,
                          notifyOnUpdates: e.target.checked,
                        })
                      }
                      className="mt-1 w-5 h-5 text-amber-600 rounded focus:ring-amber-500 cursor-pointer"
                    />
                    <span className="text-sm text-stone-700 group-hover:text-stone-900">
                      <strong>Notify me of updates</strong>
                      <br />
                      <span className="text-stone-500">
                        Receive email notifications when we post transparency
                        reports
                      </span>
                    </span>
                  </label>
                </div>

                {paymentMode === "paypal" ? (
                  donationAmount &&
                  parseFloat(donationAmount) >= 1 &&
                  donorInfo.email &&
                  !paypalError ? (
                    <div className="bg-white border-2 border-amber-200 rounded-xl p-6">
                      <p className="text-sm text-stone-600 mb-4 text-center">
                        <strong>
                          Complete your donation securely with PayPal
                        </strong>
                        <br />
                        <span className="text-xs text-stone-500">
                          You'll be redirected to PayPal to complete the payment
                        </span>
                      </p>
                      <div
                        id="paypal-button-container"
                        className="min-h-[45px]"
                      ></div>
                      {!paypalLoaded && !paypalError && (
                        <div className="text-center py-4">
                          <div className="inline-block w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                          <p className="text-sm text-stone-500">
                            Loading PayPal...
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6 text-center">
                      <p className="text-sm text-amber-900">
                        {paypalError
                          ? "⚠️ Payment system error - please refresh and try again"
                          : !donationAmount || parseFloat(donationAmount) < 1
                          ? "💡 Enter a donation amount of at least 1 to continue"
                          : "💡 Enter your email address to continue"}
                      </p>
                    </div>
                  )
                ) : (
                  <button
                    onClick={handleGCashSubmit}
                    disabled={
                      !donationAmount ||
                      !donorInfo.email ||
                      !gcashReference ||
                      gcashReference.length < 10
                    }
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-semibold hover:shadow-2xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                  >
                    <span className="text-xl">📱</span>
                    Submit GCash Donation
                  </button>
                )}

                {donationStatus === "processing" && (
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 text-center">
                    <div className="inline-block w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                    <p className="text-blue-800 font-semibold">
                      Processing your donation...
                    </p>
                  </div>
                )}

                {donationStatus === "success" && (
                  <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                      <svg
                        className="w-6 h-6 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <p className="text-green-800 font-bold text-lg mb-2">
                      Thank You! 🎉
                    </p>
                    <p className="text-green-700">
                      {paymentMode === "gcash"
                        ? "Your GCash donation has been submitted for verification. You'll receive an email confirmation within 24 hours."
                        : "Your donation has been received. You'll receive an email confirmation shortly."}
                    </p>
                  </div>
                )}

                {donationStatus === "error" && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-3">
                      <svg
                        className="w-6 h-6 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </div>
                    <p className="text-red-800 font-bold text-lg mb-2">
                      Something went wrong
                    </p>
                    <p className="text-red-700">
                      {paypalError || "Please try again or contact support."}
                    </p>
                  </div>
                )}

                <p className="text-xs text-stone-500 text-center">
                  🔒 Secure payment powered by{" "}
                  {paymentMode === "paypal" ? "PayPal" : "GCash"}. Your
                  information is encrypted and protected.
                  {paymentMode === "paypal" && (
                    <>
                      {" "}
                      Please note: PayPal deducts a small processing fee from
                      donations, so the amount we receive may be slightly less
                      than what you donate.
                    </>
                  )}
                </p>
              </div>
            </div>
          )}
        </article>

        <div className="mt-16">
          <CommentSection
            blogPostId={post._id}
            blogPostSlug={post.slug}
            commentType="blog"
          />
        </div>
      </div>

      <footer className="bg-stone-900 text-white py-8 px-4 mt-16">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-stone-400">
            © 2025 Kent Sevillejo. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default BlogPost;
