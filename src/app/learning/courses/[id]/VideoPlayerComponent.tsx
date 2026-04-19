'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { CheckCircle2 } from 'lucide-react'

// ── Helpers ──

function cleanVideoUrl(url: string): string {
  if (!url) return ''
  let cleaned = url.trim()
  if (cleaned.includes('<iframe')) {
    const match = cleaned.match(/src="([^"]+)"/)
    if (match) cleaned = match[1]
  }
  if (
    cleaned.startsWith('www.youtube') ||
    cleaned.startsWith('youtube.com') ||
    cleaned.startsWith('youtu.be') ||
    cleaned.startsWith('www.youtu')
  ) {
    cleaned = 'https://' + cleaned
  }
  return cleaned
}

function extractYouTubeId(url: string): string | null {
  // youtu.be/VIDEO_ID
  let match = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/)
  if (match) return match[1]
  // youtube.com/watch?v=VIDEO_ID
  match = url.match(/[?&]v=([a-zA-Z0-9_-]+)/)
  if (match) return match[1]
  // youtube.com/embed/VIDEO_ID
  match = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/)
  if (match) return match[1]
  return null
}

// ── Component ──

export default function VideoPlayerComponent({
  step,
  courseId,
  onComplete,
  onProgress,
}: {
  step: any
  courseId: string
  onComplete: () => void
  onProgress?: (stepId: string, percent: number) => void
}) {
  const [percent, setPercent] = useState(step.watchPercent || 0)
  const isUpdatingRef = useRef(false)

  // Native video refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const lastUpdatedPercent = useRef(percent)
  const maxTimeWatchedRef = useRef(0)
  const lastTimeRef = useRef(0)
  const isSnappingBack = useRef(false)

  // YouTube refs
  const ytPlayerRef = useRef<any>(null)
  const ytIntervalRef = useRef<any>(null)
  const ytDurationRef = useRef(0)

  const cleanUrl = cleanVideoUrl(step.contentUrl)
  const youtubeId = extractYouTubeId(cleanUrl)

  // ── shared: save progress ──
  const updateProgress = useCallback(async (newPercent: number) => {
    if (isUpdatingRef.current) return
    isUpdatingRef.current = true
    try {
      const res = await fetch('/api/employee/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stepId: step.id,
          courseId,
          watchPercent: newPercent,
        }),
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
      isUpdatingRef.current = false
    }
  }, [step.id, step.minWatchPercent, step.is_completed, courseId, onComplete, onProgress])

  // ═══════════════════════════════════════
  //  NATIVE <video> LOGIC  (.mp4)
  // ═══════════════════════════════════════
  useEffect(() => {
    if (youtubeId) return
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
      const delta = current - lastTimeRef.current
      if (delta > 0 && delta < 3) {
        if (current > maxTimeWatchedRef.current) {
          maxTimeWatchedRef.current = current
        }
      }
      lastTimeRef.current = current
    }

    video.addEventListener('seeking', onSeeking)
    video.addEventListener('timeupdate', onTimeUpdate)
    return () => {
      video.removeEventListener('seeking', onSeeking)
      video.removeEventListener('timeupdate', onTimeUpdate)
    }
  }, [step.is_completed, youtubeId])

  const handleNativeLoaded = () => {
    if (videoRef.current && step.watchPercent) {
      const t = (step.watchPercent / 100) * videoRef.current.duration
      maxTimeWatchedRef.current = t
      lastTimeRef.current = t
      if (t > 0 && !step.is_completed) {
        isSnappingBack.current = true
        videoRef.current.currentTime = t
        setTimeout(() => { isSnappingBack.current = false }, 300)
      }
    }
  }

  const handleNativeProgress = () => {
    if (!videoRef.current || step.is_completed || isUpdatingRef.current) return
    const pct = Math.floor((videoRef.current.currentTime / videoRef.current.duration) * 100)
    if (pct > percent && pct > lastUpdatedPercent.current + 5) {
      updateProgress(pct)
    }
  }

  const handleNativeEnded = () => {
    if (!step.is_completed) {
      maxTimeWatchedRef.current = videoRef.current?.duration || 0
      updateProgress(100)
    }
  }

  // ═══════════════════════════════════════
  //  YOUTUBE IFRAME API LOGIC
  // ═══════════════════════════════════════
  useEffect(() => {
    if (!youtubeId) return

    // Load YouTube IFrame API script if not already loaded
    if (!(window as any).YT) {
      const existingScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]')
      if (!existingScript) {
        const tag = document.createElement('script')
        tag.src = 'https://www.youtube.com/iframe_api'
        document.head.appendChild(tag)
      }
    }

    // Wait for API to load, then init
    const initPlayer = () => {
      // Guard: check if div still exists (component might have unmounted)
      const container = document.getElementById(`yt-player-${step.id}`)
      if (!container) return

      try {
        ytPlayerRef.current = new (window as any).YT.Player(`yt-player-${step.id}`, {
          videoId: youtubeId,
          width: '100%',
          height: '100%',
          playerVars: {
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
          },
          events: {
            onReady: (e: any) => {
              ytDurationRef.current = e.target.getDuration() || 0

              // Resume from previous watch position
              if (step.watchPercent && ytDurationRef.current > 0 && !step.is_completed) {
                const seekTo = (step.watchPercent / 100) * ytDurationRef.current
                maxTimeWatchedRef.current = seekTo
                lastTimeRef.current = seekTo
                e.target.seekTo(seekTo, true)
              }
            },
            onStateChange: (e: any) => {
              const YT = (window as any).YT
              if (e.data === YT.PlayerState.PLAYING) {
                if (ytIntervalRef.current) clearInterval(ytIntervalRef.current)
                ytIntervalRef.current = setInterval(() => {
                  if (!ytPlayerRef.current?.getCurrentTime) return
                  const current = ytPlayerRef.current.getCurrentTime() || 0
                  const duration = ytPlayerRef.current.getDuration() || 0
                  if (duration === 0) return

                  const delta = current - lastTimeRef.current
                  if (delta > 0 && delta < 3) {
                    if (current > maxTimeWatchedRef.current) {
                      maxTimeWatchedRef.current = current
                    }
                  }

                  if (current > maxTimeWatchedRef.current + 3) {
                    ytPlayerRef.current.seekTo(maxTimeWatchedRef.current, true)
                  } else {
                    lastTimeRef.current = current
                  }

                  const pct = Math.floor((current / duration) * 100)
                  if (pct > lastUpdatedPercent.current + 5) {
                    updateProgress(pct)
                  }
                }, 1000)
              } else if (e.data === YT.PlayerState.PAUSED || e.data === YT.PlayerState.BUFFERING) {
                if (ytIntervalRef.current) clearInterval(ytIntervalRef.current)
              } else if (e.data === YT.PlayerState.ENDED) {
                if (ytIntervalRef.current) clearInterval(ytIntervalRef.current)
                if (!step.is_completed) {
                  updateProgress(100)
                }
              }
            },
          },
        })
      } catch (err) {
        console.error('Failed to init YouTube player:', err)
      }
    }

    if ((window as any).YT && (window as any).YT.Player) {
      // API already loaded, init immediately
      setTimeout(initPlayer, 100) // small delay to ensure DOM is mounted
    } else {
      (window as any).onYouTubeIframeAPIReady = initPlayer
    }

    return () => {
      if (ytIntervalRef.current) clearInterval(ytIntervalRef.current)
      if (ytPlayerRef.current?.destroy) {
        try { ytPlayerRef.current.destroy() } catch (_) {}
      }
      ytPlayerRef.current = null
    }
  }, [youtubeId, step.id, updateProgress])

  // ── RENDER ──
  return (
    <div className="flex flex-col h-full bg-black relative w-full items-center justify-center">
      {!cleanUrl ? (
        <div className="flex items-center justify-center h-full text-white/50 min-h-[300px]">
          วิดีโอยังไม่ถูกอัปโหลด
        </div>
      ) : youtubeId ? (
        /* YouTube: render a div that the IFrame API will replace */
        <div className="w-full h-full flex items-center justify-center" style={{ minHeight: '300px' }}>
          <div id={`yt-player-${step.id}`} className="w-full h-full" />
        </div>
      ) : (
        /* MP4 / direct file: native video player */
        <video
          ref={videoRef}
          src={cleanUrl}
          controls
          controlsList="nodownload noplaybackrate"
          disablePictureInPicture
          className="w-full h-full object-contain"
          onLoadedMetadata={handleNativeLoaded}
          onTimeUpdate={handleNativeProgress}
          onEnded={handleNativeEnded}
        />
      )}

      {/* Progress Overlay */}
      <div className="absolute top-4 left-4 flex gap-2 pointer-events-none z-10">
        {step.is_completed && (
          <div className="bg-green-500/90 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 backdrop-blur-sm shadow-md">
            <CheckCircle2 className="w-4 h-4" /> ดูจบแล้ว
          </div>
        )}
      </div>
    </div>
  )
}
