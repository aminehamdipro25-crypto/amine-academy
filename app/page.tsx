import HeroSection from '@/components/landing/HeroSection'
import MarqueeStrip from '@/components/landing/MarqueeStrip'
import StatsSection from '@/components/landing/StatsSection'
import FeaturesSection from '@/components/landing/FeaturesSection'
import AttentionSection from '@/components/landing/AttentionSection'
import HowItWorks from '@/components/landing/HowItWorks'
import ProgramsSection from '@/components/landing/ProgramsSection'
import InteractiveSessionSection from '@/components/landing/InteractiveSessionSection'
import PlansSection from '@/components/landing/PlansSection'
import TestimonialsSection from '@/components/landing/TestimonialsSection'
import CTASection from '@/components/landing/CTASection'
import FooterSection from '@/components/landing/FooterSection'
import FloatingChat from '@/components/shared/FloatingChat'
import TabletNotice from '@/components/landing/TabletNotice'

export default function HomePage() {
  return (
    <main className="min-h-[100dvh] bg-[#FFF8F0] overflow-x-hidden">
      <HeroSection />
      <MarqueeStrip />
      <StatsSection />
      <FeaturesSection />
      <AttentionSection />
      <HowItWorks />
      <ProgramsSection />
      <InteractiveSessionSection />
      <PlansSection />
      <TestimonialsSection />
      <CTASection />
      <FooterSection />
      <FloatingChat />
      <TabletNotice />
    </main>
  )
}
