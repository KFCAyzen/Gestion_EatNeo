'use client'

import { useState, useEffect } from 'react'

interface OfflineLoaderProps {
  onComplete: () => void
  progress?: { completed: number; total: number }
}

export default function OfflineLoader({ onComplete, progress: swProgress }: OfflineLoaderProps) {
  const [progress, setProgress] = useState(0)
  const [currentTask, setCurrentTask] = useState('Initialisation...')
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    if (swProgress && swProgress.total > 0) {
      // Utiliser les données réelles du service worker
      const realProgress = (swProgress.completed / swProgress.total) * 100
      setProgress(realProgress)
      
      if (swProgress.completed === 0) {
        setCurrentTask('Téléchargement des ressources...')
      } else if (realProgress < 50) {
        setCurrentTask(`Mise en cache... (${swProgress.completed}/${swProgress.total})`)
      } else if (realProgress < 90) {
        setCurrentTask(`Finalisation... (${swProgress.completed}/${swProgress.total})`)
      } else if (realProgress >= 100) {
        setCurrentTask('Prêt pour utilisation offline!')
        setIsComplete(true)
      }
    } else {
      // Fallback avec simulation si pas de données SW
      const tasks = [
        { name: 'Chargement des scripts...', duration: 800 },
        { name: 'Mise en cache des images...', duration: 1200 },
        { name: 'Préparation des données...', duration: 600 },
        { name: 'Configuration offline...', duration: 400 }
      ]

      let currentProgress = 0
      let taskIndex = 0

      const runTasks = () => {
        if (taskIndex < tasks.length) {
          const task = tasks[taskIndex]
          setCurrentTask(task.name)
          
          const increment = 100 / tasks.length
          const steps = 20
          const stepDuration = task.duration / steps
          
          let step = 0
          const interval = setInterval(() => {
            step++
            const taskProgress = (step / steps) * increment
            setProgress(currentProgress + taskProgress)
            
            if (step >= steps) {
              clearInterval(interval)
              currentProgress += increment
              taskIndex++
              setTimeout(runTasks, 100)
            }
          }, stepDuration)
        } else {
          setCurrentTask('Prêt pour utilisation offline!')
          setProgress(100)
          setTimeout(() => {
            setIsComplete(true)
            setTimeout(onComplete, 500)
          }, 800)
        }
      }

      const timer = setTimeout(runTasks, 500)
      return () => clearTimeout(timer)
    }
  }, [onComplete, swProgress])

  return (
    <div className="offline-loader">
      <div className="offline-loader-content">
        <div className="offline-loader-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
            <path 
              d="M12 2L2 7L12 12L22 7L12 2Z" 
              stroke="#4caf50" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className={isComplete ? 'complete' : ''}
            />
            <path 
              d="M2 17L12 22L22 17" 
              stroke="#4caf50" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className={isComplete ? 'complete' : ''}
            />
            <path 
              d="M2 12L12 17L22 12" 
              stroke="#4caf50" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className={isComplete ? 'complete' : ''}
            />
          </svg>
        </div>
        
        <h2>Préparation Offline</h2>
        <p className="task-text">{currentTask}</p>
        
        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="progress-text">
            {swProgress && swProgress.total > 0 
              ? `${swProgress.completed}/${swProgress.total}` 
              : `${Math.round(progress)}%`
            }
          </span>
        </div>
        
        {isComplete && (
          <div className="success-message">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path 
                d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" 
                stroke="#4caf50" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
            Application prête!
          </div>
        )}
      </div>

      <style jsx>{`
        .offline-loader {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }

        .offline-loader-content {
          text-align: center;
          max-width: 320px;
          padding: 40px 20px;
        }

        .offline-loader-icon {
          margin-bottom: 24px;
          animation: pulse 2s infinite;
        }

        .offline-loader-icon svg path {
          animation: draw 2s ease-in-out infinite;
        }

        .offline-loader-icon svg path.complete {
          animation: none;
          stroke: #4caf50;
        }

        h2 {
          color: #2e7d32;
          font-size: 24px;
          font-weight: 600;
          margin: 0 0 8px 0;
        }

        .task-text {
          color: #666;
          font-size: 16px;
          margin: 0 0 24px 0;
          min-height: 24px;
        }

        .progress-container {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }

        .progress-bar {
          flex: 1;
          height: 8px;
          background: #e8f5e8;
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #4caf50, #66bb6a);
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .progress-text {
          font-size: 14px;
          font-weight: 600;
          color: #2e7d32;
          min-width: 40px;
        }

        .success-message {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: #4caf50;
          font-weight: 600;
          animation: fadeIn 0.5s ease;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        @keyframes draw {
          0% { stroke-dasharray: 0 100; }
          50% { stroke-dasharray: 50 100; }
          100% { stroke-dasharray: 100 100; }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}