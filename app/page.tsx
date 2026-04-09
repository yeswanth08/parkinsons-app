"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Brain, Mic, TrendingUp, Users, CheckCircle2 } from "lucide-react"
import {
  AnimatedBrainIllustration,
  AnimatedVoiceWaves,
  AnimatedReportIllustration,
} from "@/components/illustrations"

export default function Home() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  const parkinsonsInfo = [
    {
      title: "What is Parkinson's Disease?",
      content: "Parkinson's Disease is a progressive neurodegenerative disorder that primarily affects movement. It occurs when neurons in the brain that produce dopamine begin to die, leading to tremors, rigidity, slowness of movement, and postural instability. The disease typically develops gradually, often starting with subtle symptoms that may go unnoticed."
    },
    {
      title: "Early Signs & Symptoms",
      content: "Early symptoms may include tremor (usually in the hands), muscle rigidity, slowed movement (bradykinesia), and postural changes. Non-motor symptoms like sleep disturbances, mood changes, and voice changes can also appear. Many people experience voice quality deterioration, which can be detected through speech analysis."
    },
    {
      title: "Voice Changes in Parkinson's",
      content: "Voice changes affect up to 90% of Parkinson's patients. Changes include reduced loudness, monotone speech, voice tremor, and difficulty with speech control. These occur due to rigidity and weakness in the laryngeal muscles. Voice analysis can reveal biomarkers like Jitter, Shimmer, and Harmonics-to-Noise Ratio (HNR) that indicate neurological changes."
    },
    {
      title: "Why Early Detection Matters",
      content: "Early detection allows for timely intervention and better management of symptoms. While there is no cure, treatments like dopamine agonists and lifestyle changes can significantly improve quality of life. Early diagnosis also enables patients to plan for future care and access support resources."
    }
  ]

  const biomarkers = [
    {
      name: "Jitter",
      description: "Variation in fundamental frequency from cycle to cycle",
      unit: "%",
      normal: "< 1.04%"
    },
    {
      name: "Shimmer",
      description: "Variation in amplitude of voice oscillations",
      unit: "dB",
      normal: "< 3.81 dB"
    },
    {
      name: "HNR",
      description: "Harmonics-to-Noise Ratio - voice clarity measure",
      unit: "dB",
      normal: "> 20 dB"
    },
    {
      name: "MDVP F0",
      description: "Mean fundamental frequency",
      unit: "Hz",
      normal: "120-200 Hz"
    }
  ]

  const faqs = [
    {
      q: "Is this test a diagnostic tool?",
      a: "No, NeuroVox is a screening tool designed to identify potential voice biomarkers associated with Parkinson's Disease. It is not a medical diagnosis and should not replace clinical evaluation by a neurologist."
    },
    {
      q: "How accurate is the voice analysis?",
      a: "Voice biomarker analysis has shown promising results in clinical research for detecting early-stage Parkinson's. However, accuracy depends on proper recording conditions and user compliance with instructions."
    },
    {
      q: "Who should use this screening?",
      a: "Anyone concerned about Parkinson's risk, individuals with family history of PD, or those experiencing voice changes should consider using this screening. It's especially useful for those over 50."
    },
    {
      q: "What should I do if I get a high-risk result?",
      a: "If you receive a moderate or high-risk indication, consult with a neurologist for a comprehensive evaluation. They can perform clinical tests and imaging if needed to confirm or rule out Parkinson's Disease."
    },
    {
      q: "How do I prepare for the voice test?",
      a: "Find a quiet environment, use a good quality microphone, and avoid speaking in a forced manner. Speak naturally and maintain consistent speech patterns for accurate analysis."
    }
  ]

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-[#1F2937]/30 bg-gradient-to-br from-[#0B1220] via-[#111827]/30 to-[#0B1220]">
          <div className="mx-auto max-w-7xl px-6 py-16 sm:py-28">
            <div className="grid gap-12 items-center md:grid-cols-2">
              {/* Content */}
              <div className="animate-fade-in-up">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#22D3EE]/20 to-[#8B5CF6]/20 px-4 py-2 border border-[#22D3EE]/30">
                  <Brain className="h-4 w-4 text-[#22D3EE]" />
                  <span className="text-sm font-semibold text-[#22D3EE]">Early Detection Matters</span>
                </div>
                <h1 className="mb-6 text-4xl font-bold tracking-tight text-[#E5E7EB] sm:text-5xl" style={{ fontFamily: "var(--font-heading)" }}>
                  Parkinson&apos;s Disease Screening
                </h1>
                <p className="mb-8 text-lg text-[#9CA3AF] sm:text-xl leading-relaxed">
                  AI-powered voice analysis to detect early biomarkers of Parkinson&apos;s Disease. Non-invasive, accessible, and clinically informed.
                </p>
                <div className="flex flex-col gap-4 sm:flex-row">
                  <a href="/test" className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#22D3EE] to-[#06B6D4] px-8 py-3 text-base font-semibold text-[#0B1220] hover:from-[#06B6D4] hover:to-[#0891B2] transition-all transform hover:scale-105 shadow-lg shadow-[#22D3EE]/20">
                    <Mic className="h-5 w-5" />
                    Start Voice Test
                  </a>
                  <a href="#information" className="inline-flex items-center justify-center rounded-lg border border-[#1F2937]/60 bg-[#111827]/50 px-8 py-3 text-base font-semibold text-[#E5E7EB] hover:bg-[#111827]/80 hover:border-[#22D3EE]/40 transition-all transform hover:scale-105">
                    Learn More
                  </a>
                </div>
              </div>

              {/* Illustration */}
              <div className="hidden md:block h-80 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
                <div className="h-full w-full flex items-center justify-center">
                  <div className="w-64 h-64">
                    <AnimatedBrainIllustration />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Facts */}
        <section className="border-b border-border/50">
          <div className="mx-auto max-w-7xl px-6 py-16 sm:py-24">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: Users, label: "Affects", value: "10 Million+", description: "people worldwide" },
                { icon: TrendingUp, label: "Early Detection", value: "90%", description: "of voice changes" },
                { icon: CheckCircle2, label: "Accuracy", value: "87%", description: "in screening" },
                { icon: Brain, label: "Dopamine Loss", value: "60-80%", description: "at diagnosis" }
              ].map((stat, i) => (
                <div key={i} className="rounded-lg border border-border/50 bg-card/50 p-6 text-center backdrop-blur-sm">
                  <stat.icon className="mx-auto mb-3 h-8 w-8 text-primary" />
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{stat.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Main Information Section */}
        <section id="information" className="border-b border-border/50">
          <div className="mx-auto max-w-7xl px-6 py-16 sm:py-24">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl" style={{ fontFamily: "var(--font-heading)" }}>
                Understanding Parkinson&apos;s Disease
              </h2>
              <p className="text-lg text-muted-foreground">
                Knowledge about Parkinson&apos;s helps you make informed decisions about screening and health.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              {parkinsonsInfo.map((info, idx) => (
                <Card key={idx} className="border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300 transform hover:scale-105 hover:shadow-lg animate-slide-up" style={{ animationDelay: `${idx * 0.1}s` }}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="h-5 w-5 text-primary animate-pulse">
                        <Brain className="h-5 w-5" />
                      </div>
                      {info.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">{info.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Voice Biomarkers */}
        <section className="border-b border-border/50">
          <div className="mx-auto max-w-7xl px-6 py-16 sm:py-24">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl" style={{ fontFamily: "var(--font-heading)" }}>
                Voice Biomarkers We Analyze
              </h2>
              <p className="text-lg text-muted-foreground">
                These acoustic features help identify potential Parkinson&apos;s Disease indicators.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {biomarkers.map((biomarker, idx) => (
                <Card key={idx} className="border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">{biomarker.name}</CardTitle>
                    <CardDescription>{biomarker.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-semibold">Unit:</span> {biomarker.unit}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-semibold">Normal Range:</span> {biomarker.normal}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="border-b border-border/50">
          <div className="mx-auto max-w-7xl px-6 py-16 sm:py-24">
            <div className="rounded-lg border-l-4 border-l-amber-500 bg-amber-50/50 p-6 dark:bg-amber-950/20">
              <div className="flex gap-4">
                <AlertCircle className="h-6 w-6 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                <div>
                  <h3 className="mb-2 font-semibold text-foreground">Important Disclaimer</h3>
                  <p className="text-sm text-muted-foreground">
                    NeuroVox is a screening and awareness tool only. It is NOT a medical diagnosis. Results should not be used as the sole basis for medical decisions. If you have concerns about Parkinson&apos;s Disease, please consult a qualified neurologist or healthcare professional for proper evaluation and diagnosis.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section>
          <div className="mx-auto max-w-7xl px-6 py-16 sm:py-24">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl" style={{ fontFamily: "var(--font-heading)" }}>
                Frequently Asked Questions
              </h2>
            </div>
            <div className="mx-auto max-w-3xl space-y-4">
              {faqs.map((faq, idx) => (
                <button
                  key={idx}
                  onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                  className="w-full text-left"
                >
                  <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-colors cursor-pointer">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between text-base">
                        {faq.q}
                        <span className="text-2xl text-muted-foreground">
                          {expandedFaq === idx ? "−" : "+"}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    {expandedFaq === idx && (
                      <CardContent className="pt-0">
                        <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                      </CardContent>
                    )}
                  </Card>
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </main>
  )
}
