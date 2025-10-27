import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthOverlay from '../components/AuthOverlay';

const HomePage = () => {
  const [showAuthOverlay, setShowAuthOverlay] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setIsVisible(true);
    // Check if user is already authenticated
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogoClick = (e) => {
    // If user is authenticated, redirect to feed instead of staying on homepage
    if (user) {
      e.preventDefault();
      navigate('/feed');
    }
  };

  const handleGetStartedClick = () => {
    // If user is authenticated, redirect to feed
    if (user) {
      navigate('/feed');
    } else {
      setShowAuthOverlay(true);
    }
  };

  const features = [
    {
      icon: "🔍",
      title: "Plant Identification",
      description: "Identify any plant instantly with our advanced AI-powered recognition system. Just snap a photo and get detailed information about your plant."
    },
    {
      icon: "🌱",
      title: "Plant Care Guide",
      description: "Get personalized care instructions for your plants. Learn about watering, sunlight, soil, and maintenance tips."
    },
    {
      icon: "👥",
      title: "Community",
      description: "Connect with fellow plant enthusiasts. Share your plant journey, ask questions, and learn from experienced gardeners."
    },
    {
      icon: "📊",
      title: "Plant Health Monitoring",
      description: "Track your plant's health and growth progress. Get alerts for watering, fertilizing, and potential issues."
    },
    {
      icon: "🌍",
      title: "Environmental Impact",
      description: "Contribute to environmental conservation. Learn about sustainable gardening and eco-friendly practices."
    },
    {
      icon: "📱",
      title: "Mobile First",
      description: "Access GreenGuard anywhere, anytime. Our mobile-optimized platform works seamlessly on all devices."
    }
  ];

  const stats = [
    { number: "10K+", label: "Plants Identified" },
    { number: "5K+", label: "Active Users" },
    { number: "50K+", label: "Plant Photos" },
    { number: "100+", label: "Plant Species" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2" onClick={handleLogoClick}>
              <div className="text-2xl">🌱</div>
              <span className="text-xl font-bold text-green-800">GreenGuard</span>
            </Link>
            <button
              onClick={handleGetStartedClick}
              className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors font-medium"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-20">
          <div className="text-center">
            <div className={`transform transition-all duration-1000 ease-out ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`}>
              <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
                Welcome to{' '}
                <span className="bg-gradient-to-r from-emerald-600 to-green-700 bg-clip-text text-transparent">
                  GreenGuard
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
                Your ultimate companion for plant identification, care, and community. 
                Discover, learn, and grow with nature's finest.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={handleGetStartedClick}
                  className="bg-emerald-600 text-white px-8 py-4 rounded-xl hover:bg-emerald-700 transition-all duration-300 transform hover:scale-105 font-semibold text-lg shadow-lg"
                >
                  Start Your Plant Journey
                </button>
                <button className="border-2 border-emerald-600 text-emerald-600 px-8 py-4 rounded-xl hover:bg-emerald-600 hover:text-white transition-all duration-300 font-semibold text-lg">
                  Learn More
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-8 h-8 opacity-20 animate-float">
          <div className="w-full h-full bg-emerald-400 rounded-full"></div>
        </div>
        <div className="absolute top-40 right-20 w-6 h-6 opacity-30 animate-float" style={{animationDelay: '1s'}}>
          <div className="w-full h-full bg-green-400 rounded-full"></div>
        </div>
        <div className="absolute bottom-20 left-1/4 w-10 h-10 opacity-25 animate-float" style={{animationDelay: '2s'}}>
          <div className="w-full h-full bg-teal-400 rounded-full"></div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className={`text-center transform transition-all duration-700 ease-out ${
                  isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                }`}
                style={{transitionDelay: `${index * 100}ms`}}
              >
                <div className="text-4xl md:text-5xl font-bold text-emerald-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Why Choose GreenGuard?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We combine cutting-edge technology with community wisdom to create the ultimate plant care platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 ${
                  isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                }`}
                style={{transitionDelay: `${index * 150}ms`}}
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get started with GreenGuard in just three simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Sign Up",
                description: "Create your account and join our growing community of plant enthusiasts."
              },
              {
                step: "2",
                title: "Upload Photos",
                description: "Take photos of plants you want to identify or share with the community."
              },
              {
                step: "3",
                title: "Get Results",
                description: "Receive instant identification and care tips for your plants."
              }
            ].map((item, index) => (
              <div
                key={index}
                className={`text-center transform transition-all duration-700 ease-out ${
                  isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                }`}
                style={{transitionDelay: `${index * 200}ms`}}
              >
                <div className="w-16 h-16 bg-emerald-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-emerald-600 to-green-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 text-center">
          <div className={`transform transition-all duration-1000 ease-out ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Start Your Plant Journey?
            </h2>
            <p className="text-xl text-emerald-100 mb-8 max-w-3xl mx-auto">
              Join thousands of plant lovers who are already using GreenGuard to identify, 
              care for, and share their plants with the world.
            </p>
            <button
              onClick={handleGetStartedClick}
              className="bg-white text-emerald-600 px-8 py-4 rounded-xl hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 font-semibold text-lg shadow-lg"
            >
              Get Started Today
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="text-2xl">🌱</div>
                <span className="text-xl font-bold">GreenGuard</span>
              </div>
              <p className="text-gray-400">
                Your ultimate companion for plant identification, care, and community.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Features</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Plant Identification</li>
                <li>Care Guides</li>
                <li>Community</li>
                <li>Health Monitoring</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Help Center</li>
                <li>Contact Us</li>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Connect</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Twitter</li>
                <li>Instagram</li>
                <li>Facebook</li>
                <li>YouTube</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 GreenGuard. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Auth Overlay */}
      <AuthOverlay
        isOpen={showAuthOverlay}
        onClose={() => setShowAuthOverlay(false)}
        onLoginSuccess={(userData) => {
          setShowAuthOverlay(false);
          setUser(userData);
          // Redirect to feed after successful login
          navigate('/feed');
        }}
      />
    </div>
  );
};

export default HomePage;

