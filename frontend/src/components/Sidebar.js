import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';
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
  const { translate: t } = useTranslation();
  
  const navigationItems = [
    {
      name: t('dashboard'),
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'officer', 'verifier', 'viewer']
    },
    {
      name: t('forestAtlas'),
      href: '/atlas',
      icon: Map,
      roles: ['admin', 'officer', 'verifier', 'viewer']
    },
    {
      name: t('caseManagement'),
      href: '/cases',
      icon: FileText,
      roles: ['admin', 'officer', 'verifier']
    },
    {
      name: t('analytics'),
      href: '/analytics',
      icon: BarChart3,
      roles: ['admin', 'officer']
    },
    {
      name: t('adminPanel'),
      href: '/admin',
      icon: Shield,
      roles: ['admin']
    }
  ];

  const filteredItems = navigationItems.filter(item => 
    item.roles.includes(userRole)
  );

  return (
    <aside className={`bg-blue-900 text-white fixed left-0 top-0 h-full transition-all duration-300 z-40 ${isOpen ? 'w-64' : 'w-16'} shadow-lg`}>
      {/* Header spacing */}
      <div className="h-[120px]"></div>
      
      <div className={`${isOpen ? 'p-4' : 'p-2'} h-[calc(100%-120px)] overflow-y-auto`}>
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
        <nav className={`${isOpen ? 'space-y-2' : 'space-y-3'}`}>
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
                `flex items-center ${isOpen ? 'space-x-3 px-3 py-3' : 'px-2 py-4 justify-center'} rounded-lg transition-all duration-200 group ${
                  isActive
                    ? 'bg-orange-500 text-white shadow-lg'
                    : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                }`
              }
            >
              <item.icon className={`${isOpen ? 'w-5 h-5' : 'w-7 h-7'} flex-shrink-0`} />
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
      </div>
    </aside>
  );
};

export default Sidebar;