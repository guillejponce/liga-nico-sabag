import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-footer text-footer-text py-2.5 text-sm">
      <div className="container mx-auto px-2 h-full">
        <div className="flex flex-wrap justify-center items-center h-full">
          <div className="w-full sm:w-1/3 mb-3 sm:mb-0 flex items-center justify-center">
            <h2 className="text-lg font-semibold text-footer-text">Liga Nico Sabag</h2>
          </div>
          <div className="w-full sm:w-1/3 mb-3 sm:mb-0 flex flex-col items-center justify-center">
            <p className="font-semibold mb-1">Contacto</p>
            <p className="mb-1">Vicente Tapia: (123) 456-7890</p>
            <p>Ignacio Armstrong: (123) 456-7890</p>
          </div>
          <div className="w-full sm:w-1/3 mb-3 sm:mb-0 flex items-center justify-center">
            <p className="text-xs text-text-light text-center">
              Hecho con ❤️ por<br />
              Guillermo Ponce y Federico Alarcón
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;