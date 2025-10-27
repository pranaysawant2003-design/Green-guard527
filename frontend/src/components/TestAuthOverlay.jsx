import React from 'react';

const TestAuthOverlay = () => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-2xl max-w-md w-full">
        <h2 className="text-2xl font-bold text-green-700 mb-4">Test Auth Overlay</h2>
        <p className="mb-4">If you can see this, the overlay is working!</p>
        <div className="p-4 bg-green-100 text-green-800 rounded-lg">
          This is a test component to verify rendering.
        </div>
      </div>
    </div>
  );
};

export default TestAuthOverlay;
