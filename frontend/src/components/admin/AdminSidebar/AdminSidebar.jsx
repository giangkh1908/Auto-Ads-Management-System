import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Users, UserCog, FileText, ClipboardList } from 'lucide-react';
import './AdminSidebar.css';

export default function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isHovered, setIsHovered] = useState(false);

  const currentPath = location.pathname;
  
  // Check if we're in User Management section
  const isUserManagement = currentPath.startsWith('/admin/system-admin/user-management');
  const isCustomer = currentPath === '/admin/system-admin/user-management';
  const isInternal = currentPath.startsWith('/admin/system-admin/user-management/internal');
  
  // Check if we're in System Monitoring section
  const isSystemMonitoring = currentPath.startsWith('/admin/system-admin/system-monitoring');
  const isSystemLog = currentPath === '/admin/system-admin/system-monitoring' || currentPath === '/admin/system-admin/system-monitoring/system-log';
  const isCustomerLog = currentPath.startsWith('/admin/system-admin/system-monitoring/customer-log');

  useEffect(() => {
    const cls = 'sidebar-collapsed';
    if (!isHovered) {
      document.body.classList.add(cls);
    } else {
      document.body.classList.remove(cls);
    }
    return () => document.body.classList.remove(cls);
  }, [isHovered]);

  // Render User Management sidebar items
  if (isUserManagement) {
    return (
      <aside
        className={`app-sidebar admin ${!isHovered ? 'collapsed' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <nav className="sidebar-nav-admin">
          <ul>
            <li>
              <button
                className={`sidebar-item ${isCustomer ? 'active' : ''}`}
                onClick={() => navigate('/admin/system-admin/user-management')}
              >
                <span className="sidebar-icon"><Users size={18} /></span>
                <span className="sidebar-label">Customer</span>
              </button>
            </li>
            <li>
              <button
                className={`sidebar-item ${isInternal ? 'active' : ''}`}
                onClick={() => navigate('/admin/system-admin/user-management/internal')}
              >
                <span className="sidebar-icon"><UserCog size={18} /></span>
                <span className="sidebar-label">Internal</span>
              </button>
            </li>
          </ul>
        </nav>
      </aside>
    );
  }

  // Render System Monitoring sidebar items
  if (isSystemMonitoring) {
    return (
      <aside
        className={`app-sidebar admin ${!isHovered ? 'collapsed' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <nav className="sidebar-nav-admin">
          <ul>
            <li>
              <button
                className={`sidebar-item ${isSystemLog ? 'active' : ''}`}
                onClick={() => navigate('/admin/system-admin/system-monitoring')}
              >
                <span className="sidebar-icon"><FileText size={18} /></span>
                <span className="sidebar-label">System Log</span>
              </button>
            </li>
            <li>
              <button
                className={`sidebar-item ${isCustomerLog ? 'active' : ''}`}
                onClick={() => navigate('/admin/system-admin/system-monitoring/customer-log')}
              >
                <span className="sidebar-icon"><ClipboardList size={18} /></span>
                <span className="sidebar-label">Customer Log</span>
              </button>
            </li>
          </ul>
        </nav>
      </aside>
    );
  }

  // Default: no sidebar items
  return null;
}


