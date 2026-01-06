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
      <main>
        <HeroSection />
        <BuildingHighlights />
        <RoomsSection />
        <ComingSoonSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
