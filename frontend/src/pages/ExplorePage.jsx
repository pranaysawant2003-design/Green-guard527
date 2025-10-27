import React from 'react';
import ExplorePlants from '../components/ExplorePlants';
import Navigation from '../components/Navigation';

const ExplorePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <ExplorePlants />
      </div>
    </div>
  );
};

export default ExplorePage;
