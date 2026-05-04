import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function UploadVideo({ userId, onUploadComplete }) {
  const [uploading, setUploading] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [videoFile, setVideoFile] = useState(null)
  const [thumbnailFile, setThumbnailFile] = useState(null)

  const uploadFile = async (file, bucket, folder) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${folder}/${Date.now()}.${fileExt}`
    
    const { error, data } = await supabase.storage
      .from(bucket)
      .upload(fileName, file)
    
    if (error) throw error
    
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName)
    
    return publicUrl
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    setUploading(true)

    try {
      // Upload do vídeo
      const videoUrl = await uploadFile(videoFile, 'videos', 'uploads')
      
      // Upload da thumbnail (se houver)
      let thumbnailUrl = null
      if (thumbnailFile) {
        thumbnailUrl = await uploadFile(thumbnailFile, 'thumbnails', 'uploads')
      }

      // Salvar metadados no banco
      const { data, error } = await supabase
        .from('videos')
        .insert({
          user_id: userId,
          title,
          description,
          video_url: videoUrl,
          thumbnail_url: thumbnailUrl,
          views: 0
        })
        .select()
        .single()

      if (error) throw error

      // Limpar formulário
      setTitle('')
      setDescription('')
      setVideoFile(null)
      setThumbnailFile(null)
      
      // Notificar componente pai
      onUploadComplete(data)
      
      alert('Vídeo publicado com sucesso!')
    } catch (error) {
      alert('Erro ao publicar: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <form onSubmit={handleUpload} className="upload-form">
      <h3>Publicar Novo Vídeo</h3>
      
      <input
        type="text"
        placeholder="Título do vídeo"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      
      <textarea
        placeholder="Descrição"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
      />
      
      <div className="file-inputs">
        <label>
          Arquivo do Vídeo *
          <input
            type="file"
            accept="video/*"
            onChange={(e) => setVideoFile(e.target.files[0])}
            required
          />
        </label>
        
        <label>
          Thumbnail (opcional)
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setThumbnailFile(e.target.files[0])}
          />
        </label>
      </div>
      
      <button type="submit" disabled={uploading}>
        {uploading ? 'Publicando...' : 'Publicar Vídeo'}
      </button>
    </form>
  )
}