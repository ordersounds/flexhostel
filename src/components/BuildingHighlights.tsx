import { useRef, useEffect } from "react";
import { ArrowRight, Star, ShieldCheck, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import mapPerspective from "@/assets/map-perspective.png";
import securityAccess from "@/assets/security-access.png";
import lifestyleStudents from "@/assets/lifestyle-students.png";

const BuildingHighlights = () => {
  return (
    <section className="py-24 lg:py-32 bg-secondary/30 relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">

        {/* Editorial Header */}
        <div className="max-w-4xl mx-auto mb-20 text-center animate-reveal-up">
          <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-1.5 mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Live Better</span>
          </div>
          <h2 className="font-display text-4xl md:text-5xl lg:text-7xl font-bold text-foreground mb-8 tracking-tighter leading-[0.95]">
            Designed for <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-teal-400">Student Life.</span>
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed font-light max-w-2xl mx-auto">
            Everything you need to study, relax, and thrive. <br className="hidden md:block" />
            Right at your doorstep in Okitipupa.
          </p>
        </div>

        {/* Real Estate Bento Grid - 10x Layout */}
        <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 auto-rows-[300px] md:auto-rows-[300px] gap-4 md:gap-6">

          {/* Item 1: Location Map (Interactive Google Map) */}
          <div className="group md:col-span-6 lg:col-span-8 row-span-1 md:row-span-2 relative overflow-hidden rounded-[2rem] bg-stone-100 border border-white/50 shadow-sm transition-all duration-500 hover:shadow-2xl hover:scale-[1.01] animate-reveal-up delay-100">
            {/* Google Embed Map - Pointer events none to prevent scroll hijacking on mobile */}
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d126839.0667756184!2d4.707777169567954!3d6.502844990008627!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x103859664650534b%3A0xe6bf446d61d15c89!2sOkitipupa%2C%20Nigeria!5e0!3m2!1sen!2sus!4v1709720000000!5m2!1sen!2sus"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="absolute inset-0 w-full h-full grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-stone-900/90 via-stone-900/40 to-transparent pointer-events-none" />

            <div className="absolute inset-0 p-6 md:p-12 flex flex-col justify-end z-20 pointer-events-none">
              <div className="space-y-3 md:space-y-4 max-w-lg transform transition-transform duration-500 group-hover:-translate-y-2">
                <div className="flex items-center gap-3">
                  <div className="bg-white/90 backdrop-blur-md p-2 rounded-full shadow-lg">
                    <MapPin className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  </div>
                  <span className="text-white font-semibold text-base md:text-lg drop-shadow-md tracking-tight">Okitipupa, Ondo State</span>
                </div>
                <h3 className="text-2xl md:text-5xl font-bold text-white tracking-tighter drop-shadow-xl leading-none">
                  Unbeatable <br /> Location
                </h3>
                <p className="text-stone-100 text-sm md:text-lg font-medium drop-shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 hidden md:block">
                  Heart of the student district. Secure and accessible.
                </p>
                <div className="pt-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-200 pointer-events-auto">
                  <Button variant="secondary" size="sm" className="rounded-full px-6 shadow-lg bg-white text-stone-900 border-none hover:bg-stone-50" onClick={() => window.open('https://maps.google.com/maps?q=Okitipupa', '_blank')}>
                    Open in Maps <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Item 2: Smart Living (App & Automation) */}
          <div className="group md:col-span-6 lg:col-span-4 row-span-1 md:row-span-2 relative overflow-hidden rounded-[2rem] bg-[#050505] shadow-2xl transition-all duration-500 hover:scale-[1.01] animate-reveal-up delay-200">
            {/* Mesh Gradient / Glow Effect - Fixes the "Plain Black" issue */}
            <div className="absolute top-[-20%] right-[-20%] w-[80%] h-[80%] bg-primary/20 blur-[120px] rounded-full animate-pulse transition-all duration-1000 group-hover:bg-primary/30" />
            <div className="absolute bottom-[-20%] left-[-20%] w-[60%] h-[60%] bg-teal-500/10 blur-[100px] rounded-full transition-all duration-1000 group-hover:bg-teal-500/20" />

            {/* Subtle Pattern Overlay */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] mix-blend-overlay" />

            {/* Placeholder for App Concept (Since generation failed) */}
            <img
              src={securityAccess}
              alt="Smart Living App"
              className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay transition-transform duration-1000 group-hover:scale-110 grayscale"
            />

            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/90" />

            <div className="absolute inset-0 p-6 md:p-10 flex flex-col justify-end z-20">
              <div className="mb-auto inline-flex items-center gap-2 bg-primary/10 backdrop-blur-xl px-3 py-1.5 rounded-full border border-primary/20 w-fit self-end md:self-start">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-primary-foreground/90">Smart Living</span>
              </div>

              <div className="transform transition-transform duration-500 group-hover:-translate-y-1">
                <h3 className="text-2xl md:text-4xl font-bold text-white mb-2 md:mb-3 tracking-tighter">Everything <br /> Automated</h3>
                <p className="text-stone-400 leading-relaxed text-sm md:text-base font-light">
                  Pay for light, cleaning, and data instantly from your phone. Seamlessly integrated.
                </p>
              </div>
            </div>
          </div>

          {/* Item 3: Community (Socialize) */}
          <div className="group md:col-span-6 lg:col-span-7 row-span-1 relative overflow-hidden rounded-[2rem] bg-stone-50 border border-stone-200 shadow-sm transition-all duration-500 hover:shadow-xl animate-reveal-up delay-300">
            <div className="absolute inset-0 grid grid-cols-2">
              <div className="p-6 md:p-10 flex flex-col justify-center bg-white relative z-10">
                <div className="flex items-center gap-2 text-primary mb-2 md:mb-4">
                  <div className="p-1.5 bg-primary/10 rounded-lg">
                    <Users className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider">Community</span>
                </div>
                <h3 className="text-xl md:text-3xl font-bold text-foreground mb-1 md:mb-2 tracking-tight">Study & <br /> Socialize</h3>
                <p className="text-muted-foreground leading-relaxed text-xs md:text-base font-light">
                  Premium lounges designed for the modern Nigerian student.
                </p>
              </div>
              <div className="relative h-full overflow-hidden">
                <img
                  src={lifestyleStudents}
                  alt="Students relaxing"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-white via-white/20 to-transparent" />
              </div>
            </div>
          </div>

          {/* Item 4: Rating (Social Proof) */}
          <div className="group md:col-span-6 lg:col-span-5 row-span-1 relative overflow-hidden rounded-[2rem] bg-primary shadow-lg flex items-center justify-center p-6 md:p-8 transition-all duration-500 hover:bg-teal-700 animate-reveal-up delay-300">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay" />
            <div className="text-center space-y-2 md:space-y-3 relative z-10 transform transition-transform duration-500 group-hover:scale-105">
              <div className="flex items-center justify-center gap-1.5 text-white/90">
                <Star className="w-5 h-5 md:w-6 md:h-6 fill-current" />
                <Star className="w-5 h-5 md:w-6 md:h-6 fill-current" />
                <Star className="w-5 h-5 md:w-6 md:h-6 fill-current" />
                <Star className="w-5 h-5 md:w-6 md:h-6 fill-current" />
                <Star className="w-5 h-5 md:w-6 md:h-6 fill-current" />
              </div>
              <div className="text-4xl md:text-6xl font-black text-white tracking-tighter">
                4.9
              </div>
              <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-primary-foreground/80">Student Satisfaction</p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default BuildingHighlights;
