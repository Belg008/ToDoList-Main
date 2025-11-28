'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaHome, FaList, FaCog } from 'react-icons/fa';

export default function Sidebar() {
  const pathname = usePathname();
  
  return (
    <div className="sidebar">
      <h3>Menu</h3>
      <ul>
        <li className={pathname === '/' ? 'active' : ''}>
          <Link href="/">
            <FaHome className="icon" />
            <span>Home</span>
          </Link>
        </li>
        <li className={pathname === '/todolist' ? 'active' : ''}>
          <Link href="/todolist">
            <FaList className="icon" />
            <span>ToDo List</span>
          </Link>
        </li>
        <li className={pathname === '/settings' ? 'active' : ''}>
          <Link href="/settings">
            <FaCog className="icon" />
            <span>Settings</span>
          </Link>
        </li>
      </ul>
    </div>
  );
}
