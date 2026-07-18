import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background Grid */}
      <div className="fixed inset-0 grid-pattern pointer-events-none z-0"></div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-surface/10 backdrop-blur-xl border-b border-outline-variant/30 shadow-[0_0_20px_rgba(0,219,231,0.1)]">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>medical_services</span>
            <span className="font-display text-4xl md:text-5xl font-bold text-primary tracking-tighter">Dental Genie</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollToSection('platform')} className="font-display text-button-text text-on-surface-variant hover:text-primary hover:bg-primary/10 px-4 py-2 rounded transition">Platform</button>
            <button onClick={() => scrollToSection('technology')} className="font-display text-button-text text-on-surface-variant hover:text-primary hover:bg-primary/10 px-4 py-2 rounded transition">Technology</button>
            <button onClick={() => scrollToSection('solutions')} className="font-display text-button-text text-on-surface-variant hover:text-primary hover:bg-primary/10 px-4 py-2 rounded transition">Solutions</button>
            <button onClick={() => scrollToSection('case-studies')} className="font-display text-button-text text-on-surface-variant hover:text-primary hover:bg-primary/10 px-4 py-2 rounded transition">Case Studies</button>
          </div>

          <div className="hidden md:block">
            <Link to="/login" className="bg-primary text-on-primary font-display text-button-text px-6 py-3 rounded-lg glow-bloom-hover inline-block">
              Launch Portal
            </Link>
          </div>

          <button className="md:hidden text-primary">
            <span className="material-symbols-outlined text-3xl">menu</span>
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-grow flex items-center relative z-10 pt-32 pb-24 md:pt-48 md:pb-32 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto w-full">
        <div className="flex flex-col md:flex-row items-center gap-12 w-full">
          
          {/* Left Content */}
          <div className="w-full md:w-1/2 flex flex-col items-start gap-6">
            <div className="inline-flex items-center gap-2 bg-surface-container/50 border border-primary/30 rounded-full px-4 py-1.5">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(0,219,231,0.8)]"></div>
              <span className="font-mono text-data-label text-primary uppercase tracking-widest text-xs">SYSTEM ONLINE V3.0</span>
            </div>

            <h1 className="font-display text-4xl md:text-display-lg text-on-surface leading-tight">
              Instant Dental Diagnosis with <span className="text-primary text-glow block">Artificial Intelligence</span>
            </h1>

            <p className="font-body text-body-main text-on-surface-variant max-w-xl">
              Elevate your clinical practice with state-of-the-art neural networks. Dental Genie analyzes radiographs in real-time, detecting caries, bone loss, and pathologies with unprecedented precision.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto pt-4">
              <Link to="/register" className="w-full sm:w-auto bg-primary text-on-primary font-display text-button-text px-8 py-4 rounded-lg glow-bloom-hover text-center">
                Start Analysis
              </Link>
              <button onClick={() => scrollToSection('demo-viewer')} className="w-full sm:w-auto glass-card flex items-center justify-center gap-2 text-primary font-display text-button-text px-8 py-4 rounded-lg hover:bg-white/10 transition">
                <span className="material-symbols-outlined">play_circle</span>
                View Demo
              </button>
            </div>
          </div>

          {/* Right Hologram */}
          <div className="w-full md:w-1/2 relative">
            <div className="glass-card rounded-2xl p-4 relative overflow-hidden aspect-square flex items-center justify-center">
              <div className="absolute inset-0 bg-primary/5"></div>
              <div className="absolute top-0 left-0 w-full h-1 bg-primary shadow-[0_0_10px_#00dbe7] z-20 opacity-50 animate-scan"></div>
              
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC6WDTTvr8m4QEpjo8aGJ5A3zGhBBgHbqa94RKYWIXkxl78lOqjafBos2UajCUeMFXxysgbGrCzwuUIPwD0x99WXwCrq2WV-M-PcpZ3nylEoNa27TgJXMv83TDpYrtBP01A0TATC1cZoq-r5MPcz2uD2EESSjib9I_ba7Ex6TFQsrZEjUeRWjGNHCVDlUg2kwNw2-cy8ozpZSzgwKRzakO71YA3fTcQZrezlrfPla0bsllwdNJ44C_LwQ" 
                alt="AI Dental Scan Hologram" 
                className="relative z-10 w-full h-full object-cover mix-blend-screen opacity-80"
              />

              <div className="absolute bottom-6 left-6 z-20 font-mono text-data-label text-primary bg-background/80 px-2 py-1 rounded border border-primary/30 backdrop-blur">
                [CONFIDENCE: 99.8%]
              </div>
              
              <div className="absolute bottom-6 right-6 z-20 flex flex-col gap-1 items-end">
                <div className="font-mono text-[10px] text-error bg-error-container/30 px-2 py-1 rounded border border-error/30 backdrop-blur">
                  CARIES_DETECTED
                </div>
                <div className="font-mono text-[10px] text-secondary bg-secondary-container/30 px-2 py-1 rounded border border-secondary/30 backdrop-blur">
                  DEPTH: 2.4MM
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Features Section */}
      <section id="platform" className="relative z-10 py-24 border-t border-outline-variant/30 bg-surface-container-lowest/50 backdrop-blur-md">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
          <div className="text-center mb-16">
            <h2 className="font-display text-headline-lg text-primary mb-4">Why choose Dental Genie?</h2>
            <p className="font-body text-body-main text-on-surface-variant max-w-2xl mx-auto">
              Built for clinical environments demanding absolute precision. Our diagnostic network operates with uncompromised accuracy and speed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-card rounded-xl p-8 relative overflow-hidden group hover:border-primary/50 hover:shadow-[0_0_20px_rgba(0,219,231,0.2)] transition-all duration-300">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition duration-500"></div>
              <div className="w-12 h-12 rounded-lg bg-surface-container border border-outline-variant/50 flex items-center justify-center mb-6 text-primary group-hover:shadow-[0_0_15px_rgba(0,242,255,0.4)] transition-shadow duration-300">
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>biotech</span>
              </div>
              <h3 className="font-display text-xl text-on-surface mb-3 font-semibold group-hover:[text-shadow:0_0_10px_rgba(0,219,231,0.5)] transition-all duration-300">Clinical Accuracy</h3>
              <p className="font-body text-on-surface-variant text-sm leading-relaxed">
                Trained on millions of verified clinical radiographs, our models identify subtle pathologies often missed by the human eye.
              </p>
            </div>

            <div className="glass-card rounded-xl p-8 relative overflow-hidden group hover:border-primary/50 hover:shadow-[0_0_20px_rgba(0,219,231,0.2)] transition-all duration-300">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition duration-500"></div>
              <div className="w-12 h-12 rounded-lg bg-surface-container border border-outline-variant/50 flex items-center justify-center mb-6 text-primary group-hover:shadow-[0_0_15px_rgba(0,242,255,0.4)] transition-shadow duration-300">
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
              </div>
              <h3 className="font-display text-xl text-on-surface mb-3 font-semibold group-hover:[text-shadow:0_0_10px_rgba(0,219,231,0.5)] transition-all duration-300">Instant Results</h3>
              <p className="font-body text-on-surface-variant text-sm leading-relaxed">
                Receive comprehensive diagnostic reports in under 3 seconds. Streamline your workflow and increase patient throughput.
              </p>
            </div>

            <div className="glass-card rounded-xl p-8 relative overflow-hidden group hover:border-primary/50 hover:shadow-[0_0_20px_rgba(0,219,231,0.2)] transition-all duration-300">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition duration-500"></div>
              <div className="w-12 h-12 rounded-lg bg-surface-container border border-outline-variant/50 flex items-center justify-center mb-6 text-primary group-hover:shadow-[0_0_15px_rgba(0,242,255,0.4)] transition-shadow duration-300">
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>shield_lock</span>
              </div>
              <h3 className="font-display text-xl text-on-surface mb-3 font-semibold group-hover:[text-shadow:0_0_10px_rgba(0,219,231,0.5)] transition-all duration-300">Secure & Private</h3>
              <p className="font-body text-on-surface-variant text-sm leading-relaxed">
                End-to-end encryption ensures all patient data remains strictly confidential and HIPAA/GDPR compliant.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Technology / Demo Section */}
      <section id="technology" className="relative z-10 py-24 border-t border-outline-variant/30">
        <div id="demo-viewer" className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="w-full md:w-1/2">
              <h2 className="font-display text-headline-lg text-primary mb-6">Neural Network Architecture</h2>
              <p className="font-body text-body-main text-on-surface-variant mb-6">
                Our proprietary convolutional neural networks scan panoramic and periapical radiographs layer by layer, generating probabilistic heatmaps for various dental pathologies.
              </p>
              <ul className="space-y-4 mb-8 font-mono text-sm text-on-surface-variant">
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                  [MODULE 1] Multi-class Caries Detection
                </li>
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                  [MODULE 2] Periodontal Bone Loss Quantification
                </li>
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                  [MODULE 3] Apical Lesion Identification
                </li>
              </ul>
            </div>
            
            <div className="w-full md:w-1/2">
              <div className="glass-card p-2 rounded-xl relative">
                <div className="absolute inset-0 bg-primary/5 rounded-xl"></div>
                <div className="relative overflow-hidden rounded-lg aspect-video flex items-center justify-center bg-black">
                   <div className="absolute top-0 left-0 w-full h-full border-[2px] border-primary/20 pointer-events-none z-20"></div>
                   
                   {/* Simulated Scanning UI */}
                   <div className="absolute top-4 left-4 z-30 font-mono text-xs text-primary bg-black/60 px-2 py-1 rounded">
                     ANALYZING: PANORAMIC_XRAY_01.DCM
                   </div>
                   <div className="absolute bottom-4 right-4 z-30 flex items-center gap-2 font-mono text-xs text-primary">
                     <span className="material-symbols-outlined text-sm animate-spin">autorenew</span>
                     PROCESSING_LAYERS...
                   </div>
                   
                   {/* Grid Overlay */}
                   <div className="absolute inset-0 cyber-grid opacity-30 z-10 pointer-events-none"></div>
                   
                   {/* Simulated X-Ray (Using a generic abstraction for demo) */}
                   <div className="w-full h-full bg-surface-container flex items-center justify-center">
                      <span className="material-symbols-outlined text-[120px] text-on-surface-variant/20">skeleton</span>
                   </div>

                   {/* Bounding Boxes */}
                   <div className="absolute top-[30%] left-[40%] w-[15%] h-[20%] border-2 border-error bg-error/10 z-20 pulse-glow">
                      <div className="absolute -top-6 left-0 bg-error text-error-container font-mono text-[8px] px-1 whitespace-nowrap">CARIES 98%</div>
                   </div>
                   <div className="absolute top-[50%] right-[30%] w-[10%] h-[15%] border-2 border-secondary bg-secondary/10 z-20 pulse-glow" style={{ animationDelay: '1s' }}>
                      <div className="absolute -top-6 left-0 bg-secondary text-secondary-container font-mono text-[8px] px-1 whitespace-nowrap">CALCULUS 87%</div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section id="solutions" className="relative z-10 py-24 border-t border-outline-variant/30 bg-surface-container-lowest/50 backdrop-blur-md">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop text-center">
          <h2 className="font-display text-headline-lg text-primary mb-12">Scalable Diagnostic Solutions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="glass-panel p-8 rounded-xl border border-primary/20 hover:border-primary/50 transition flex flex-col items-center text-center">
              <span className="material-symbols-outlined text-4xl text-primary mb-4">person</span>
              <h3 className="font-display text-2xl text-on-surface mb-4">Solo Practitioners</h3>
              <p className="font-body text-on-surface-variant text-sm mb-6 flex-grow">
                Enhance your diagnostic confidence. Use Dental Genie as a second opinion to ensure no subtle pathologies are missed during busy clinical days.
              </p>
              <button onClick={() => window.scrollTo(0, 0)} className="w-full bg-surface-container border border-primary text-primary py-3 rounded-lg font-display glow-bloom-hover transition">
                Start Free Trial
              </button>
            </div>
            
            <div className="glass-panel p-8 rounded-xl border border-primary/20 hover:border-primary/50 transition flex flex-col items-center text-center relative overflow-hidden">
              <div className="absolute -top-4 -right-4 bg-primary text-on-primary font-mono text-[10px] px-8 py-1 rotate-45 transform translate-y-6 translate-x-4">ENTERPRISE</div>
              <span className="material-symbols-outlined text-4xl text-primary mb-4">corporate_fare</span>
              <h3 className="font-display text-2xl text-on-surface mb-4">Enterprise Clinics</h3>
              <p className="font-body text-on-surface-variant text-sm mb-6 flex-grow">
                Standardize diagnosis quality across multiple locations. Seamlessly integrate with your existing PACS and practice management software.
              </p>
              <button onClick={() => window.scrollTo(0, 0)} className="w-full bg-primary text-on-primary py-3 rounded-lg font-display glow-bloom-hover transition">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Case Studies Section */}
      <section id="case-studies" className="relative z-10 py-24 border-t border-outline-variant/30">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
          <h2 className="font-display text-headline-lg text-primary mb-12 text-center">Clinical Case Studies</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { id: 1, title: 'Interproximal Caries', desc: 'Early detection of D1/D2 lesions on premolars, preventing need for future endodontic therapy.' },
              { id: 2, title: 'Periodontal Assessment', desc: 'Automated CEJ to crestal bone measurements across full mouth series, saving 15 mins per patient.' },
              { id: 3, title: 'Periapical Radiolucency', desc: 'Identification of 2mm apical lesion on asymptomatic tooth #19, confirmed via CBCT.' }
            ].map((study) => (
              <div key={study.id} className="glass-card rounded-lg overflow-hidden group cursor-pointer border border-outline-variant/50 hover:border-primary/50 transition">
                <div className="h-48 bg-surface-container flex items-center justify-center relative">
                  <span className="material-symbols-outlined text-4xl text-primary/30 group-hover:text-primary transition">radiology</span>
                  <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition"></div>
                </div>
                <div className="p-6">
                  <div className="font-mono text-[10px] text-primary mb-2">CASE_ID: {study.id}9384</div>
                  <h4 className="font-display text-lg text-on-surface mb-2">{study.title}</h4>
                  <p className="font-body text-sm text-on-surface-variant">{study.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-surface-container-lowest border-t border-outline-variant/30 py-12">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
             <span className="material-symbols-outlined text-primary/50 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>medical_services</span>
             <span className="font-display text-lg font-bold text-primary/50 tracking-tighter">Dental Genie</span>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-6 font-mono text-[11px] uppercase tracking-widest text-on-surface-variant">
            <a href="#" className="hover:text-primary transition">Privacy Protocol</a>
            <a href="#" className="hover:text-primary transition">Service Terms</a>
            <a href="#" className="hover:text-primary transition">API Docs</a>
            <a href="#" className="hover:text-primary transition">Compliance</a>
          </div>

          <div className="font-mono text-[10px] text-on-surface-variant/50">
            &copy; 2024 DENTAL.AI SYSTEMS
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Home;
