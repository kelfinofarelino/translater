'use client';

export default function BagManufacturerPage() {
  const categories = [
    {
      title: 'Leather Tote Bags',
      subtitle: 'Structured everyday utility',
      image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?q=80&w=1000&auto=format&fit=crop',
    },
    {
      title: 'Crossbody Silhouettes',
      subtitle: 'Compact luxury leather goods',
      image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=1000&auto=format&fit=crop',
    },
    {
      title: 'Executive Briefcases',
      subtitle: 'Refined business accessories',
      image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=1000&auto=format&fit=crop',
    },
    {
      title: 'Weekender Duffles',
      subtitle: 'Travel essential craftsmanship',
      image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1000&auto=format&fit=crop',
    },
  ];

  const galleryItems = [
    {
      label: 'Saddle Leather Shoulder Bag',
      type: 'Bespoke Order',
      img: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=900&auto=format&fit=crop',
    },
    {
      label: 'Structured Noir Handbag',
      type: 'Monogram Ready',
      img: 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?q=80&w=900&auto=format&fit=crop',
    },
    {
      label: 'Tan Heritage Leather Tote',
      type: 'Full Grain Leather',
      img: 'https://images.unsplash.com/photo-1614179689702-355944cd0918?q=80&w=900&auto=format&fit=crop',
    },
    {
      label: 'Matte Black Compact Carrier',
      type: 'Industrial Stitching',
      img: 'https://images.unsplash.com/photo-1591561954557-26941169b49e?q=80&w=900&auto=format&fit=crop',
    },
  ];

  return (
    <div className="min-h-screen bg-white text-neutral-900 font-serif selection:bg-neutral-900 selection:text-white">
      {/* TOP NOTIFICATION / ACCENT BAR */}
      <div className="bg-neutral-950 py-2.5 px-4 text-center text-[11px] tracking-[0.25em] uppercase text-neutral-300 font-sans">
        Atelier &amp; Manufacturing &mdash; Yogyakarta, Indonesia
      </div>

      {/* HEADER / BRAND MARK */}
      <header className="border-b border-neutral-200 sticky top-0 bg-white/95 backdrop-blur-md z-40">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <span className="text-[11px] tracking-[0.3em] uppercase text-neutral-500 font-sans hidden md:block">
            Est. Yogyakarta
          </span>
          <div className="text-center mx-auto md:mx-0">
            <h1 className="text-2xl md:text-3xl tracking-[0.25em] font-light uppercase text-neutral-950">
              CIPTA BAKTI ABADI
            </h1>
            <p className="text-[9px] tracking-[0.4em] uppercase text-neutral-500 font-sans mt-0.5">
              Manufacture de Maroquinerie
            </p>
          </div>
          <span className="text-[11px] tracking-[0.3em] uppercase text-neutral-500 font-sans hidden md:block">
            Private Atelier
          </span>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative w-full h-[85vh] bg-neutral-900 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=2000&auto=format&fit=crop"
          alt="Leather Goods Atelier & Factory Workshop"
          className="w-full h-full object-cover object-center opacity-70 filter contrast-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-neutral-950/30 to-transparent" />
        <div className="absolute inset-0 flex flex-col items-center justify-end text-center p-8 md:p-16 text-white pb-20">
          <p className="text-xs md:text-sm font-sans tracking-[0.35em] uppercase text-neutral-300 mb-3">
            The Craft of Leather Engineering
          </p>
          <h2 className="text-3xl md:text-6xl font-normal tracking-wide max-w-4xl leading-tight">
            Excellence in Bag Manufacturing
          </h2>
          <p className="mt-4 max-w-xl text-xs md:text-sm font-sans font-light tracking-wider text-neutral-300">
            Precision leather assembly, custom silhouette fabrication, and meticulous craftsmanship rooted in the cultural heart of Yogyakarta.
          </p>
          <div className="mt-8 h-10 w-[1px] bg-white/40" />
        </div>
      </section>

      {/* INTRODUCTION / ATELIER STATEMENT */}
      <section className="max-w-4xl mx-auto px-6 py-28 text-center">
        <span className="text-[10px] tracking-[0.4em] uppercase font-sans text-neutral-400">
          The Yogyakarta Workshop
        </span>
        <h3 className="mt-4 text-2xl md:text-4xl font-light tracking-wide text-neutral-900 leading-snug">
          Where Traditional Handcraft Meets Modern Industrial Manufacturing
        </h3>
        <p className="mt-6 text-sm md:text-base font-sans text-neutral-600 leading-relaxed font-light max-w-2xl mx-auto">
          PT Cipta Bakti Abadi is a dedicated bag and leather goods manufacturing house based in Yogyakarta. We specialize in contract manufacturing, precision pattern construction, full-grain leather finishes, and turnkey hardware integration for bespoke labels and large-scale productions.
        </p>
      </section>

      {/* CATEGORIES GRID (LV STYLE TILES) */}
      <section className="max-w-7xl mx-auto px-6 pb-28">
        <div className="flex items-baseline justify-between border-b border-neutral-300 pb-4 mb-10">
          <h4 className="text-xl md:text-2xl font-light tracking-wider uppercase">
            Manufacturing Disciplines
          </h4>
          <span className="text-[11px] font-sans tracking-[0.2em] text-neutral-400 uppercase">
            Specialized Lines
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat, idx) => (
            <div key={idx} className="group cursor-default">
              <div className="relative aspect-[3/4] overflow-hidden bg-neutral-100">
                <img
                  src={cat.image}
                  alt={cat.title}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 filter grayscale-[15%]"
                />
              </div>
              <div className="pt-4 text-center">
                <h5 className="text-base tracking-wide text-neutral-950 font-normal">
                  {cat.title}
                </h5>
                <p className="text-[11px] font-sans tracking-wider text-neutral-500 mt-1 uppercase">
                  {cat.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FULL-WIDTH BANNER: WORKSHOP & ATELIER FLOOR */}
      <section className="relative w-full h-[70vh] bg-neutral-900 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1516762689617-e1cffcef479d?q=80&w=2000&auto=format&fit=crop"
          alt="Leather Raw Materials and Tailoring Workshop"
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-neutral-950/40" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-white">
          <span className="text-[10px] font-sans tracking-[0.4em] uppercase text-neutral-300">
            Material Sourcing &amp; Treatment
          </span>
          <h3 className="text-2xl md:text-5xl font-light tracking-wide mt-3 max-w-2xl">
            Selected Skins, Canvas, and Precision Stitchwork
          </h3>
          <p className="mt-4 max-w-lg text-xs md:text-sm font-sans font-light text-neutral-300 leading-relaxed">
            From vegetable-tanned bovine leathers to durable reinforced textiles, our production line handles demanding specifications with refined edge-coat painting and hardware plating.
          </p>
        </div>
      </section>

      {/* GALLERY / ARCHIVE SHOWCASE */}
      <section className="max-w-7xl mx-auto px-6 py-28">
        <div className="text-center mb-16">
          <span className="text-[10px] tracking-[0.4em] uppercase font-sans text-neutral-400">
            Product Archive
          </span>
          <h4 className="text-2xl md:text-4xl font-light tracking-wide text-neutral-950 mt-2">
            Selected Silhouettes
          </h4>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {galleryItems.map((item, idx) => (
            <div key={idx} className="flex flex-col items-center text-center">
              <div className="relative aspect-square w-full bg-neutral-50 overflow-hidden border border-neutral-100 p-6 flex items-center justify-center group">
                <img
                  src={item.img}
                  alt={item.label}
                  className="w-full h-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <h6 className="mt-4 text-xs md:text-sm tracking-wide text-neutral-900 font-medium">
                {item.label}
              </h6>
              <span className="mt-1 text-[10px] font-sans tracking-[0.2em] text-neutral-400 uppercase">
                {item.type}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* MINIMAL FOOTER (NO PHONE / NO SOCIALS) */}
      <footer className="border-t border-neutral-200 bg-neutral-50 py-16 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div>
            <p className="text-sm tracking-[0.25em] font-serif uppercase text-neutral-900 font-medium">
              PT CIPTA BAKTI ABADI
            </p>
            <p className="text-[11px] font-sans text-neutral-500 tracking-wider mt-1">
              Industrial Bag &amp; Leather Goods Manufacturing &bull; Special Region of Yogyakarta, Indonesia
            </p>
          </div>
          <div className="text-[11px] font-sans tracking-[0.2em] text-neutral-400 uppercase">
            &copy; {new Date().getFullYear()} All Rights Reserved &bull; Private Manufacturing House
          </div>
        </div>
      </footer>
    </div>
  );
}