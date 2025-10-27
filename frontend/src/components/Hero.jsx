import React from 'react';

const Hero = ({ showMessage }) => {
  const handleStartJourney = () => {
    showMessage('Starting your GreenGuard journey! 🌱', 'success');
    // Scroll to explore section
    document.getElementById('explore')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleWatchDemo = () => {
    showMessage('Demo video coming soon! 🎥', 'info');
  };

  return (
    <section id="home" className="min-h-screen flex items-center justify-center text-center relative overflow-hidden pt-20">
      {/* Background decorative elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute bottom-32 right-32 w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full opacity-30 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-gradient-to-br from-lime-400 to-green-400 rounded-full opacity-25 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
      
      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <div className="mb-8">
          <div className="inline-block px-6 py-3 bg-white/20 backdrop-blur-sm rounded-full text-emerald-700 font-semibold mb-6">
            🌱 Join 50,000+ Earth Guardians
          </div>
        </div>
        
        <h1 className="hero-title text-6xl md:text-8xl font-bold font-display mb-6 leading-tight">
          Nurture Nature,<br />
          <span className="text-emerald-600">Together</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-12 leading-relaxed">
          Experience the future of environmental stewardship. Adopt, care for, and watch our planet flourish through immersive technology and community action.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
          <button 
            onClick={handleStartJourney}
            className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-full font-semibold text-lg hover:shadow-lg hover:shadow-emerald-200 hover:-translate-y-1 transition-all duration-300"
          >
            Start Your Journey
          </button>
                                               <button 
                     onClick={handleWatchDemo}
                     className="px-8 py-4 bg-white/80 text-emerald-700 rounded-full font-semibold text-lg hover:shadow-lg hover:shadow-emerald-100 hover:-translate-y-1 transition-all duration-300 flex items-center gap-3"
                   >
                     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                     </svg>
                     Watch Demo
                   </button>
        </div>
        
        <div className="flex justify-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-gray-600">3,254 Plants Adopted</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
            <span className="text-gray-600">1,028 Trees Planted</span>
          </div>
        </div>
      </div>
      
      {/* Floating particles */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="floating-particle particle-leaf" style={{ left: '15%', animationDelay: '0s' }}></div>
        <div className="floating-particle particle-leaf" style={{ left: '80%', animationDelay: '2s' }}></div>
        <div className="floating-particle particle-pollen" style={{ left: '25%', animationDelay: '4s' }}></div>
        <div className="floating-particle particle-leaf" style={{ left: '65%', animationDelay: '6s' }}></div>
        <div className="floating-particle particle-pollen" style={{ left: '45%', animationDelay: '8s' }}></div>
        <div className="floating-particle particle-sparkle" style={{ left: '85%', animationDelay: '10s' }}></div>
      </div>
    </section>
  );
};

export default Hero; 