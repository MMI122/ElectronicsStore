import React from 'react';
import { useAuth } from '../context/AuthContext';

const DebugAuth: React.FC = () => {
  const { user, isAuthenticated, isAdmin, loading } = useAuth();

  return (
    <div className="fixed top-4 right-4 bg-white border border-gray-300 p-4 rounded shadow-lg z-50 max-w-sm">
      <h3 className="font-bold text-sm mb-2">Auth Debug</h3>
      <div className="text-xs space-y-1">
        <div><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</div>
        <div><strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</div>
        <div><strong>Is Admin:</strong> {isAdmin ? 'Yes' : 'No'}</div>
        <div><strong>User:</strong> {user ? JSON.stringify(user, null, 2) : 'None'}</div>
      </div>
    </div>
  );
};

export default DebugAuth;