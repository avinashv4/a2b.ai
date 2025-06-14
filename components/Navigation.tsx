'use client';

import { Button } from '@/components/ui/button';
import { Plane } from 'lucide-react';
import Link from 'next/link';

export default function Navigation() {
  return (
    <nav className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-5xl px-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl nav-shadow px-8 py-5">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
              <Plane className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">a2b.ai</span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#about" className="text-gray-600 hover:text-gray-900 transition-colors font-medium text-lg">
              About Us
            </a>
            <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors font-medium text-lg">
              Pricing
            </a>
            <a href="#help" className="text-gray-600 hover:text-gray-900 transition-colors font-medium text-lg">
              Help
            </a>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            <Link href="/auth">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-semibold transition-all duration-200 hover:scale-105 text-lg">
                Start Planning
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}