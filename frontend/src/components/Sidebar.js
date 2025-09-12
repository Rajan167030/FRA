import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Map, 
  FileText, 
  BarChart3, 
  Settings, 
  Shield,
  Trees,
  Users,
  Database,
  Activity
} from 'lucide-react';

const Sidebar = ({ isOpen, userRole }) => {
  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'officer', 'verifier', 'viewer']
    },
    {
      name: 'Forest Atlas',
      href: '/atlas',
      icon: Map,
      roles: ['admin', 'officer', 'verifier', 'viewer']
    },
    {
      name: 'Case Management',
      href: '/cases',
      icon: FileText,
      roles: ['admin', 'officer', 'verifier']
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
      roles: ['admin', 'officer']
    },
    {
      name: 'Admin Panel',
      href: '/admin',
      icon: Shield,
      roles: ['admin']
    }
  ];

  const filteredItems = navigationItems.filter(item => 
    item.roles.includes(userRole)
  );

  return (
    <aside className={`bg-blue-900 text-white fixed left-0 top-20 h-full transition-all duration-300 z-40 ${isOpen ? 'w-64' : 'w-16'} shadow-lg`}>
      <div className="p-4">
        {/* Department Info */}
        {isOpen && (
          <div className="mb-6 pb-4 border-b border-blue-800">
            <div className="flex items-center space-x-2 mb-2">
              <Trees className="w-5 h-5 text-green-400" />
              <span className="font-medium text-sm">Forest Department</span>
            </div>
            <p className="text-xs text-blue-200">Digital India Initiative</p>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="space-y-2">
          <div className={`${isOpen ? 'block' : 'hidden'} mb-4`}>
            <h3 className="text-xs font-semibold text-blue-300 uppercase tracking-wider">
              Navigation
            </h3>
          </div>

          {filteredItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? 'bg-orange-500 text-white shadow-lg'
                    : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                }`
              }
            >
              <item.icon className={`w-5 h-5 ${isOpen ? '' : 'mx-auto'}`} />
              {isOpen && (
                <span className="font-medium text-sm">{item.name}</span>
              )}
              {!isOpen && (
                <span className="absolute left-16 bg-gray-900 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  {item.name}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Quick Stats (if space allows) */}
        {isOpen && (
          <div className="mt-8 p-3 bg-blue-800 rounded-lg">
            <h4 className="text-sm font-medium text-blue-100 mb-3">System Status</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-blue-200">Server Status</span>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-green-400">Online</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-blue-200">Database</span>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-green-400">Connected</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-blue-200">Last Sync</span>
                <span className="text-blue-200">2 min ago</span>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        {isOpen && (
          <div className="absolute bottom-4 left-4 right-4">
            <div className="text-center">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <p className="text-xs text-blue-200">Secured Portal</p>
              <p className="text-xs text-blue-300">v2.1.0</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;