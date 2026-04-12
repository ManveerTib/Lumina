import React from 'react';
import { Card, CardContent } from 'your-component-library'; // replace with actual UI component imports
import TextGenerateEffect from 'your-effect-library'; // replace with actual effect imports

const BiophotonicsPage = () => {
  const videos = [
    { id: 1, title: 'PDT Fundamentals', duration: '10:00', category: 'fundamentals' },
    { id: 2, title: 'Tissue Optics', duration: '12:00', category: 'fundamentals' },
    { id: 3, title: 'Photosensitizers', duration: '15:00', category: 'physics' },
    { id: 4, title: 'Diffusion Approximation', duration: '14:00', category: 'physics' },
    { id: 5, title: 'OncoScan AI', duration: '20:00', category: 'ai' },
    { id: 6, title: 'Clinical Workflow', duration: '18:00', category: 'clinical' },
    { id: 7, title: 'Dosimetry Modeling', duration: '22:00', category: 'advanced' },
    { id: 8, title: 'Photobleaching Kinetics', duration: '19:00', category: 'advanced' },
    { id: 9, title: 'Wavelength Effects', duration: '13:00', category: 'advanced' },
    { id: 10, title: 'ISM Research', duration: '11:00', category: 'clinical' },
    { id: 11, title: 'Future Directions', duration: '16:00', category: 'fundamentals' }
  ];

  const categories = ['fundamentals', 'physics', 'ai', 'clinical', 'advanced'];

  return (
    <div className="max-w-screen-xl mx-auto p-4">
      <header className="text-center mb-8">
        <TextGenerateEffect text="11-Video Educational Series on Biophotonics" />
      </header>
      <div className="mb-4">
        {categories.map((cat) => (
          <button key={cat} className="bg-emerald-500 text-white px-4 py-2 rounded mr-2">
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {videos.map((video) => (
          <Card key={video.id} className="shadow-md border border-gray-200">
            <CardContent>
              <h3 className="text-xl font-semibold">{video.title}</h3>
              <p className="text-gray-600">Duration: {video.duration}</p>
              <span className="badge bg-indigo-500 text-white rounded-full px-2">Video {video.id}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BiophotonicsPage;