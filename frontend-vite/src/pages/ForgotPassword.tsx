import React from 'react';
import { Link } from 'react-router-dom';

const ForgotPasswordPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold mb-6">Forgot Password</h2>
        <p className="text-gray-600 mb-6">
          Password reset functionality coming soon. For now, please contact support.
        </p>
        <Link to="/login" className="text-blue-600 hover:underline">
          ← Back to Login
        </Link>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;