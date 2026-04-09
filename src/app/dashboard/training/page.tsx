'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { PlayCircle, AlertTriangle, CheckCircle2, Eye, EyeOff } from 'lucide-react'

export default function TrainingPage() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoUrl, setVideoUrl] = useState('')
  const [maxWatched, setMaxWatched] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [progress, setProgress] = useState(0)
  const [completed, setCompleted] = useState(false)
  const [requiredPercent, setRequiredPercent] = useState(95)
  const [tabWarning, setTabWarning] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const lastSaveRef = useRef(0)
  const maxWatchedRef = useRef(0)

  useEffect(() => {
    fetchVideoData()
  }, [])

  // Anti-cheat: detect tab switch
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        videoRef.current?.pause()
        setTabWarning(true)
        setTimeout(() => setTabWarning(false), 3000)
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  const fetchVideoData = async () => {
    try {
      const [videoRes, progressRes] = await Promise.all([
        fetch('/api/video/current'),
        fetch('/api/video/progress'),
      ])
      const videoData = await videoRes.json()
      const progressData = await progressRes.json()

      if (videoData.url) {
        setVideoUrl(videoData.url)
        setRequiredPercent(videoData.required_watch_percentage || 95)
      }
      if (progressData.max_watched_time) {
        setMaxWatched(progressData.max_watched_time)
        maxWatchedRef.current = progressData.max_watched_time
      }
      if (progressData.completed) {
        setCompleted(true)
      }
    } catch (err) {
      console.error('Failed to fetch video:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
      // Resume from last position
      if (maxWatchedRef.current > 0) {
        videoRef.current.currentTime = Math.min(maxWatchedRef.current, videoRef.current.duration)
      }
    }
  }

  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current) return
    const ct = videoRef.current.currentTime
    const dur = videoRef.current.duration

    // Anti-cheat: prevent forward seeking
    if (ct > maxWatchedRef.current + 2) {
      videoRef.current.currentTime = maxWatchedRef.current
      return
    }

    // Update max watched
    if (ct > maxWatchedRef.current) {
      maxWatchedRef.current = ct
      setMaxWatched(ct)
    }

    setCurrentTime(ct)
    const prog = dur > 0 ? (maxWatchedRef.current / dur) * 100 : 0
    setProgress(prog)

    // Auto-save progress every 5 seconds
    const now = Date.now()
    if (now - lastSaveRef.current > 5000) {
      lastSaveRef.current = now
      saveProgress(maxWatchedRef.current, dur, prog >= requiredPercent)
    }

    // Check completion
    if (prog >= requiredPercent && !completed) {
      setCompleted(true)
      saveProgress(maxWatchedRef.current, dur, true)
    }
  }, [completed, requiredPercent])

  const handleSeeking = () => {
    if (!videoRef.current) return
    if (videoRef.current.currentTime > maxWatchedRef.current + 1) {
      videoRef.current.currentTime = maxWatchedRef.current
    }
  }

  const saveProgress = async (watchedTime: number, totalDur: number, isCompleted: boolean) => {
    if (saving) return
    setSaving(true)
    try {
      await fetch('/api/video/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          max_watched_time: watchedTime,
          total_duration: totalDur,
          completed: isCompleted,
          last_position: watchedTime,
        }),
      })
    } finally {
      setSaving(false)
    }
  }

  const handlePause = () => {
    if (videoRef.current && duration > 0) {
      saveProgress(maxWatchedRef.current, duration, progress >= requiredPercent)
    }
  }

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
    }
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-ev7-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">วิดีโออบรม</h1>
        <p className="text-gray-500 text-sm">ดูวิดีโอให้ครบ {requiredPercent}% เพื่อปลดล็อคแบบทดสอบ</p>
      </div>

      {/* Tab Warning */}
      {tabWarning && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3 animate-fade-in">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <p className="text-amber-700 text-sm">ตรวจพบการสลับแท็บ วิดีโอถูกหยุดชั่วคราว</p>
        </div>
      )}

      {/* Video Player */}
      <div className="bg-black rounded-2xl overflow-hidden shadow-xl aspect-video flex items-center justify-center relative group">
        {videoUrl ? (
          <>
            <video
              key={videoUrl}
              ref={videoRef}
              src={videoUrl}
              onLoadedMetadata={handleLoadedMetadata}
              onTimeUpdate={handleTimeUpdate}
              onSeeking={handleSeeking}
              onPause={() => {
                handlePause()
                setIsPlaying(false)
              }}
              onPlay={() => setIsPlaying(true)}
              onClick={togglePlay}
              controlsList="nodownload"
              disablePictureInPicture
              playsInline
              className="w-full h-full cursor-pointer"
              style={{ maxHeight: '70vh' }}
            />
            {/* Custom Play Button Overlay */}
            {!isPlaying && (
              <button
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/50 transition-all duration-300"
              >
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md transform transition-transform group-hover:scale-110">
                  <PlayCircle className="w-12 h-12 text-white" />
                </div>
              </button>
            )}
          </>
        ) : (
          <div className="text-gray-400">กำลังโหลดวิดีโอ...</div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="stat-card p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-gray-700">ความคืบหน้า</span>
          <span className={`text-sm font-bold ${progress >= requiredPercent ? 'text-ev7-600' : 'text-gray-500'}`}>
            {Math.round(progress)}% / {requiredPercent}%
          </span>
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              progress >= requiredPercent
                ? 'bg-gradient-to-r from-ev7-500 to-ev7-400'
                : 'bg-gradient-to-r from-blue-500 to-blue-400'
            }`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-400">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        {completed && (
          <div className="mt-4 flex items-center gap-3 bg-ev7-50 rounded-xl p-4">
            <CheckCircle2 className="w-6 h-6 text-ev7-600" />
            <div>
              <p className="font-semibold text-ev7-800">ดูวิดีโอครบแล้ว!</p>
              <p className="text-sm text-ev7-600">คุณสามารถทำแบบทดสอบได้แล้ว</p>
            </div>
          </div>
        )}
      </div>

      {/* Action Button */}
      {completed && (
        <button
          onClick={() => router.push('/dashboard/quiz')}
          className="btn-primary w-full py-4 text-lg rounded-2xl animate-pulse-glow"
        >
          ไปทำแบบทดสอบ →
        </button>
      )}

      {/* Info */}
      <div className="bg-blue-50 rounded-xl p-4">
        <h3 className="font-semibold text-blue-900 mb-2 text-sm">📌 หมายเหตุ</h3>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• ไม่สามารถข้ามวิดีโอไปข้างหน้าได้</li>
          <li>• หากสลับแท็บ วิดีโอจะหยุดเล่นอัตโนมัติ</li>
          <li>• ความคืบหน้าจะถูกบันทึกอัตโนมัติ</li>
          <li>• สามารถกลับมาดูต่อจากจุดเดิมได้</li>
        </ul>
      </div>
    </div>
  )
}
