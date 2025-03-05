import React from 'react';

const Rules = () => {
  // Using the exact embed URL provided
  const googleDocsUrl = "https://docs.google.com/document/d/e/2PACX-1vQYJ6WQIIsGhD29fZ3WvoZj93-IE1sUp-vsWBA4Mx_6nMCYcr8ybsVdII2irnk4oWtSdmq7lkkGlUB0/pub?embedded=true";
  
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-text-dark mb-6">Bases y Reglamento del Torneo</h1>
        
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">

          
          {/* Embedded Google Docs with responsive container */}
          <div className="w-full overflow-hidden rounded-lg border border-gray-200 relative">
            {/* Responsive aspect ratio container */}
            <div className="relative pb-[150%] md:pb-[120%] lg:pb-[100%] h-0">
              <iframe 
                src={googleDocsUrl}
                title="Reglamento de la Liga Nico Sabag"
                className="absolute top-0 left-0 w-full h-full"
                frameBorder="0"
                allowFullScreen
                loading="lazy"
              ></iframe>
            </div>
          </div>
          
          {/* Alternative direct link for mobile users who prefer to open in their browser */}
          <div className="mt-4 text-center">
            <a 
              href={googleDocsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary-dark font-medium"
            >
              Abrir reglamento en una nueva pestaña
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Rules;