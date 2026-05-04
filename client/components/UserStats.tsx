import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function UserStats({ userId }) {
  const [stats, setStats] = useState({
    totalViews: 0,
    totalLikes: 0,
    totalVideos: 0,
    subscribers: 0
  })

  useEffect(() => {
    const fetchStats = async () => {
      // Total de vídeos e visualizações
      const { data: videos } = await supabase
        .from('videos')
        .select('id, views')
        .eq('user_id', userId)

      const totalVideos = videos?.length || 0
      const totalViews = videos?.reduce((acc, v) => acc + (v.views || 0), 0) || 0
      const videoIds = videos?.map(v => v.id) ?? []

      // Total de likes nos vídeos do usuário
      const { count: totalLikes } = videoIds.length > 0
        ? await supabase
            .from('interacoes')
            .select('*', { count: 'exact', head: true })
            .eq('tipo', true)
            .in('video_id', videoIds)
        : { count: 0 }

      setStats({
        totalViews,
        totalLikes: totalLikes || 0,
        totalVideos,
        subscribers: 0 // Implementar depois
      })
    }

    fetchStats()
  }, [userId])

  return (
    <div className="user-stats">
      <h3>Suas Estatísticas</h3>
      <div className="stats-grid">
        <div className="stat-item">
          <span className="stat-value">{stats.totalVideos}</span>
          <span className="stat-label">Vídeos</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{stats.totalViews}</span>
          <span className="stat-label">Visualizações</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{stats.totalLikes}</span>
          <span className="stat-label">Likes</span>
        </div>
      </div>
    </div>
  )
}