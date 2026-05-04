import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function VideoPlayer({ videoId, userId }) {
  const [video, setVideo] = useState(null)
  const [userInteraction, setUserInteraction] = useState(null)
  const [likes, setLikes] = useState(0)
  const [dislikes, setDislikes] = useState(0)
  const [comments, setComments] = useState([])

  useEffect(() => {
    // Buscar dados do vídeo
    const fetchVideoData = async () => {
      const { data: videoData } = await supabase
        .from('videos')
        .select(`
          *,
          profiles!inner(username, avatar_url)
        `)
        .eq('id', videoId)
        .single()
      
      setVideo(videoData)

      // Contar interações
      const { count: likesCount } = await supabase
        .from('interacoes')
        .select('*', { count: 'exact', head: true })
        .eq('video_id', videoId)
        .eq('tipo', true)
      
      const { count: dislikesCount } = await supabase
        .from('interacoes')
        .select('*', { count: 'exact', head: true })
        .eq('video_id', videoId)
        .eq('tipo', false)
      
      setLikes(likesCount)
      setDislikes(dislikesCount)

      // Verificar interação do usuário atual
      if (userId) {
        const { data: interaction } = await supabase
          .from('interacoes')
          .select('*')
          .eq('user_id', userId)
          .eq('video_id', videoId)
          .maybeSingle()
        
        setUserInteraction(interaction)
      }

      // Incrementar visualização
      await supabase.rpc('increment_video_views', { video_id: videoId })
    }

    fetchVideoData()

    // Inscrever para mudanças em tempo real
    const interacoesSubscription = supabase
      .channel('interacoes_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'interacoes',
          filter: `video_id=eq.${videoId}`
        },
        async () => {
          // Recarregar contagens quando algo mudar
          const { count: newLikes } = await supabase
            .from('interacoes')
            .select('*', { count: 'exact', head: true })
            .eq('video_id', videoId)
            .eq('tipo', true)
          
          const { count: newDislikes } = await supabase
            .from('interacoes')
            .select('*', { count: 'exact', head: true })
            .eq('video_id', videoId)
            .eq('tipo', false)
          
          setLikes(newLikes)
          setDislikes(newDislikes)
        }
      )
      .subscribe()

    return () => {
      interacoesSubscription.unsubscribe()
    }
  }, [videoId, userId])

  const handleInteraction = async (tipo) => {
    if (!userId) {
      alert('Faça login para interagir')
      return
    }

    try {
      if (userInteraction) {
        if (userInteraction.tipo === tipo) {
          // Remover interação (mesmo tipo)
          await supabase
            .from('interacoes')
            .delete()
            .eq('id', userInteraction.id)
          setUserInteraction(null)
        } else {
          // Atualizar interação (tipo diferente)
          await supabase
            .from('interacoes')
            .update({ tipo })
            .eq('id', userInteraction.id)
          setUserInteraction({ ...userInteraction, tipo })
        }
      } else {
        // Criar nova interação
        const { data } = await supabase
          .from('interacoes')
          .insert({ user_id: userId, video_id: videoId, tipo })
          .select()
          .single()
        setUserInteraction(data)
      }
    } catch (error) {
      alert('Erro ao processar interação')
    }
  }

  const handleShare = async (plataforma) => {
    // Registrar partilha
    await supabase
      .from('partilhas')
      .insert({
        user_id: userId || null,
        video_id: videoId,
        plataforma
      })

    // Lógica de compartilhamento específica da plataforma
    const url = window.location.href
    if (plataforma === 'facebook') {
      window.open(`https://facebook.com/sharer/sharer.php?u=${url}`)
    } else if (plataforma === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?url=${url}`)
    } else if (plataforma === 'whatsapp') {
      window.open(`https://wa.me/?text=${url}`)
    }
  }

  if (!video) return <div>Carregando...</div>

  return (
    <div className="video-player">
      <video src={video.video_url} controls />
      
      <h2>{video.title}</h2>
      
      <div className="video-meta">
        <span>Visualizações: {video.views}</span>
        <span>Publicado em: {new Date(video.created_at).toLocaleDateString()}</span>
      </div>

      <div className="video-actions">
        <button 
          className={userInteraction?.tipo === true ? 'active' : ''}
          onClick={() => handleInteraction(true)}
        >
          👍 Like ({likes})
        </button>
        
        <button 
          className={userInteraction?.tipo === false ? 'active' : ''}
          onClick={() => handleInteraction(false)}
        >
          👎 Dislike ({dislikes})
        </button>
        
        <div className="share-buttons">
          <button onClick={() => handleShare('facebook')}>📘 Facebook</button>
          <button onClick={() => handleShare('twitter')}>🐦 Twitter</button>
          <button onClick={() => handleShare('whatsapp')}>📱 WhatsApp</button>
        </div>
      </div>

      <div className="video-description">
        <p>{video.description}</p>
      </div>
    </div>
  )
}