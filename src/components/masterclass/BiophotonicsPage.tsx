import React, { useState } from 'react';
import { VideoPlayer } from '../ui/video-thumbnail-player';
import { TextGenerateEffect } from '../ui/text-generate-effect';
import { Card, CardContent } from '../ui/card';

interface MasterclassVideo {
  id: number;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  duration: string;
  category: 'fundamentals' | 'physics' | 'ai' | 'clinical' | 'advanced';
}

const MASTERCLASS_VIDEOS: MasterclassVideo[] = [
  {
    id: 1,
    title: "PDT Fundamentals",
    description: "Introduction to photodynamic therapy: mechanisms, history, and clinical applications in oncology.",
    thumbnailUrl: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=2070&auto=format&fit=crop",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1",
    duration: "18:45",
    category: "fundamentals"
  },
  {
    id: 2,
    title: "Tissue Optics & Light Propagation",
    description: "How photons interact with biological tissue: absorption, scattering, and penetration depth across wavelengths.",
    thumbnailUrl: "https://images.unsplash.com/photo-1576091160653-f46026e8ce29?q=80&w=2070&auto=format&fit=crop",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1",
    duration: "22:30",
    category: "physics"
  },
  {
    id: 3,
    title: "Photosensitizer Principles",
    description: "First, second, and third-generation photosensitizers: mechanisms of action, pharmacokinetics, and clinical selection.",
    thumbnailUrl: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?q=80&w=2070&auto=format&fit=crop",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1",
    duration: "19:15",
    category: "fundamentals"
  },
  {
    id: 4,
    title: "Diffusion Approximation Model",
    description: "Physics model by Farrell (1992): light transport in turbid media, optical property measurements, and validation.",
    thumbnailUrl: "https://images.unsplash.com/photo-1579154204601-01d82e6ce4ee?q=80&w=2070&auto=format&fit=crop",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1",
    duration: "25:00",
    category: "physics"
  },
  {
    id: 5,
    title: "OncoScan AI Deep Dive",
    description: "DenseNet121 training on 127k+ chest X-rays: architecture, feature extraction, and diagnostic performance metrics.",
    thumbnailUrl: "https://images.unsplash.com/photo-1559163853-8ae9d40e8f60?q=80&w=2070&auto=format&fit=crop",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1",
    duration: "28:45",
    category: "ai"
  },
  {
    id: 6,
    title: "Clinical Workflow Integration",
    description: "Three-step precision PDT: Detection (OncoScan AI) → Planning (PDT Simulator) → Optimization (AI Dosimetry).",
    thumbnailUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=2070&auto=format&fit=crop",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1",
    duration: "21:20",
    category: "clinical"
  },
  {
    id: 7,
    title: "Dosimetry Modeling with AI",
    description: "Machine learning for treatment planning: predicting optimal light dose, fluence rates, and treatment outcomes.",
    thumbnailUrl: "https://images.unsplash.com/photo-1559163853-8ae9d40e8f60?q=80&w=2070&auto=format&fit=crop",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1",
    duration: "26:10",
    category: "ai"
  },
  {
    id: 8,
    title: "Photobleaching Kinetics",
    description: "Real-time photosensitizer degradation: measurement, simulation, and impact on treatment efficacy.",
    thumbnailUrl: "https://images.unsplash.com/photo-1576091160541-8b20ba37c4c4?q=80&w=2070&auto=format&fit=crop",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1",
    duration: "20:05",
    category: "advanced"
  },
  {
    id: 9,
    title: "Wavelength Effects in PDT",
    description: "Comparing 630nm vs. 780nm: tissue penetration, photosensitizer absorption, and clinical implications.",
    thumbnailUrl: "https://images.unsplash.com/photo-1579154204601-01d82e6ce4ee?q=80&w=2070&auto=format&fit=crop",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1",
    duration: "17:50",
    category: "physics"
  },
  {
    id: 10,
    title: "ISM Research & Case Studies",
    description: "Real-world applications: tumor response, patient outcomes, and lessons from Dr. Vanderlei Bagnato's research.",
    thumbnailUrl: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=2070&auto=format&fit=crop",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1",
    duration: "24:30",
    category: "clinical"
  },
  {
    id: 11,
    title: "Future Directions in Precision Medicine",
    description: "Next-generation PDT: personalized dosimetry, predictive biomarkers, and integration with immunotherapy.",
    thumbnailUrl: "https://images.unsplash.com/photo-1576091160653-f46026e8ce29?q=80&w=2070&auto=format&fit=crop",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1",
    duration: "23:15",
    category: "advanced"
  }
];

const CATEGORY_COLORS: Record<string, { label: string; bgColor: string; textColor: string; borderColor: string }> = {
  fundamentals: { label: "Fundamentals", bgColor: "bg-blue-500/20",    textColor: "text-blue-300",    borderColor: "border-blue-500/40" },
  physics:      { label: "Physics",      bgColor: "bg-purple-500/20",  textColor: "text-purple-300",  borderColor: "border-purple-500/40" },
  ai:           { label: "AI & ML",      bgColor: "bg-emerald-500/20", textColor: "text-emerald-300", borderColor: "border-emerald-500/40" },
  clinical:     { label: "Clinical",     bgColor: "bg-pink-500/20",    textColor: "text-pink-300",    borderColor: "border-pink-500/40" },
  advanced:     { label: "Advanced",     bgColor: "bg-amber-500/20",   textColor: "text-amber-300",   borderColor: "border-amber-500/40" },
};

export default function BiophotonicsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredVideos = selectedCategory
    ? MASTERCLASS_VIDEOS.filter(v => v.category === selectedCategory)
    : MASTERCLASS_VIDEOS;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#091d2e] via-[#0d2540] to-[#091d2e]">
      {/* Header */}
      <div className="relative px-4 py-12 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8">
            <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-4">
              <span className="text-sm font-semibold text-emerald-300">Educational Series</span>
            </div>
          </div>

          <TextGenerateEffect
            words="Biophotonics Masterclass"
            className="text-4xl md:text-5xl mb-4 text-[#e4eeee]"
          />

          <p className="text-lg text-[#8daba8] max-w-2xl mb-8">
            Comprehensive 11-video educational series covering photodynamic therapy fundamentals,
            tissue optics, AI integration, clinical workflows, and advanced dosimetry modeling.
            Build expertise in precision PDT from first principles.
          </p>

          {/* Category filters */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-lg text-sm transition-all border ${
                selectedCategory === null
                  ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-200"
                  : "bg-white/5 border-white/10 text-[#8daba8] hover:bg-white/10"
              }`}
            >
              All Videos
            </button>
            {Object.entries(CATEGORY_COLORS).map(([key, { label, bgColor, textColor, borderColor }]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`px-4 py-2 rounded-lg text-sm transition-all border ${
                  selectedCategory === key
                    ? `${bgColor} ${borderColor} ${textColor}`
                    : "bg-white/5 border-white/10 text-[#8daba8] hover:bg-white/10"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Video grid */}
      <div className="px-4 pb-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVideos.map((video) => {
              const categoryInfo = CATEGORY_COLORS[video.category];
              return (
                <div
                  key={video.id}
                  className="group/video rounded-xl overflow-hidden border border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/10"
                >
                  <div className="relative">
                    <VideoPlayer
                      thumbnailUrl={video.thumbnailUrl}
                      videoUrl={video.videoUrl}
                      title={video.title}
                      className="rounded-none"
                      aspectRatio="16/9"
                    />

                    {/* Sequence number badge */}
                    <div className="absolute top-3 left-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm border border-white/20 pointer-events-none">
                      <span className="text-xs font-bold text-white">{video.id}</span>
                    </div>

                    {/* Duration badge */}
                    <div className="absolute bottom-3 right-3 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm pointer-events-none">
                      <span className="text-xs font-semibold text-white">{video.duration}</span>
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-[#0d2540] to-[#091d2e]">
                    <h3 className="text-base font-bold text-[#e4eeee] line-clamp-2 mb-2">
                      {video.title}
                    </h3>
                    <p className="text-xs text-[#8daba8] mb-3 line-clamp-2">
                      {video.description}
                    </p>
                    <div className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${categoryInfo.bgColor} ${categoryInfo.textColor} ${categoryInfo.borderColor}`}>
                      {categoryInfo.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Stats cards */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-white/5 border-white/10">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-emerald-300 mb-2">11</div>
                <p className="text-sm text-[#8daba8]">Video Modules</p>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-purple-300 mb-2">~4 hrs</div>
                <p className="text-sm text-[#8daba8]">Total Content</p>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-pink-300 mb-2">5</div>
                <p className="text-sm text-[#8daba8]">Learning Paths</p>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-amber-300 mb-2">Expert</div>
                <p className="text-sm text-[#8daba8]">Level Content</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}