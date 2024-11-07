import React from 'react';
import newlandImage from '../../assets/images/newland.png';

const Footer = () => {
  return (
    <footer className="bg-footer text-footer-text py-2.5 text-sm">
      <div className="container mx-auto px-2 h-full">
        <div className="flex flex-wrap justify-center items-center h-full">
          <div className="w-full sm:w-1/3 mb-3 sm:mb-0 flex items-center justify-center">
            <a href="https://www.newland.cl/" target="_blank" rel="noopener noreferrer">
              <img src={newlandImage} alt="Newland" className="h-14 w-14 mr-2" />
            </a>
            <h2 className="text-lg font-semibold text-footer-text">Liga Ex Alumnos Newland</h2>
          </div>
          <div className="w-full sm:w-1/3 mb-3 sm:mb-0 flex flex-col items-center justify-center">
            <p className="font-semibold mb-1">Contacto</p>
            <p className="mb-1">
              <a href="https://wa.me/+56988330989" target="_blank" rel="noopener noreferrer">
                Vicente Tapia: +56 9 8833 0989
              </a>
            </p>
            <p className="mb-1">
              <a href="https://wa.me/+56995308061" target="_blank" rel="noopener noreferrer">
                Ignacio Armstrong: +56 9 9530 8061
              </a>
            </p>
          </div>
          <div className="w-full sm:w-1/3 mb-3 sm:mb-0 flex items-center justify-center">
            <p className="text-xs text-text-light text-center">
              Hecho con ❤️ por<br />
              <a href="https://www.instagram.com/guillejponce/" target="_blank" rel="noopener noreferrer">Guillermo Ponce</a> y <a href="https://www.instagram.com/fedealarconm/" target="_blank" rel="noopener noreferrer">Federico Alarcón</a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;