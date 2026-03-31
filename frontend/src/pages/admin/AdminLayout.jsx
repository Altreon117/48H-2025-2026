import { NavLink, Outlet } from 'react-router-dom';
import './AdminLayout.css';

export default function AdminLayout() {
    const adminNavItems = [
        { to: '/admin/dashboard', label: 'Dashboard' },
        { to: '/admin/users', label: 'Utilisateurs' },
        { to: '/admin/posts', label: 'Publications' },
        { to: '/admin/news', label: 'Actualités' },
        { to: '/admin/messages', label: 'Messages' },
    ];

    return (
        <div className="page-container">
            <div className="admin-container">
                <nav className="admin-top-nav card">
                    <div className="admin-nav-scroll">
                        {adminNavItems.map(item => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}
                            >
                                {item.label}
                            </NavLink>
                        ))}
                    </div>
                </nav>

                <div className="admin-content">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}