import { useRef } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { RootState } from '../store/store'
import { FileText, ArrowLeft } from 'lucide-react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export default function ReportPage() {
  const { analysisResults } = useSelector((state: RootState) => state.results)
  const { age, gender } = useSelector((state: RootState) => state.user)
  const reportRef = useRef<HTMLDivElement>(null)

  if (!analysisResults) {
    return (
      <div className="min-h-screen bg-[#0B1220]">
        <section className="border-b border-[#1F2937]/30 bg-gradient-to-br from-[#0B1220] via-[#111827]/30 to-[#0B1220]">
          <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
            <div className="text-center">
              <FileText className="mx-auto h-12 w-12 text-[#9CA3AF] mb-4" />
              <h1 className="mb-4 text-3xl font-bold tracking-tight text-[#E5E7EB]">No Results Yet</h1>
              <p className="text-lg text-[#9CA3AF] mb-8">Please complete a voice test first to view your report.</p>
              <Link to="/test" className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#22D3EE] to-[#06B6D4] px-8 py-3 text-base font-semibold text-[#0B1220] hover:from-[#06B6D4] hover:to-[#0891B2] transition-all transform hover:scale-105 shadow-lg shadow-[#22D3EE]/20">
                <ArrowLeft className="h-4 w-4" />
                Back to Test
              </Link>
            </div>
          </div>
        </section>
      </div>
    )
  }

  const downloadReport = async () => {
    if (!reportRef.current) return
    
    try {
      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: '#0B1220',
        scale: 2,
      })
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })
      
      const imgWidth = 210
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      let position = 0
      
      const pageHeight = pdf.internal.pageSize.getHeight()
      const imgData = canvas.toDataURL('image/png')
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }
      
      pdf.save(`neurovox-report-${new Date().getTime()}.pdf`)
    } catch (error) {
      console.error('Error generating PDF:', error)
    }
  }

  const metricsData = [
    { name: 'Jitter', value: parseFloat(analysisResults.jitter) || 0 },
    { name: 'Shimmer', value: parseFloat(analysisResults.shimmer) || 0 },
    { name: 'HNR', value: parseFloat(analysisResults.hnr) || 0 },
    { name: 'DDA', value: parseFloat(analysisResults.dda) || 0 },
  ]

  const radarData = [
    { metric: 'Jitter', value: Math.min(parseFloat(analysisResults.jitter) || 0, 100) },
    { metric: 'Shimmer', value: Math.min(parseFloat(analysisResults.shimmer) || 0, 100) },
    { metric: 'HNR', value: Math.min(parseFloat(analysisResults.hnr) || 0, 100) },
    { metric: 'F0', value: Math.min(analysisResults.f0 / 2 || 0, 100) },
    { metric: 'DDA', value: Math.min(parseFloat(analysisResults.dda) || 0, 100) },
    { metric: 'PPE', value: Math.min(parseFloat(analysisResults.ppe) || 0, 100) },
  ]

  return (
    <div className="min-h-screen bg-[#0B1220]">
      <section className="border-b border-[#1F2937]/30 bg-gradient-to-br from-[#0B1220] via-[#111827]/30 to-[#0B1220]">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
          <div className="animate-fade-in-up">
            <h1 className="mb-4 text-3xl font-bold tracking-tight text-[#E5E7EB] sm:text-4xl">Your Report</h1>
            <p className="text-lg text-[#9CA3AF]">Complete voice analysis and biomarker results</p>
          </div>
        </div>
      </section>

      <div ref={reportRef} className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
        {/* Website Header and Disclaimer */}
        <div className="mb-8 text-center pb-8 border-b border-[#1F2937]/40">
          <h2 className="text-2xl font-bold text-[#22D3EE] mb-2">NeuroVox</h2>
          <p className="text-sm text-[#9CA3AF] mb-4">Parkinson's Disease Voice Screening System</p>
          <p className="text-xs text-[#6B7280] italic">
            DISCLAIMER: This is a screening tool only and NOT a medical diagnosis. 
            Please consult with a qualified neurologist for professional evaluation.
          </p>
          <p className="text-xs text-[#6B7280] mt-2">Report Generated: {new Date(analysisResults.timestamp).toLocaleString()}</p>
        </div>
        <div className="mb-8 rounded-lg border border-[#1F2937]/40 bg-gradient-to-br from-[#111827]/80 to-[#0B1220]/80 backdrop-blur-sm p-6">
          <h2 className="text-xl font-semibold text-[#E5E7EB] mb-4">Patient Information</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-[#9CA3AF]">Age</p>
              <p className="text-lg font-semibold text-[#E5E7EB]">{age}</p>
            </div>
            <div>
              <p className="text-sm text-[#9CA3AF]">Gender</p>
              <p className="text-lg font-semibold text-[#E5E7EB] capitalize">{gender}</p>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-[#E5E7EB] mb-6">Voice Metrics Visualization</h2>
          
          <div className="grid gap-6 mb-8">
            {/* Bar Chart */}
            <div className="rounded-lg border border-[#1F2937]/40 bg-gradient-to-br from-[#111827]/80 to-[#0B1220]/80 backdrop-blur-sm p-6">
              <h3 className="text-lg font-semibold text-[#E5E7EB] mb-4">Key Metrics Comparison</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metricsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                  <XAxis dataKey="name" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #1F2937', borderRadius: '8px' }} />
                  <Bar dataKey="value" fill="#22D3EE" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Radar Chart */}
            <div className="rounded-lg border border-[#1F2937]/40 bg-gradient-to-br from-[#111827]/80 to-[#0B1220]/80 backdrop-blur-sm p-6">
              <h3 className="text-lg font-semibold text-[#E5E7EB] mb-4">Voice Profile Analysis</h3>
              <ResponsiveContainer width="100%" height={350}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#1F2937" />
                  <PolarAngleAxis dataKey="metric" stroke="#9CA3AF" />
                  <PolarRadiusAxis stroke="#9CA3AF" />
                  <Radar name="Voice Metrics" dataKey="value" stroke="#22D3EE" fill="#22D3EE" fillOpacity={0.6} />
                  <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #1F2937', borderRadius: '8px' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Metrics Trend */}
            <div className="rounded-lg border border-[#1F2937]/40 bg-gradient-to-br from-[#111827]/80 to-[#0B1220]/80 backdrop-blur-sm p-6">
              <h3 className="text-lg font-semibold text-[#E5E7EB] mb-4">Risk Score Trend</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={[{ name: 'Current', score: analysisResults.riskScore }]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                  <XAxis dataKey="name" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" domain={[0, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #1F2937', borderRadius: '8px' }} />
                  <Line type="monotone" dataKey="score" stroke="#8B5CF6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="mb-8 rounded-lg border border-[#1F2937]/40 bg-gradient-to-br from-[#111827]/80 to-[#0B1220]/80 backdrop-blur-sm p-6">
          <h2 className="text-xl font-semibold text-[#E5E7EB] mb-6">Voice Biomarker Results</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border border-[#22D3EE]/30 bg-gradient-to-br from-[#22D3EE]/10 to-[#06B6D4]/5 p-4">
              <p className="text-sm text-[#9CA3AF]">Jitter</p>
              <p className="mt-2 text-2xl font-bold text-[#22D3EE]">{analysisResults.jitter}%</p>
              <p className="mt-1 text-xs text-[#6B7280]">Frequency variation</p>
            </div>
            <div className="rounded-lg border border-[#8B5CF6]/30 bg-gradient-to-br from-[#8B5CF6]/10 to-[#A78BFA]/5 p-4">
              <p className="text-sm text-[#9CA3AF]">Shimmer</p>
              <p className="mt-2 text-2xl font-bold text-[#8B5CF6]">{analysisResults.shimmer} dB</p>
              <p className="mt-1 text-xs text-[#6B7280]">Amplitude variation</p>
            </div>
            <div className="rounded-lg border border-[#06B6D4]/30 bg-gradient-to-br from-[#06B6D4]/10 to-[#0891B2]/5 p-4">
              <p className="text-sm text-[#9CA3AF]">HNR</p>
              <p className="mt-2 text-2xl font-bold text-[#06B6D4]">{analysisResults.hnr} dB</p>
              <p className="mt-1 text-xs text-[#6B7280]">Voice clarity</p>
            </div>
            <div className="rounded-lg border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-cyan-400/5 p-4">
              <p className="text-sm text-[#9CA3AF]">F0</p>
              <p className="mt-2 text-2xl font-bold text-cyan-400">{analysisResults.f0} Hz</p>
              <p className="mt-1 text-xs text-[#6B7280]">Fundamental frequency</p>
            </div>
            <div className="rounded-lg border border-teal-500/30 bg-gradient-to-br from-teal-500/10 to-teal-400/5 p-4">
              <p className="text-sm text-[#9CA3AF]">DDA</p>
              <p className="mt-2 text-2xl font-bold text-teal-400">{analysisResults.dda}%</p>
              <p className="mt-1 text-xs text-[#6B7280]">Delta amplitude</p>
            </div>
            <div className="rounded-lg border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-emerald-400/5 p-4">
              <p className="text-sm text-[#9CA3AF]">PPE</p>
              <p className="mt-2 text-2xl font-bold text-emerald-400">{analysisResults.ppe}</p>
              <p className="mt-1 text-xs text-[#6B7280]">Pitch perturbation</p>
            </div>
          </div>
        </div>

        {/* Risk Assessment */}
        <div className="mb-8 rounded-lg border border-[#1F2937]/40 bg-gradient-to-br from-[#111827]/80 to-[#0B1220]/80 backdrop-blur-sm p-6">
          <h2 className="text-xl font-semibold text-[#E5E7EB] mb-4">Risk Assessment</h2>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="w-full bg-[#1F2937] rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#22D3EE] to-[#8B5CF6] h-full transition-all"
                  style={{ width: `${analysisResults.riskScore}%` }}
                />
              </div>
            </div>
            <span className="text-2xl font-bold text-[#E5E7EB]">{analysisResults.riskScore}%</span>
          </div>
          <p className="mt-4 text-sm text-[#9CA3AF]">
            {analysisResults.riskScore < 30 && "Low indication of risk"}
            {analysisResults.riskScore >= 30 && analysisResults.riskScore < 70 && "Moderate indication - consult specialist"}
            {analysisResults.riskScore >= 70 && "Higher indication - urgent specialist consultation recommended"}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 sm:flex-row flex-col">
          <button
            onClick={downloadReport}
            className="flex-1 rounded-lg bg-gradient-to-r from-[#22D3EE] to-[#06B6D4] px-6 py-3 text-base font-semibold text-[#0B1220] hover:from-[#06B6D4] hover:to-[#0891B2] transition-all transform hover:scale-105 shadow-lg shadow-[#22D3EE]/20"
          >
            Download Report
          </button>
          <Link to="/test" className="flex-1 rounded-lg border border-[#1F2937]/60 bg-transparent px-6 py-3 text-base font-semibold text-[#E5E7EB] hover:bg-[#1F2937]/20 transition-all text-center">
            New Test
          </Link>
        </div>
      </div>
    </div>
  )
}
