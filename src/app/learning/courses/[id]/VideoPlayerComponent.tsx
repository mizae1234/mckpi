'use client'

import { useState, useRef, useEffect } from 'react'
import { CheckCircle2 } from 'lucide-react'

export default function VideoPlayerComponent({ step, courseId, onComplete, onProgress }: { step: any, courseId: string, onComplete: () => void, onProgress?: (stepId: string, percent: number) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [percent, setPercent] = useState(step.watchPercent || 0)
  const [isUpdating, setIsUpdating] = useState(false)
  
  const lastUpdatedPercent = useRef(percent)
  // The farthest point the user has legitimately watched to (by playing, not seeking)
  const maxTimeWatchedRef = useRef(0)
  // The last known currentTime from the previous timeupdate tick
  const lastTimeRef = useRef(0)
  const isSnappingBack = useRef(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video || step.is_completed) return

    const onSeeking = () => {
      if (isSnappingBack.current) return
      if (video.currentTime > maxTimeWatchedRef.current + 2) {
        isSnappingBack.current = true
        video.currentTime = maxTimeWatchedRef.current
        setTimeout(() => { isSnappingBack.current = false }, 200)
      }
    }

    const onTimeUpdate = () => {
      if (isSnappingBack.current) return

      const current = video.currentTime
      const last = lastTimeRef.current
      
      // Only advance maxTimeWatched if the jump is small (normal playback, not a seek)
      // Normal playback advances ~0.25s per timeupdate tick. A jump > 3s means a seek.
      const delta = current - last
      if (delta > 0 && delta < 3) {
        // This is normal playback progression
        if (current > maxTimeWatchedRef.current) {
          maxTimeWatchedRef.current = current
        }
      }
      // If delta is negative (rewinding) or very large (seeking), don't update max
      
      lastTimeRef.current = current
    }

    video.addEventListener('seeking', onSeeking)
    video.addEventListener('timeupdate', onTimeUpdate)
    return () => {
      video.removeEventListener('seeking', onSeeking)
      video.removeEventListener('timeupdate', onTimeUpdate)
    }
  }, [step.is_completed])

  const handleLoadedMetadata = () => {
    if (videoRef.current && step.watchPercent) {
      const initialMaxTime = (step.watchPercent / 100) * videoRef.current.duration
      maxTimeWatchedRef.current = initialMaxTime
      lastTimeRef.current = initialMaxTime
      if (initialMaxTime > 0 && !step.is_completed) {
        isSnappingBack.current = true
        videoRef.current.currentTime = initialMaxTime
        setTimeout(() => { isSnappingBack.current = false }, 300)
      }
    }
  }

  // React onTimeUpdate for progress saving (separate from the DOM listener for seek protection)
  const handleTimeUpdateForProgress = () => {
    if (!videoRef.current || step.is_completed || isUpdating) return
    
    const currentPercent = Math.floor((videoRef.current.currentTime / videoRef.current.duration) * 100)
    
    if (currentPercent > percent && currentPercent > lastUpdatedPercent.current + 5) {
      updateProgress(currentPercent)
    }
  }

  const handleEnded = () => {
    if (!step.is_completed) {
      maxTimeWatchedRef.current = videoRef.current?.duration || 0
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
        onProgress?.(step.id, newPercent)
        
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
    <div className="flex flex-col h-full bg-black relative">
      {step.contentUrl ? (
        <video 
          ref={videoRef}
          src={step.contentUrl} 
          controls 
          controlsList="nodownload noplaybackrate"
          disablePictureInPicture
          className="w-full h-full object-contain"
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdateForProgress}
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
