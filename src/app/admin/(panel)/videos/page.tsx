'use client'

import { useState, useEffect } from 'react'
import { PlayCircle, Save, Loader2, CheckCircle2 } from 'lucide-react'

interface VideoData {
  id?: string
  title: string
  url: string
  required_watch_percentage: number
}

export default function VideosPage() {
  const [video, setVideo] = useState<VideoData>({ title: '', url: '', required_watch_percentage: 95 })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetchVideo()
  }, [])

  const fetchVideo = async () => {
    try {
      const res = await fetch('/api/admin/video')
      const data = await res.json()
      if (data.id) setVideo(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      await fetch('/api/admin/video', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(video),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-ev7-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">จัดการวิดีโอ</h1>
        <p className="text-gray-500 text-sm">ตั้งค่าวิดีโออบรมสำหรับคนขับ</p>
      </div>

      <div className="stat-card p-6 space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <PlayCircle className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">วิดีโออบรม</h2>
            <p className="text-xs text-gray-400">ตั้งค่าวิดีโอที่คนขับจะต้องดู</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">ชื่อวิดีโอ</label>
          <input
            type="text"
            value={video.title}
            onChange={(e) => setVideo({ ...video, title: e.target.value })}
            className="input-field"
            placeholder="เช่น วิดีโออบรมการขับรถ EV7"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">URL วิดีโอ</label>
          <input
            type="url"
            value={video.url}
            onChange={(e) => setVideo({ ...video, url: e.target.value })}
            className="input-field"
            placeholder="https://..."
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            เปอร์เซ็นต์ที่ต้องดู (%)
          </label>
          <input
            type="number"
            min={50}
            max={100}
            value={video.required_watch_percentage}
            onChange={(e) => setVideo({ ...video, required_watch_percentage: parseInt(e.target.value) || 95 })}
            className="input-field w-32"
          />
        </div>

        {/* Preview */}
        {video.url && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">ตัวอย่าง</label>
            <video
              src={video.url}
              controls
              className="w-full rounded-xl aspect-video bg-black"
            />
          </div>
        )}

        <button onClick={handleSave} disabled={saving} className="btn-primary w-full py-3 rounded-xl">
          {saving ? (
            <><Loader2 className="w-4 h-4 animate-spin inline mr-2" /> กำลังบันทึก...</>
          ) : saved ? (
            <><CheckCircle2 className="w-4 h-4 inline mr-2" /> บันทึกแล้ว!</>
          ) : (
            <><Save className="w-4 h-4 inline mr-2" /> บันทึก</>
          )}
        </button>
      </div>
    </div>
  )
}
