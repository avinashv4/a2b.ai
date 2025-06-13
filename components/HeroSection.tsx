import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function HeroSection() {
  return (
    <section className="min-h-screen bg-white flex items-center justify-center px-4 pt-24">
      <div className="w-full mx-auto">
        {/* Hero Card */}
        <div className="bg-white rounded-3xl card-shadow overflow-hidden mb-32">
          {/* Hero Image with Overlay Text */}
          <div className="relative h-[500px] md:h-[970px]">
            <Image
              src="/bg.png"
              alt="Travel Planning Background"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            
            {/* Hero Text Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center px-4">
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8">
                  <span style={{ color: '#f8ff6c' }}>Trips made social,</span>
                  <br />
                  <span style={{ color: '#f8ff6c' }}>plans made easy.</span>
                </h1>
                <Link href="/auth">
                  <Button 
                    className="text-white font-semibold px-8 py-4 text-lg rounded-full transition-all duration-200 hover:scale-105"
                    style={{ backgroundColor: '#f8ff6c', color: 'black' }}
                  >
                    Start Planning
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        {/* Feature Description - Not in card, center aligned */}
        <div className="max-w-6xl mx-auto text-center mb-32">
          <div className="mb-12">
            <h3 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-6">
              Collaborative Planning Made Simple
            </h3>
            <p className="text-gray-600 text-lg md:text-xl leading-relaxed max-w-3xl mx-auto">
              Plan your perfect trip with friends and family in real-time. Share ideas, vote on destinations, 
              split costs, and create unforgettable memories together. Our AI-powered suggestions help you 
              discover hidden gems and optimize your itinerary for the best experience.
            </p>
          </div>
          
          {/* Placeholder for Feature Video/Image */}
          <div className="bg-gray-100 rounded-2xl h-[32rem] md:h-[42rem] flex items-center justify-center border-2 border-dashed border-gray-300 w-full px-4">
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-300 rounded-full mx-auto mb-6 flex items-center justify-center">
                <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M19 10a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-500 font-semibold text-lg">Feature Demo Placeholder</p>
              <p className="text-gray-400 text-sm mt-2">Video or image will be added here</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}