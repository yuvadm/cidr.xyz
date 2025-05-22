import { useState, useEffect } from 'react';

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Close menu when window is resized to desktop size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 640 && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMenuOpen]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="w-full max-w-6xl mx-auto mb-4 py-2 px-4">
      <div className="flex justify-between items-center">
        <a
          href="/"
          className="text-2xl font-bold flex items-center gap-2"
        >
          <img
            src="/ico/icon-192.png"
            alt="CIDR.xyz logo"
            className="w-6 h-6"
          />
          CIDR.xyz
        </a>

        {/* Hamburger button for mobile */}
        <button
          onClick={toggleMenu}
          className="sm:hidden flex items-center px-3 py-2 border rounded text-gray-700 border-gray-700 hover:text-blue-600 hover:border-blue-600"
          aria-label="Toggle menu"
        >
          <svg className="fill-current h-4 w-4" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z" />
          </svg>
        </button>

        {/* Desktop menu */}
        <div className="hidden sm:flex space-x-6">
          <NavLinks />
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`${isMenuOpen ? '' : 'hidden'} sm:hidden mt-4 pt-4 border-t border-gray-200`}>
        <div className="flex flex-col space-y-3">
          <NavLinks mobile={true} />
        </div>
      </div>
    </nav>
  );
}

// Separated NavLinks component for reuse
function NavLinks({ mobile = false }: { mobile?: boolean }) {
  const linkClass = `text-gray-700 hover:text-blue-600 font-medium ${mobile ? 'py-2' : ''}`;

  return (
    <>
      <a href="/" className={linkClass}>
        CIDR Calculator
      </a>
      <a href="/subnet-guide" className={linkClass}>
        Subnet Guide
      </a>
      <a href="/embed-example" className={linkClass}>
        Embed
      </a>
      <a
        href="https://github.com/yuvadm/cidr.xyz"
        className={`${linkClass} flex items-center gap-1`}
        target="_blank"
        rel="noopener noreferrer"
      >
        Github
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        </svg>
      </a>
    </>
  );
}
