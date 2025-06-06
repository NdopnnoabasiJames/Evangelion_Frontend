import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-grey text-center py-2 mt-auto border-top">
      <div className="container">
        <p className="text-muted small mb-0">
          © {currentYear} Evangelion Event System. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
