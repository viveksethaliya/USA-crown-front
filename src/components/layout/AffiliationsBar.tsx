'use client';

const affiliations = [
  { src: '/professional-affiliations/image-2-25.png', alt: 'AJA' },
  { src: '/professional-affiliations/image-3.webp', alt: 'MJSA' },
  { src: '/professional-affiliations/image-4-removebg-preview.png', alt: 'JBT' },
  { src: '/professional-affiliations/image-5-removebg-preview.png', alt: 'JVC' },
  { src: '/professional-affiliations/jewelersofamerica-logo_1-1-200x133-1.png', alt: 'Jewelers of America' },
];

export default function AffiliationsBar() {
  return (
    <section className="py-24 relative overflow-hidden bg-background border-y border-border-color/30 flex flex-col items-center">
      
      {/* Crown Watermark behind title */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 z-0 opacity-15 pointer-events-none">
        <img src="/logo.png" alt="" className="h-32 object-cover object-left w-[80px]" style={{ filter: 'grayscale(0) brightness(1.2)' }} />
      </div>

      <div className="relative z-10 text-center mb-16">
        <h2 className="text-3xl font-heading font-medium text-text-main tracking-wide">
          Professional Affiliations
        </h2>
      </div>

      <div className="relative z-10 flex flex-wrap items-center justify-center gap-x-12 gap-y-10 px-8 max-w-6xl mx-auto">
        {affiliations.map(img => (
          <img
            key={img.src}
            src={img.src}
            alt={img.alt}
            className="h-16 w-auto grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-400 object-contain"
          />
        ))}
      </div>
    </section>
  );
}
