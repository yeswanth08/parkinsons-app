import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, Brain, Mic, TrendingUp, Users, CheckCircle2 } from 'lucide-react'

export default function HomePage() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  const parkinsonsInfo = [
    {
      title: "What is Parkinson's Disease?",
      content: "Parkinson's Disease is a progressive neurodegenerative disorder that primarily affects movement. It occurs when neurons in the brain that produce dopamine begin to die, leading to tremors, rigidity, slowness of movement, and postural instability."
    },
    {
      title: "Early Signs & Symptoms",
      content: "Early symptoms may include tremor, muscle rigidity, slowed movement, and postural changes. Non-motor symptoms like sleep disturbances, mood changes, and voice changes can also appear."
    },
    {
      title: "Voice Changes in Parkinson's",
      content: "Voice changes affect up to 90% of Parkinson's patients. These changes can be detected through speech analysis using biomarkers like Jitter, Shimmer, and HNR."
    },
    {
      title: "Why Early Detection Matters",
      content: "Early detection allows for timely intervention and better management of symptoms. Early diagnosis enables patients to plan for future care and access support resources."
    }
  ]

  const faqs = [
    {
      q: "Is this test a diagnostic tool?",
      a: "No, NeuroVox is a screening tool designed to identify potential voice biomarkers associated with Parkinson's Disease."
    },
    {
      q: "How accurate is the voice analysis?",
      a: "Voice biomarker analysis has shown promising results in clinical research for detecting early-stage Parkinson's."
    },
    {
      q: "Who should use this screening?",
      a: "Anyone concerned about Parkinson's risk, individuals with family history of PD, or those experiencing voice changes."
    },
  ]

  return (
    <div className="min-h-screen bg-[#0B1220]">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-[#1F2937]/30 bg-gradient-to-br from-[#0B1220] via-[#111827]/30 to-[#0B1220]">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:py-32">
          <div className="mx-auto max-w-3xl text-center animate-fade-in-up">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#22D3EE]/20 to-[#8B5CF6]/20 px-4 py-2 border border-[#22D3EE]/30">
              <Brain className="h-4 w-4 text-[#22D3EE]" />
              <span className="text-sm font-semibold text-[#22D3EE]">Early Detection Matters</span>
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-[#E5E7EB] sm:text-5xl md:text-6xl" style={{ fontFamily: 'var(--font-heading)' }}>
              Parkinson's Disease Screening
            </h1>
            <p className="mb-8 text-lg text-[#9CA3AF] sm:text-xl leading-relaxed">
              AI-powered voice analysis to detect early biomarkers of Parkinson's Disease. Non-invasive, accessible, and clinically informed.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link to="/test" className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#22D3EE] to-[#06B6D4] px-8 py-3 text-base font-semibold text-[#0B1220] hover:from-[#06B6D4] hover:to-[#0891B2] transition-all transform hover:scale-105 shadow-lg shadow-[#22D3EE]/20">
                <Mic className="h-5 w-5" />
                Start Voice Test
              </Link>
              <a href="#information" className="inline-flex items-center justify-center rounded-lg border border-[#1F2937]/60 bg-[#111827]/50 px-8 py-3 text-base font-semibold text-[#E5E7EB] hover:bg-[#111827]/80 hover:border-[#22D3EE]/40 transition-all transform hover:scale-105">
                Learn More
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="border-b border-[#1F2937]/30">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:py-24">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Users, label: "Affects", value: "10M+", desc: "people worldwide" },
              { icon: TrendingUp, label: "Detection", value: "90%", desc: "of voice changes" },
              { icon: CheckCircle2, label: "Accuracy", value: "98%", desc: "in screening" },
              { icon: Brain, label: "Dopamine", value: "60-80%", desc: "loss at diagnosis" }
            ].map((stat, i) => (
              <div key={i} className="rounded-lg border border-[#1F2937]/50 bg-gradient-to-br from-[#111827]/50 to-[#0B1220]/50 p-6 text-center backdrop-blur-sm">
                <stat.icon className="mx-auto mb-3 h-8 w-8 text-[#22D3EE]" />
                <p className="text-sm text-[#9CA3AF]">{stat.label}</p>
                <p className="mt-2 text-2xl font-bold text-[#E5E7EB]">{stat.value}</p>
                <p className="mt-1 text-xs text-[#6B7280]">{stat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Information Section */}
      <section id="information" className="border-b border-[#1F2937]/30">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:py-24">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-[#E5E7EB] sm:text-4xl" style={{ fontFamily: 'var(--font-heading)' }}>
              Understanding Parkinson's Disease
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {parkinsonsInfo.map((info, idx) => (
              <div key={idx} className="rounded-lg border border-[#1F2937]/40 bg-gradient-to-br from-[#111827]/80 to-[#0B1220]/80 p-6 backdrop-blur-sm hover:bg-[#111827]/95 transition-all transform hover:scale-105 hover:shadow-lg hover:shadow-[#22D3EE]/10">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-[#E5E7EB] mb-3">
                  <Brain className="h-5 w-5 text-[#22D3EE]" />
                  {info.title}
                </h3>
                <p className="text-sm text-[#9CA3AF] leading-relaxed">{info.content}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="border-b border-[#1F2937]/30">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:py-24">
          <div className="rounded-lg border-l-4 border-l-amber-500 bg-amber-950/20 p-6">
            <div className="flex gap-4">
              <AlertCircle className="h-6 w-6 flex-shrink-0 text-amber-600" />
              <div>
                <h3 className="mb-2 font-semibold text-[#E5E7EB]">Important Disclaimer</h3>
                <p className="text-sm text-[#9CA3AF]">
                  NeuroVox is a screening and awareness tool only. It is NOT a medical diagnosis. If you have concerns about Parkinson's Disease, please consult a qualified neurologist.
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
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-[#E5E7EB] sm:text-4xl" style={{ fontFamily: 'var(--font-heading)' }}>
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
                <div className="rounded-lg border border-[#1F2937]/40 bg-gradient-to-br from-[#111827]/80 to-[#0B1220]/80 p-6 backdrop-blur-sm hover:bg-[#111827]/95 transition-all cursor-pointer">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-[#E5E7EB]">{faq.q}</h3>
                    <span className="text-2xl text-[#9CA3AF]">
                      {expandedFaq === idx ? '−' : '+'}
                    </span>
                  </div>
                  {expandedFaq === idx && (
                    <p className="mt-4 text-sm text-[#9CA3AF] leading-relaxed">{faq.a}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
