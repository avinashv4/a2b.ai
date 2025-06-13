'use client';

import { Button } from '@/components/ui/button';
import { Plane } from 'lucide-react';
import Link from 'next/link';

export default function Navigation() {
  return (
    <nav className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-6xl px-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl nav-shadow px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
              <Plane className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">a2b.ai</span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#about" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">
              About Us
            </a>
            <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">
              Pricing
            </a>
            <a href="#help" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">
              Help
            </a>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            <Link href="/auth">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-semibold transition-all duration-200 hover:scale-105">
                Start Planning
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}