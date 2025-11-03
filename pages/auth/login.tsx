// pages/auth/login.tsx

import React from 'react';
import GradientBackground from '../../components/Layout/GradientBackground';

const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      
      {/* 1. Gradient Background */}
      <GradientBackground />

      {/* 2. Content Container (Login Card) */}
      {/* z-10 ensures the card sits above the background */}
      <div 
        className="relative z-10 w-full max-w-sm p-6 sm:p-8 
                   bg-white/90 backdrop-blur-md rounded-2xl 
                   shadow-2xl border border-white/20"
      >
        <div className="text-center mb-6">
          {/* Small 'Otake Login' Badge */}
          <span 
            className="inline-block px-3 py-1 text-xs font-semibold 
                       text-pink-700 bg-yellow-200 rounded-full"
          >
            NAOTEMS Login
          </span>
          <h1 className="text-3xl font-bold mt-2 text-gray-800">
            Welcome NAOTEMS!
          </h1>
        </div>

        <form className="space-y-4">
          
          {/* Email/Matric Input Field */}
          <div>
            <label htmlFor="email" className="sr-only">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="Enter Email or Matric Number"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg 
                         focus:ring-pink-500 focus:border-pink-500 
                         text-gray-800 transition duration-150"
              required
            />
          </div>

          {/* Password Input Field */}
          <div>
            <label htmlFor="password" className="sr-only">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg 
                         focus:ring-pink-500 focus:border-pink-500 
                         text-gray-800 transition duration-150"
              required
            />
          </div>

          {/* Remember Me / Forgot Password */}
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center">
              <input 
                id="remember-me" 
                name="remember-me" 
                type="checkbox" 
                className="h-4 w-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500" 
              />
              <label htmlFor="remember-me" className="ml-2 text-gray-600">
                Remember me
              </label>
            </div>
            <a href="#" className="font-medium text-pink-600 hover:text-pink-500">
              Forgot password?
            </a>
          </div>

          {/* Create an Account / Login Button */}
          <button
            type="submit"
            className="w-full flex justify-center py-3 px-4 border border-transparent 
                       rounded-lg shadow-sm text-sm font-bold text-white 
                       bg-gray-900 hover:bg-gray-800 transition duration-150"
          >
            Sign In / Create an Account
          </button>
        </form>
        
        {/* Separator and Google Button */}
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500 mb-4">or</p>
          <button
            type="button"
            className="w-full flex items-center justify-center py-3 px-4 border 
                       border-gray-300 rounded-lg shadow-sm text-sm font-medium 
                       text-gray-700 bg-white hover:bg-gray-50 transition duration-150"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Google Logo SVG (simplified for brevity) */}
              <path fill="#FFC107" d="M43.61 20.083H42V20h-0.01c-0.21-3.69-1.98-7.2-4.83-9.98L33.91 14.19c2.09 2.02 3.39 4.89 3.39 7.97s-1.3 5.95-3.39 7.97l3.24 3.24c2.85-2.78 4.62-6.29 4.83-9.98z"/>
              <path fill="#FF3D00" d="M6.07 19.98c0 3.73 1.14 7.22 3.1 10.16L13.11 30.1c-1.8-2.67-2.82-5.91-2.82-9.12c0-3.21 1.02-6.45 2.82-9.12L9.17 9.82C7.21 12.76 6.07 16.25 6.07 19.98z"/>
              <path fill="#4CAF50" d="M19.99 43.67c5.17 0 9.87-1.89 13.56-5.07l-4.14-4.14c-2.39 1.83-5.32 2.94-8.77 2.94c-6.83 0-12.66-4.6-14.73-10.8L1.6 30.9C3.8 38.08 11.2 43.67 19.99 43.67z"/>
              <path fill="#1976D2" d="M19.99 4.31c4.52 0 8.52 1.63 11.7 4.54l4.14-4.14C32.95 2.06 26.68 0.31 19.99 0.31c-8.79 0-16.19 5.59-18.39 12.77l4.14 4.14C7.33 8.91 13.16 4.31 19.99 4.31z"/>
            </svg>
            Continue with Google
          </button>
        </div>
        
      </div>
    </div>
  );
};

export default LoginPage;
