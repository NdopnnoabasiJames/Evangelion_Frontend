import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="text-center py-2 mt-auto border-top" style={{ backgroundColor: 'var(--primary-purple)' }}>
      <div className="container">
        <p className="text-white small mb-0">
          © {currentYear} Evangelion Event System. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
