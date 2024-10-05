import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-footer text-footer-text py-4 text-sm">
      <div className="container mx-auto px-2">
        <div className="flex flex-wrap justify-center items-start text-center">
          <div className="w-full sm:w-1/3 mb-3 sm:mb-0">
            <h2 className="text-lg font-semibold text-footer-text mb-1">Liga Nico Sabag</h2>
          </div>
          <div className="w-full sm:w-1/3 mb-3 sm:mb-0">
            <p className="font-semibold mb-1">Contacto</p>
            <p className="mb-1">Vicente Tapia: (123) 456-7890</p>
            <p>Ignacio Armstrong: (123) 456-7890</p>
          </div>
          <div className="w-full sm:w-1/3 mb-3 sm:mb-0">
            <p className="text-xs text-text-light">
              Hecho con cariño por<br />
              Guillermo Ponce y Federico Alarcón
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;