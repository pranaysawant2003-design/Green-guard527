import React, { useState, useEffect } from 'react';

const BonsaiContainer = ({ showMessage, soundEnabled }) => {
  const [growth, setGrowth] = useState(0);
  const [isWatered, setIsWatered] = useState(false);
  const [lastWatered, setLastWatered] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setGrowth(prev => {
        if (prev < 100 && isWatered) {
          return Math.min(prev + 0.1, 100);
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isWatered]);

  useEffect(() => {
    const waterInterval = setInterval(() => {
      const timeSinceWatered = Date.now() - lastWatered;
      if (timeSinceWatered > 30000) { // 30 seconds
        setIsWatered(false);
        showMessage("Your bonsai needs water!", 'warning');
      }
    }, 5000);

    return () => clearInterval(waterInterval);
  }, [lastWatered, showMessage]);

  const handleWater = () => {
    setIsWatered(true);
    setLastWatered(Date.now());
    showMessage("Bonsai watered! 🌱", 'success');
    
    if (soundEnabled) {
      // Play water sound effect
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
      audio.play().catch(() => {});
    }
  };

  const getBonsaiStage = () => {
    if (growth < 25) return 'seed';
    if (growth < 50) return 'sprout';
    if (growth < 75) return 'sapling';
    return 'mature';
  };

  const getBonsaiEmoji = () => {
    const stage = getBonsaiStage();
    switch (stage) {
      case 'seed': return '🌱';
      case 'sprout': return '🌿';
      case 'sapling': return '🌳';
      case 'mature': return '🌲';
      default: return '🌱';
    }
  };

  return (
    <div className="fixed bottom-8 left-8 z-40">
      <div className="glass-card p-6 rounded-2xl text-center min-w-[200px]">
        <div className="text-6xl mb-4 transition-all duration-500 transform hover:scale-110">
          {getBonsaiEmoji()}
        </div>
        
        <h3 className="text-lg font-bold text-gray-900 mb-2">Your Bonsai</h3>
        
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Growth</span>
            <span>{Math.round(growth)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-green-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${growth}%` }}
            ></div>
          </div>
        </div>
        
        <div className="mb-4">
          <div className="flex items-center justify-center gap-2 text-sm">
            <div className={`w-3 h-3 rounded-full ${isWatered ? 'bg-blue-500' : 'bg-red-500'}`}></div>
            <span className={isWatered ? 'text-blue-600' : 'text-red-600'}>
              {isWatered ? 'Watered' : 'Needs Water'}
            </span>
          </div>
        </div>
        
        <button 
          onClick={handleWater}
          disabled={isWatered}
          className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
            isWatered 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-blue-500 text-white hover:bg-blue-600 hover:shadow-lg hover:-translate-y-1'
          }`}
        >
          💧 Water
        </button>
        
        {growth >= 100 && (
          <div className="mt-4 p-3 bg-emerald-100 rounded-lg">
            <p className="text-emerald-800 text-sm font-semibold">
              🎉 Your bonsai is fully grown!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BonsaiContainer; 