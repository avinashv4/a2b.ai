import Navigation from '@/components/Navigation';
import HeroSection from '@/components/HeroSection';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main className="min-h-screen pt-4">
      <Navigation />
      <HeroSection />
      <Footer />
    </main>
  );
}