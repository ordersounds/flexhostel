import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import BuildingHighlights from "@/components/BuildingHighlights";
import RoomsSection from "@/components/RoomsSection";
import ComingSoonSection from "@/components/ComingSoonSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="relative">
        <HeroSection />
        <div className="animate-fade-in">
          <BuildingHighlights />
        </div>
        <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <RoomsSection />
        </div>
        <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <ComingSoonSection />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
