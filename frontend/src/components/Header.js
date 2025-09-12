import React from 'react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from './ui/dropdown-menu';
import { Menu, X, Bell, LogOut, User, Settings, Trees, Globe } from 'lucide-react';
import { useAuth } from '../App';

const Header = ({ user, sidebarOpen, setSidebarOpen }) => {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="bg-white border-b-4 border-orange-500 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-blue-900 hover:bg-blue-50"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
          
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-900 rounded-full flex items-center justify-center">
              <Trees className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-blue-900">FRA-Connect</h1>
              <p className="text-xs text-slate-600 hidden md:block">Forest Rights Atlas & Decision Support System</p>
            </div>
          </div>
        </div>

        {/* Center Section - Breadcrumb/Title */}
        <div className="hidden md:flex items-center space-x-2 text-sm text-slate-600">
          <Globe className="w-4 h-4" />
          <span>Ministry of Tribal Affairs | Government of India</span>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-3">
          {/* Language Selector */}
          <div className="hidden md:flex items-center space-x-1 text-sm">
            <span className="text-slate-600">Language:</span>
            <select className="bg-transparent border-none text-blue-900 font-medium cursor-pointer">
              <option value="en">English</option>
              <option value="hi">हिंदी</option>
              <option value="tribal">Tribal Languages</option>
            </select>
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative text-slate-600 hover:bg-slate-100">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
              3
            </span>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2 hover:bg-slate-100">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-blue-900 text-white text-sm">
                    {user?.full_name?.split(' ')?.map(n => n[0])?.join('') || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-slate-900">{user?.full_name}</p>
                  <p className="text-xs text-slate-600 capitalize">{user?.role} | {user?.department}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-3 py-2 border-b">
                <p className="font-medium text-slate-900">{user?.full_name}</p>
                <p className="text-sm text-slate-600">{user?.email}</p>
                <p className="text-xs text-slate-500 capitalize">{user?.role} - {user?.department}</p>
                {user?.state && (
                  <p className="text-xs text-slate-500">{user?.district}, {user?.state}</p>
                )}
              </div>
              
              <DropdownMenuItem className="cursor-pointer">
                <User className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>
              
              <DropdownMenuItem className="cursor-pointer">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Secondary Header Bar */}
      <div className="bg-blue-900 text-white px-4 py-1">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <span className="text-orange-300">●</span>
            <span>Secure Government Portal</span>
          </div>
          <div className="hidden md:flex items-center space-x-4 text-xs">
            <span>Last Login: {new Date().toLocaleDateString()}</span>
            <span>|</span>
            <span>NIC Certified</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;