"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, AlertCircle, TrendingUp, BarChart3, Clock } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts"

export default function ReportPage() {
  // Mock data for visualization
  const biomarkerData = [
    { name: "Jitter", value: 1.45, normal: 1.04, unit: "%" },
    { name: "Shimmer", value: 4.2, normal: 3.81, unit: "dB" },
    { name: "HNR", value: 18.5, normal: 20, unit: "dB" },
    { name: "DDA", value: 12.3, normal: 5, unit: "%" },
    { name: "PPE", value: 0.42, normal: 0.3, unit: "" },
  ]

  const trendData = [
    { date: "Test 1", jitter: 1.2, shimmer: 3.8, hnr: 21.5 },
    { date: "Test 2", jitter: 1.35, shimmer: 4.0, hnr: 20.2 },
    { date: "Test 3", jitter: 1.45, shimmer: 4.2, hnr: 18.5 },
  ]

  const riskScore = 42 // Moderate risk

  const downloadReport = () => {
    const reportContent = `
NEUROVOX - PARKINSON'S DISEASE SCREENING REPORT
================================================

Report Date: ${new Date().toLocaleDateString()}
Test Session: Test 3 (Most Recent)

PATIENT INFORMATION
-------------------
Status: Anonymous User
Age: 50+
Test Method: Voice Biomarker Analysis

BIOMARKER ANALYSIS RESULTS
--------------------------
Jitter: 1.45% (Normal < 1.04%)
Shimmer: 4.2 dB (Normal < 3.81 dB)
HNR: 18.5 dB (Normal > 20 dB)
F0: 145 Hz
DDA: 12.3% (Normal < 5%)
PPE: 0.42 (Normal < 0.3)

RISK ASSESSMENT
---------------
Risk Score: 42/100 (MODERATE INDICATION)
Interpretation: Voice biomarkers show some deviations from normal ranges

CLINICAL SIGNIFICANCE
---------------------
Several voice biomarkers show elevated values compared to age-matched controls:
- Jitter elevation suggests increased pitch variation
- Shimmer elevation indicates amplitude instability
- HNR reduction may indicate reduced voice clarity
- DDA elevation shows increased amplitude delta

RECOMMENDATIONS
---------------
1. Consult with a neurologist for clinical evaluation
2. Consider additional diagnostic tests (MRI, DaT scan)
3. Maintain healthy lifestyle and stress management
4. Schedule follow-up voice screening in 6-12 months
5. Discuss medication and treatment options with healthcare provider

IMPORTANT DISCLAIMER
--------------------
This report is for informational and screening purposes only. It is NOT a medical diagnosis. 
NeuroVox does not provide medical advice. Results should not be used as the sole basis for 
medical decisions. Please consult a qualified neurologist for proper evaluation and diagnosis.

For more information, visit: neurovox.app
    `

    const element = document.createElement("a")
    const file = new Blob([reportContent], { type: "text/plain" })
    element.href = URL.createObjectURL(file)
    element.download = `NeuroVox_Report_${new Date().toISOString().split("T")[0]}.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-16">
        {/* Hero Section */}
        <section className="border-b border-border/50 bg-gradient-to-br from-background to-secondary/20">
          <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl" style={{ fontFamily: "var(--font-heading)" }}>
                Voice Analysis Report
              </h1>
              <p className="text-lg text-muted-foreground">
                Detailed biomarker analysis and risk assessment from your latest voice test
              </p>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <div className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
          {/* Test Information */}
          <Card className="mb-8 border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Test Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">Test Date</p>
                  <p className="mt-1 text-lg font-semibold text-foreground">{new Date().toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Recording Duration</p>
                  <p className="mt-1 text-lg font-semibold text-foreground">15 seconds</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Audio Quality</p>
                  <p className="mt-1 text-lg font-semibold text-foreground">Good</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Risk Score */}
          <Card className="mb-8 border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Risk Assessment Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-8 sm:flex-row">
                {/* Gauge Visualization */}
                <div className="relative h-48 w-48 flex-shrink-0">
                  <svg viewBox="0 0 200 120" className="h-full w-full">
                    {/* Background arc */}
                    <path
                      d="M 20 100 A 80 80 0 0 1 180 100"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-border"
                    />
                    {/* Low risk arc (green) */}
                    <path
                      d="M 20 100 A 80 80 0 0 1 70 30"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-green-500"
                    />
                    {/* Moderate risk arc (yellow) */}
                    <path
                      d="M 70 30 A 80 80 0 0 1 130 30"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-yellow-500"
                    />
                    {/* High risk arc (red) */}
                    <path
                      d="M 130 30 A 80 80 0 0 1 180 100"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-red-500"
                    />
                    {/* Needle */}
                    <line x1="100" y1="100" x2="125" y2="55" stroke="currentColor" strokeWidth="3" className="text-foreground" />
                    <circle cx="100" cy="100" r="5" fill="currentColor" className="text-foreground" />
                  </svg>
                </div>

                {/* Score Details */}
                <div className="flex-1 space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Overall Risk Score</p>
                    <p className="mt-1 text-4xl font-bold text-yellow-600">42/100</p>
                    <p className="mt-2 text-base font-semibold text-foreground">MODERATE INDICATION</p>
                  </div>
                  <div className="rounded-lg border border-yellow-500/20 bg-yellow-50/50 p-4 dark:bg-yellow-950/20">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      Your voice biomarkers show some deviations from normal ranges. Consider consulting with a neurologist for further evaluation.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Biomarker Comparison Chart */}
          <Card className="mb-8 border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Biomarker Analysis
              </CardTitle>
              <CardDescription>Comparison of measured values vs. normal ranges</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={biomarkerData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                  <XAxis dataKey="name" className="text-xs text-muted-foreground" />
                  <YAxis className="text-xs text-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "0.5rem",
                    }}
                    labelStyle={{ color: "var(--foreground)" }}
                  />
                  <Legend />
                  <Bar dataKey="value" fill="var(--primary)" name="Your Result" />
                  <Bar dataKey="normal" fill="var(--muted-foreground)" name="Normal Range" opacity={0.5} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Trend Analysis */}
          <Card className="mb-8 border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Trend Analysis</CardTitle>
              <CardDescription>Biomarker values over recent tests</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                  <XAxis dataKey="date" className="text-xs text-muted-foreground" />
                  <YAxis className="text-xs text-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "0.5rem",
                    }}
                    labelStyle={{ color: "var(--foreground)" }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="jitter" stroke="var(--primary)" name="Jitter (%)" strokeWidth={2} />
                  <Line type="monotone" dataKey="shimmer" stroke="var(--accent)" name="Shimmer (dB)" strokeWidth={2} />
                  <Line type="monotone" dataKey="hnr" stroke="#3b82f6" name="HNR (dB)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Detailed Biomarker Breakdown */}
          <Card className="mb-8 border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Detailed Biomarker Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {biomarkerData.map((marker, idx) => (
                <div key={idx} className="space-y-2 border-b border-border/30 last:border-b-0 pb-4 last:pb-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">{marker.name}</span>
                    <span className="text-lg font-bold text-primary">
                      {marker.value} {marker.unit}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                      style={{ width: `${Math.min((marker.value / (marker.normal * 1.5)) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Normal range: {marker.normal} {marker.unit}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card className="mb-8 border-border/50 bg-blue-50/50 dark:bg-blue-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-primary" />
                Clinical Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 rounded-full bg-primary/20 px-2 py-0.5 text-xs font-semibold text-primary">1</span>
                  <span>Schedule a consultation with a qualified neurologist for comprehensive evaluation</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 rounded-full bg-primary/20 px-2 py-0.5 text-xs font-semibold text-primary">2</span>
                  <span>Consider additional diagnostic tests such as MRI or DaTscan if recommended by your doctor</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 rounded-full bg-primary/20 px-2 py-0.5 text-xs font-semibold text-primary">3</span>
                  <span>Maintain a healthy lifestyle with regular exercise and stress management</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 rounded-full bg-primary/20 px-2 py-0.5 text-xs font-semibold text-primary">4</span>
                  <span>Schedule follow-up voice screening in 6-12 months to monitor changes</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 rounded-full bg-primary/20 px-2 py-0.5 text-xs font-semibold text-primary">5</span>
                  <span>Discuss findings with your healthcare provider for personalized guidance</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Important Disclaimer */}
          <Card className="mb-8 border-l-4 border-l-amber-500 border-border/50 bg-amber-50/50 dark:bg-amber-950/20">
            <CardHeader>
              <CardTitle className="text-base">Important Medical Disclaimer</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                This report is for informational and screening purposes only and does NOT constitute a medical diagnosis. NeuroVox is a screening tool designed to identify potential voice biomarkers associated with Parkinson&apos;s Disease. It is not a substitute for professional medical evaluation.
              </p>
              <p className="mt-2">
                Results should not be used as the sole basis for medical decisions. Please consult a qualified neurologist or healthcare professional for proper evaluation, diagnosis, and treatment recommendations.
              </p>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button onClick={downloadReport} className="flex-1 gap-2 bg-primary hover:bg-primary/90">
              <Download className="h-4 w-4" />
              Download Report
            </Button>
            <a href="/test" className="flex-1">
              <Button variant="outline" className="w-full">
                Take Another Test
              </Button>
            </a>
            <a href="/" className="flex-1">
              <Button variant="outline" className="w-full">
                Back to Home
              </Button>
            </a>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
