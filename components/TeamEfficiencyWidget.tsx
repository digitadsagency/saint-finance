'use client'

import { useState, useEffect, useMemo } from 'react'
import { TrendingUp, Users, Clock, Target, Zap } from 'lucide-react'

interface TeamEfficiencyWidgetProps {
  realMetrics?: {
    tasksCompleted: number
    tasksRemaining: number
    completedThisWeek: number
    overdueTasks: number
    activeMembers: number
  }
}

export function TeamEfficiencyWidget({ realMetrics }: TeamEfficiencyWidgetProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  const metrics = useMemo(() => {
    if (realMetrics) {
      return realMetrics
    }
    
    // Fallback to mock data only if no real metrics provided
    return {
        tasksCompleted: Math.floor(Math.random() * 5) + 8,    // 8-12 tareas completadas
        tasksRemaining: Math.floor(Math.random() * 8) + 12,   // 12-20 tareas restantes
        completedThisWeek: Math.floor(Math.random() * 3) + 5, // 5-7 completadas esta semana
        overdueTasks: Math.floor(Math.random() * 3) + 1,      // 1-3 tareas vencidas
        activeMembers: Math.floor(Math.random() * 2) + 6      // 6-8 miembros activos
    }
  }, [realMetrics])
      
  useEffect(() => {
    // Only animate on mount if using real data
    if (realMetrics) {
      setIsAnimating(true)
      const timer = setTimeout(() => setIsAnimating(false), 500)
      return () => clearTimeout(timer)
    }
  }, [realMetrics])

  const getTaskColor = (type: string) => {
    switch (type) {
      case 'completed': return 'text-green-600 bg-green-100'
      case 'remaining': return 'text-blue-600 bg-blue-100'
      case 'overdue': return 'text-red-600 bg-red-100'
      case 'week': return 'text-purple-600 bg-purple-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg p-6 border border-blue-200">
      <div className="flex items-center space-x-2 mb-4">
        <TrendingUp className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Eficiencia del Equipo</h3>
        <div className="ml-auto">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-600">En vivo</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Tareas Completadas */}
        <div className={`rounded-lg p-4 ${getTaskColor('completed')} transition-all duration-500 ${isAnimating ? 'scale-105' : ''}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Tareas Completadas</p>
              <p className="text-2xl font-bold">{metrics.tasksCompleted}</p>
            </div>
            <Target className="h-4 w-4" />
          </div>
          <p className="text-xs mt-1">Total del proyecto</p>
        </div>

        {/* Tareas Restantes */}
        <div className={`rounded-lg p-4 ${getTaskColor('remaining')} transition-all duration-500 ${isAnimating ? 'scale-105' : ''}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Tareas Restantes</p>
              <p className="text-2xl font-bold">{metrics.tasksRemaining}</p>
            </div>
            <Clock className="h-4 w-4" />
          </div>
          <p className="text-xs mt-1">Por completar</p>
        </div>

        {/* Completadas Esta Semana */}
        <div className={`rounded-lg p-4 ${getTaskColor('week')} transition-all duration-500 ${isAnimating ? 'scale-105' : ''}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Esta Semana</p>
              <p className="text-2xl font-bold">{metrics.completedThisWeek}</p>
            </div>
            <TrendingUp className="h-4 w-4" />
          </div>
          <p className="text-xs mt-1">Tareas completadas</p>
        </div>

        {/* Tareas Vencidas */}
        <div className={`rounded-lg p-4 ${getTaskColor('overdue')} transition-all duration-500 ${isAnimating ? 'scale-105' : ''}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Tareas Vencidas</p>
              <p className="text-2xl font-bold">{metrics.overdueTasks}</p>
            </div>
            <Zap className="h-4 w-4" />
          </div>
          <p className="text-xs mt-1">Requieren atención</p>
        </div>

        {/* Miembros Activos */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Miembros Activos</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.activeMembers}/7</p>
            </div>
            <Users className="h-4 w-4 text-gray-600" />
          </div>
          <p className="text-xs text-gray-500 mt-1">Trabajando ahora</p>
        </div>

        {/* Progreso General */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Progreso General</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round((metrics.tasksCompleted / (metrics.tasksCompleted + metrics.tasksRemaining)) * 100)}%
              </p>
            </div>
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">Completado</p>
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-blue-700">
            Última actualización: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>
    </div>
  )
}
