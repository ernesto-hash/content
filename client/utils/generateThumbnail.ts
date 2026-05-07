export async function generateThumbnail(videoFile: File): Promise<File | null> {
  return new Promise((resolve) => {
    try {
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.muted = true
      video.playsInline = true
      const url = URL.createObjectURL(videoFile)
      video.src = url
      video.addEventListener('loadeddata', () => {
        video.currentTime = 1
      })
      video.addEventListener('seeked', () => {
        try {
          const canvas = document.createElement('canvas')
          canvas.width = video.videoWidth || 1280
          canvas.height = video.videoHeight || 720
          const ctx = canvas.getContext('2d')
          if (!ctx) { URL.revokeObjectURL(url); resolve(null); return }
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          canvas.toBlob((blob) => {
            URL.revokeObjectURL(url)
            if (!blob) { resolve(null); return }
            resolve(new File([blob], 'auto-thumbnail.jpg', { type: 'image/jpeg' }))
          }, 'image/jpeg', 0.85)
        } catch { URL.revokeObjectURL(url); resolve(null) }
      })
      video.addEventListener('error', () => { URL.revokeObjectURL(url); resolve(null) })
      setTimeout(() => { URL.revokeObjectURL(url); resolve(null) }, 10000)
    } catch { resolve(null) }
  })
}
