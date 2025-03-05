import React, { useState, useEffect } from 'react';
import { pb } from '../../config';

const BannerSlider = ({ banners, currentBannerIndex, setCurrentBannerIndex }) => {
  const nextSlide = () => {
    setCurrentBannerIndex((current) => 
      current === banners.length - 1 ? 0 : current + 1
    );
  };

  const prevSlide = () => {
    setCurrentBannerIndex((current) => 
      current === 0 ? banners.length - 1 : current - 1
    );
  };

  return (
    <div className="relative w-full h-[75vh] overflow-hidden">
      {/* Navigation Buttons */}
      <button 
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 text-white opacity-75 hover:opacity-100 transition-opacity"
      >
        <div className="bg-black/30 p-2 rounded-full hover:bg-black/50 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </div>
      </button>

      <button 
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 text-white opacity-75 hover:opacity-100 transition-opacity"
      >
        <div className="bg-black/30 p-2 rounded-full hover:bg-black/50 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </button>

      {/* Slides Container */}
      <div className="relative w-full h-full">
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className={`absolute w-full h-full transition-all duration-500 ${
              index === currentBannerIndex 
                ? 'opacity-100 translate-x-0' 
                : index < currentBannerIndex
                ? 'opacity-0 -translate-x-full' 
                : 'opacity-0 translate-x-full'
            }`}
          >
            <div 
              className="w-full h-full bg-cover bg-center"
              style={{ 
                backgroundImage: banner?.image ? 
                  `url(${banner.id === 'default' ? banner.image : pb.getFileUrl(banner, banner.image)})` : 
                  'none'
              }}
            >
              <div className="absolute inset-0 bg-black bg-opacity-40"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white p-8">
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
                    {banner?.title}
                  </h1>
                  <p className="text-lg md:text-xl lg:text-2xl" style={{ whiteSpace: 'pre-line' }}>
                    {banner?.description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Progress Indicators */}
      {banners.length > 1 && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 z-20">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentBannerIndex(index)}
              className="group relative"
            >
              <div className="w-16 h-1.5 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-white transform origin-left transition-all duration-[5000ms] ease-linear ${
                    index === currentBannerIndex ? 'scale-x-100' : 'scale-x-0'
                  }`}
                  style={{
                    animation: index === currentBannerIndex 
                      ? 'progressShrink 5s linear forwards' 
                      : 'none'
                  }}
                />
              </div>
              <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 
                         text-white text-xs opacity-0 group-hover:opacity-100 
                         transition-opacity duration-300 whitespace-nowrap">
                {index + 1} / {banners.length}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = `
@keyframes progressShrink {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(100%);
  }
}
`;

const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

export default BannerSlider;