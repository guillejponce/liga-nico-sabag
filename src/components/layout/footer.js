import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-footer text-footer-text py-6 text-sm">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center text-center">
          <h2 className="text-lg font-semibold text-footer-text mb-2">Liga Nico Sabag</h2>
          <p className="mb-2">Contacto: (123) 456-7890 (Vicente Tapia)</p>
          <p className="mb-2">Contacto: (123) 456-7890 (Ignacio Armstrong)</p>
          <p className="text-xs text-text-light">
            Sitio desarrollado por Guillermo Ponce y Federico Alarcón
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;