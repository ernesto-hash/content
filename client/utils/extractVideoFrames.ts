export async function extractVideoFrames(file: File): Promise<Blob[]> {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.muted = true
    video.playsInline = true
    const url = URL.createObjectURL(file)
    video.src = url

    video.addEventListener('loadedmetadata', () => {
      const duration = video.duration
      const timestamps = [duration * 0.25, duration * 0.50, duration * 0.75]
      const frames: Blob[] = []
      let index = 0

      function captureFrame() {
        if (index >= timestamps.length) {
          URL.revokeObjectURL(url)
          resolve(frames)
          return
        }
        video.currentTime = timestamps[index]
      }

      video.addEventListener('seeked', () => {
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth || 1280
        canvas.height = video.videoHeight || 720
        const ctx = canvas.getContext('2d')
        if (ctx) ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        canvas.toBlob((blob) => {
          if (blob) frames.push(blob)
          index++
          captureFrame()
        }, 'image/jpeg', 0.85)
      })

      captureFrame()
    })

    video.addEventListener('error', () => {
      URL.revokeObjectURL(url)
      resolve([])
    })

    setTimeout(() => {
      URL.revokeObjectURL(url)
      resolve([])
    }, 30000)
  })
}
