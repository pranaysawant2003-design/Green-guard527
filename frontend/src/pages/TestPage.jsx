import React from 'react';

const TestPage = () => {
  return (
    <div className="fixed inset-0 bg-red-500 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-2xl">
        <h1 className="text-3xl font-bold text-center">TEST PAGE</h1>
        <p className="mt-4 text-xl">If you can see this, routing is working!</p>
      </div>
    </div>
  );
};

export default TestPage;
