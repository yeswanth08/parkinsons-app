# NeuroVox - Parkinson's Disease Screening Application
## React.js + Redux + React Router v6

### Project Structure

```
src/
├── main.tsx                    # Entry point
├── App.tsx                     # Main app with routing
├── index.css                   # Global styles with Tailwind
├── store/
│   ├── store.ts               # Redux store configuration
│   └── slices/
│       ├── userSlice.ts       # User state (age, gender)
│       ├── recordingSlice.ts  # Recording state
│       └── resultsSlice.ts    # Analysis results
├── layouts/
│   └── Layout.tsx             # Main layout wrapper
├── components/
│   ├── Navbar.tsx             # Navigation component
│   ├── Footer.tsx             # Footer component
│   └── UserFormDialog.tsx     # Age/Gender form modal
├── pages/
│   ├── HomePage.tsx           # Home - Parkinson's education
│   ├── TestPage.tsx           # Voice recording (10-second limit)
│   ├── ReportPage.tsx         # Analysis results
│   └── ContactPage.tsx        # Doctor finder with map
```

### Key Features Implemented

#### 1. **Complete React Migration from Next.js**
- ✅ Vite as build tool (faster than Next.js)
- ✅ React Router v6 for client-side routing (no Next.js)
- ✅ Redux Toolkit for state management
- ✅ Pure React components (no server components)

#### 2. **Test Page - Voice Recording**
- ✅ **10-second recording limit** enforced
- ✅ **Age/Gender Form Modal** opens on "Start Test" button click
- ✅ Form validation before recording starts
- ✅ User data stored in Redux for API calls
- ✅ Live waveform visualization (animated bars)
- ✅ Recording timer with countdown
- ✅ Real-time frequency analysis
- ✅ Soft dark theme with cyan/purple accents

#### 3. **User Form Dialog**
- Input fields: Age (number), Gender (dropdown: Male/Female/Other)
- Form validation before allowing recording
- Data persisted in Redux store
- Included in network call when submitting results

#### 4. **Color Scheme - Soft Dark Theme**
- Background: #0B1220 (soft navy, not harsh black)
- Cards: #111827 with glassmorphism
- Text: #E5E7EB (light gray)
- Accents: #22D3EE (cyan) and #8B5CF6 (purple)
- Borders: #1F2937 (subtle, muted)

#### 5. **Pages**
- **Home**: Parkinson's disease information, FAQs, biomarkers explanation
- **Test**: Voice recording with form, 10-second limit, live waveform
- **Report**: Analysis results with biomarkers visualization
- **Contact**: Doctor finder with geolocation and map

#### 6. **Animations**
- Recording pulse effect with ripple rings
- Waveform bars with dynamic animation
- Hover lift on cards
- Fade-in animations on page load
- Smooth transitions throughout

### Technology Stack

- **Frontend Framework**: React 18.3
- **Routing**: React Router v6
- **State Management**: Redux Toolkit
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS
- **UI Icons**: Lucide React
- **Charts**: Recharts
- **HTTP Client**: Axios
- **Language**: TypeScript

### Running the Application

```bash
# Start development server
npm run dev

# Build for production
npm build

# Preview production build
npm preview
```

### Redux Store Structure

```typescript
// User state
{
  age: number | null
  gender: string | null
}

// Recording state
{
  isRecording: boolean
  recordingTime: number
  audioURL: string | null
  audioData: Float32Array | null
}

// Results state
{
  analysisResults: {
    jitter: number
    shimmer: number
    hnr: number
    f0: number
    dda: number
    ppe: number
    riskScore: number
  } | null
  isAnalyzing: boolean
}
```

### Key Implementation Details

#### TestPage Recording Logic
1. User clicks "Start Voice Test"
2. UserFormDialog modal opens with age/gender form
3. User fills form and submits
4. Form data saved to Redux
5. Recording starts (10 seconds max)
6. Live waveform visualization plays
7. After 10 seconds, recording stops automatically
8. Results sent with age/gender in payload

#### Network Call Example
```javascript
const payload = {
  age: userState.age,
  gender: userState.gender,
  audioData: recordingState.audioData,
  duration: 10
}
// POST /api/analyze with payload
```

### Soft Dark Theme Highlights
- No harsh blacks, using #0B1220 for warmth
- Subtle shadows and reduced contrast
- Glassmorphism effects with backdrop blur
- Smooth gradients instead of flat colors
- Premium feel while maintaining medical professionalism

### Next Steps for Backend Integration
1. Create API endpoint at `/api/analyze`
2. Accept age, gender, and audio data
3. Process audio with ML model
4. Return biomarker values
5. Store results in database

---

**Status**: ✅ Complete React.js migration done. Application ready for development.
**Dev Server**: Running on http://localhost:5173
