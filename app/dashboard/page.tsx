import { Plane, Users, MapPin, Calendar, Settings, Bell } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
              <Plane className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">a2b.ai</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <Bell className="w-6 h-6 text-gray-600 hover:text-gray-900 cursor-pointer" />
            <Settings className="w-6 h-6 text-gray-600 hover:text-gray-900 cursor-pointer" />
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-semibold">U</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to your Dashboard!</h1>
          <p className="text-xl text-gray-600 mb-8">Your collaborative travel planning journey starts here.</p>
          
          {/* Placeholder Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
              <Users className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">My Trips</h3>
              <p className="text-gray-600">Manage your collaborative trips</p>
            </div>
            
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
              <MapPin className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Destinations</h3>
              <p className="text-gray-600">Explore amazing places</p>
            </div>
            
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
              <Calendar className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Itineraries</h3>
              <p className="text-gray-600">Plan your perfect schedule</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}