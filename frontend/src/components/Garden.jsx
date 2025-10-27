import React from 'react';

const Garden = () => {
  return (
    <section id="garden" className="py-20 px-6 bg-gradient-to-br from-white to-emerald-50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 fade-in-up">
          <h2 className="text-4xl md:text-5xl font-bold font-display mb-6 text-gray-900">
            Your <span className="text-emerald-600">Digital Garden</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Track and nurture your adopted plants with our immersive care system.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-16 fade-in-up">
          <div>
            <h3 className="text-3xl font-bold mb-6 text-gray-900">Personalized Plant Care</h3>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Each plant in your digital garden mirrors a real-world counterpart. Receive tailored care reminders, track growth milestones, and watch your environmental impact blossom.
            </p>
            
                                    <div className="flex items-center gap-4 mb-8">
                                                     <button className="badge flex items-center gap-2">
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6v-2H4v2zM4 15h6v-2H4v2zM4 11h6V9H4v2zM4 7h6V5H4v2zM10 7h10V5H10v2zM10 11h10V9H10v2zM10 15h10v-2H10v2zM10 19h10v-2H10v2z" />
                             </svg>
                             Set Reminders
                           </button>
                           <button className="badge flex items-center gap-2">
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                             </svg>
                             View Progress
                           </button>
                        </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="glass-card p-6 rounded-xl flex items-center gap-4">
                                 <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center plant-icon">
                   <svg className="w-8 h-8 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                   </svg>
                 </div>
                <div>
                  <h4 className="text-xl font-semibold text-gray-900">Watering Schedule</h4>
                  <p className="text-gray-600">Next water: 2 days</p>
                </div>
              </div>
              <div className="glass-card p-6 rounded-xl flex items-center gap-4">
                                 <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center plant-icon">
                   <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                   </svg>
                 </div>
                <div>
                  <h4 className="text-xl font-semibold text-gray-900">Sunlight Exposure</h4>
                  <p className="text-gray-600">Optimal: 6-8 hrs/day</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-center items-center">
            <div className="progress-container">
              <div className="progress-bg">
                <div className="progress-inner">
                                     <svg className="w-20 h-20 text-emerald-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                   </svg>
                  <span className="text-4xl font-bold text-emerald-800">85%</span>
                  <p className="text-lg text-gray-600">Growth Progress</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mb-16 fade-in-up">
          <h3 className="text-3xl font-bold mb-6 text-gray-900">Your Adopted Plants</h3>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            A curated collection of your green companions, each with its unique story.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 fade-in-up">
          <div className="plant-card p-6 rounded-2xl text-center">
                         <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 plant-icon">
               <svg className="w-12 h-12 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
               </svg>
             </div>
            <h4 className="text-2xl font-bold mb-2 text-gray-900">Oak Sapling</h4>
            <p className="text-gray-600 mb-4">Adopted: April 2023</p>
            <span className="badge bg-emerald-500/20 text-emerald-800 px-4 py-2 rounded-full font-semibold">Healthy</span>
          </div>
          <div className="plant-card p-6 rounded-2xl text-center">
                         <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 plant-icon">
               <svg className="w-12 h-12 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
               </svg>
             </div>
            <h4 className="text-2xl font-bold mb-2 text-gray-900">Desert Rose</h4>
            <p className="text-gray-600 mb-4">Adopted: June 2024</p>
            <span className="badge bg-amber-500/20 text-amber-800 px-4 py-2 rounded-full font-semibold">Needs Water</span>
          </div>
          <div className="plant-card p-6 rounded-2xl text-center">
                         <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 plant-icon">
               <svg className="w-12 h-12 text-lime-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
               </svg>
             </div>
            <h4 className="text-2xl font-bold mb-2 text-gray-900">Saguaro Cactus</h4>
            <p className="text-gray-600 mb-4">Adopted: Jan 2023</p>
            <span className="badge bg-emerald-500/20 text-emerald-800 px-4 py-2 rounded-full font-semibold">Thriving</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Garden; 