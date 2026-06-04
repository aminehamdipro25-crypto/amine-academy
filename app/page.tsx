import HeroSection from '@/components/landing/HeroSection'
import StatsSection from '@/components/landing/StatsSection'
import FeaturesSection from '@/components/landing/FeaturesSection'
import AttentionSection from '@/components/landing/AttentionSection'
import ProgramsSection from '@/components/landing/ProgramsSection'
import InteractiveSessionSection from '@/components/landing/InteractiveSessionSection'
import PlansSection from '@/components/landing/PlansSection'
import TestimonialsSection from '@/components/landing/TestimonialsSection'
import CTASection from '@/components/landing/CTASection'
import FooterSection from '@/components/landing/FooterSection'
import FloatingChat from '@/components/shared/FloatingChat'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white overflow-x-hidden">
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <AttentionSection />
      <ProgramsSection />
      <InteractiveSessionSection />
      <PlansSection />
      <TestimonialsSection />
      <CTASection />
      <FooterSection />
      <FloatingChat />
    </main>
  )
}
