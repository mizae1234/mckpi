'use client'

import { useState, useRef, useEffect } from 'react'
import { CheckCircle2 } from 'lucide-react'

// Simple mock for R2 video or actual mp4. If youtube, we'd need iframe logic.
// For MKPI, contentUrl points to R2 bucket.

export default function VideoPlayerComponent({ step, courseId, onComplete }: { step: any, courseId: string, onComplete: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [percent, setPercent] = useState(step.watchPercent || 0)
  const [isUpdating, setIsUpdating] = useState(false)
  
  // To avoid spamming API
  const lastUpdatedPercent = useRef(percent)

  const handleTimeUpdate = () => {
    if (!videoRef.current || step.is_completed || isUpdating) return
    
    // Prevent skipping forward roughly (simple check, not foolproof without server streaming)
    const currentPercent = Math.floor((videoRef.current.currentTime / videoRef.current.duration) * 100)
    
    if (currentPercent > percent && currentPercent > lastUpdatedPercent.current + 5) {
      // Update progress every 5%
      updateProgress(currentPercent)
    }
  }

  const handleEnded = () => {
    if (!step.is_completed) {
      updateProgress(100)
    }
  }

  const updateProgress = async (newPercent: number) => {
    setIsUpdating(true)
    try {
      const res = await fetch('/api/employee/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stepId: step.id,
          courseId: courseId,
          watchPercent: newPercent
        })
      })

      if (res.ok) {
        lastUpdatedPercent.current = newPercent
        setPercent(newPercent)
        
        if (newPercent >= step.minWatchPercent && !step.is_completed) {
          onComplete()
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-black">
      {step.contentUrl ? (
        <video 
          ref={videoRef}
          src={step.contentUrl} 
          controls 
          controlsList="nodownload"
          className="w-full h-full object-contain"
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
        />
      ) : (
        <div className="flex items-center justify-center h-full text-white/50">
          วิดีโอยังไม่ถูกอัปโหลด
        </div>
      )}
      
      {/* Progress Overlay */}
      <div className="absolute top-4 left-4 flex gap-2">
        {step.is_completed && (
          <div className="bg-green-500/90 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 backdrop-blur-sm">
            <CheckCircle2 className="w-4 h-4" /> ดูจบแล้ว
          </div>
        )}
      </div>
    </div>
  )
}
