"use client"

import { useState, useRef, useEffect } from "react"

// Safari와 구형 브라우저 지원을 위한 타입 확장
declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext
  }
}

interface AnalysisResult {
  risk: 'low' | 'medium' | 'high' | null
  riskScore: number
  confidence: number
  keywords: string[]
  reason: string
  timestamp: number
}

export default function AnalysisPage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected')
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult>({
    risk: null,
    riskScore: 0,
    confidence: 0,
    keywords: [],
    reason: '',
    timestamp: 0
  })
  const [audioLevel, setAudioLevel] = useState(0)
  const [recordingTime, setRecordingTime] = useState(0)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const socketRef = useRef<WebSocket | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])

  // 토스트 메시지 표시 함수
  const showToast = (title: string, description: string, variant: 'default' | 'destructive' = 'default') => {
    console.log(`[${variant}] ${title}: ${description}`)
    if (variant === 'destructive') {
      alert(`오류: ${description}`)
    }
  }

  // 위험도에 따른 리스크 레벨 계산
  const getRiskLevel = (score: number): 'low' | 'medium' | 'high' => {
    if (score >= 70) return 'high'
    if (score >= 50) return 'medium'
    return 'low'
  }

  // 오디오 레벨 측정
  const measureAudioLevel = () => {
    if (analyserRef.current && isAnalyzing) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
      analyserRef.current.getByteFrequencyData(dataArray)
      
      const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length
      setAudioLevel(Math.round(average / 255 * 100))
      
      animationFrameRef.current = requestAnimationFrame(measureAudioLevel)
    }
  }

  // 녹음 시간 업데이트
  const startRecordingTimer = () => {
    setRecordingTime(0)
    recordingTimerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1)
    }, 1000)
  }

  const stopRecordingTimer = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current)
      recordingTimerRef.current = null
    }
  }

  // 시간 포맷팅 함수
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // WebSocket 초기화
  const initializeWebSocket = (): Promise<WebSocket> => {
    return new Promise((resolve, reject) => {
      const socket = new WebSocket("ws://localhost:8080/analysis")
      socketRef.current = socket
      
      socket.onopen = () => {
        console.log("WebSocket 연결 성공")
        setConnectionStatus('connected')
        showToast("연결 성공", "분석 서버에 연결되었습니다.")
        resolve(socket)
      }

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log("분석 결과 수신:", data)
          
          const newResult: AnalysisResult = {
            risk: getRiskLevel(data.riskScore || 0),
            riskScore: Math.round(data.riskScore || 0),
            confidence: Math.round(data.confidence || 0),
            keywords: data.keywords || [],
            reason: data.reason || '',
            timestamp: Date.now()
          }
          
          setAnalysisResult(newResult)
          
        } catch (error) {
          console.error("메시지 파싱 오류:", error)
        }
      }

      socket.onerror = (error) => {
        console.error("WebSocket 오류:", error)
        setConnectionStatus('error')
        showToast("연결 오류", "분석 서버 연결에 실패했습니다.", "destructive")
        reject(error)
      }

      socket.onclose = () => {
        console.log("WebSocket 연결 종료")
        setConnectionStatus('disconnected')
      }

      setTimeout(() => {
        if (socket.readyState === WebSocket.CONNECTING) {
          socket.close()
          setConnectionStatus('error')
          reject(new Error("연결 타임아웃"))
        }
      }, 10000)
    })
  }

  // 오디오 스트림 초기화
  const initializeAudioStream = async (): Promise<MediaStream> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        }
      })
      
      streamRef.current = stream

      // Safari와 구형 브라우저 지원
      const AudioContextClass = window.AudioContext || window.webkitAudioContext || AudioContext
      audioContextRef.current = new AudioContextClass()
      analyserRef.current = audioContextRef.current.createAnalyser()
      
      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyserRef.current)
      
      analyserRef.current.fftSize = 256
      analyserRef.current.smoothingTimeConstant = 0.8
      
      return stream
    } catch (error) {
      console.error("마이크 접근 실패:", error)
      throw new Error("마이크 접근 권한을 허용해주세요.")
    }
  }

  // MediaRecorder 초기화
  const initializeMediaRecorder = (stream: MediaStream, socket: WebSocket) => {
    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") 
      ? "audio/webm;codecs=opus"
      : MediaRecorder.isTypeSupported("audio/webm")
      ? "audio/webm"
      : "audio/mp4"

    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: mimeType,
      audioBitsPerSecond: 16000
    })

    mediaRecorderRef.current = mediaRecorder
    recordedChunksRef.current = []

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        // 실시간 분석을 위해 백엔드로 전송
        if (socket.readyState === WebSocket.OPEN) {
          console.log(`오디오 데이터 전송: ${event.data.size} bytes`)
          socket.send(event.data)
        }
        
        // MP3 저장용으로 보관
        recordedChunksRef.current.push(event.data)
      }
    }

    mediaRecorder.onstart = () => {
      console.log("녹음 시작")
    }

    mediaRecorder.onstop = () => {
      console.log("녹음 중지")
    }

    mediaRecorder.onerror = (error) => {
      console.error("MediaRecorder 오류:", error)
      showToast("녹음 오류", "녹음 중 오류가 발생했습니다.", "destructive")
    }

    return mediaRecorder
  }

  // 실시간 분석 시작
  const startAnalysis = async () => {
    try {
      setConnectionStatus('connecting')
      setIsAnalyzing(true)
      
      // 상태 초기화
      setAnalysisResult({
        risk: null,
        riskScore: 0,
        confidence: 0,
        keywords: [],
        reason: '',
        timestamp: 0
      })

      const socket = await initializeWebSocket()
      const stream = await initializeAudioStream()
      const mediaRecorder = initializeMediaRecorder(stream, socket)
      
      mediaRecorder.start(250)
      measureAudioLevel()
      startRecordingTimer()
      
      showToast("분석 시작", "실시간 보이스피싱 분석이 시작되었습니다.")

    } catch (error) {
      console.error("분석 시작 실패:", error)
      setIsAnalyzing(false)
      setConnectionStatus('error')
      
      if (error instanceof Error) {
        showToast("분석 시작 실패", error.message, "destructive")
      } else {
        showToast("분석 시작 실패", "알 수 없는 오류가 발생했습니다.", "destructive")
      }
    }
  }

  // 분석 중지
  const stopAnalysis = () => {
    console.log("분석 중지 시작")
    
    const finalRiskScore = analysisResult.riskScore
    
    // MediaRecorder 중지
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }

    // 리소스 정리
    cleanup()
    
    // 위험도에 따른 후처리
    if (finalRiskScore >= 50) {
      // 위험도 50 이상이면 저장 모달 표시
      setShowSaveModal(true)
    } else {
      // 위험도 50 미만이면 녹음 데이터 삭제
      recordedChunksRef.current = []
      showToast("분석 완료", "안전한 통화로 판단되어 녹음이 삭제되었습니다.")
    }
  }

  // 리소스 정리 함수
  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop()
        console.log("오디오 트랙 중지:", track.kind)
      })
      streamRef.current = null
    }

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.close()
      socketRef.current = null
    }

    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    stopRecordingTimer()
    setIsAnalyzing(false)
    setConnectionStatus('disconnected')
    setAudioLevel(0)
  }

  // 통화 저장 함수
  const saveCall = async () => {
    if (!phoneNumber.trim()) {
      showToast("입력 오류", "전화번호를 입력해주세요.", "destructive")
      return
    }

    setIsSaving(true)

    try {
      // 녹음 파일을 MP3로 변환하여 생성
      const recordedBlob = new Blob(recordedChunksRef.current, { 
        type: 'audio/webm' 
      })

      // FormData로 녹음 파일과 전화번호 전송
      const formData = new FormData()
      formData.append('audioFile', recordedBlob, `call_${Date.now()}.webm`)
      formData.append('phoneNumber', phoneNumber.trim())

      // 백엔드에 녹음 파일 업로드
      const response = await fetch('http://localhost:8080/api/upload-audio', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`업로드 실패: ${response.status}`)
      }

      const result = await response.json()
      console.log("녹음 파일 업로드 성공:", result)

      showToast("저장 완료", "녹음 파일이 성공적으로 저장되었습니다.")
      
      // 저장 후 데이터 정리
      recordedChunksRef.current = []
      setPhoneNumber('')
      setShowSaveModal(false)

    } catch (error) {
      console.error("업로드 실패:", error)
      showToast("업로드 실패", "녹음 파일 업로드 중 오류가 발생했습니다.", "destructive")
    } finally {
      setIsSaving(false)
    }
  }

  // 저장 건너뛰기
  const skipSave = () => {
    recordedChunksRef.current = []
    setPhoneNumber('')
    setShowSaveModal(false)
    showToast("저장 건너뛰기", "녹음 데이터가 삭제되었습니다.")
  }

  // 위험도별 색상
  const getRiskColor = (risk: string | null) => {
    switch (risk) {
      case 'high': return 'text-red-500'
      case 'medium': return 'text-yellow-500'  
      case 'low': return 'text-green-500'
      default: return 'text-gray-500'
    }
  }

  // 위험도별 배경색
  const getRiskBgColor = (score: number) => {
    if (score >= 70) return 'bg-red-900 border-red-500'
    if (score >= 50) return 'bg-yellow-900 border-yellow-500'
    return 'bg-gray-800 border-gray-700'
  }

  // 위험도별 아이콘
  const getRiskIcon = (risk: string | null) => {
    switch (risk) {
      case 'high': return <span className="text-red-500 text-2xl">🚨</span>
      case 'medium': return <span className="text-yellow-500 text-2xl">⚠️</span>
      case 'low': return <span className="text-green-500 text-2xl">✅</span>
      default: return <span className="text-gray-400 text-2xl">🛡️</span>
    }
  }

  // 연결 상태별 표시
  const getConnectionStatusDisplay = () => {
    switch (connectionStatus) {
      case 'connecting': return <span className="text-yellow-500">🔄 연결 중...</span>
      case 'connected': return <span className="text-green-500">🟢 연결됨</span>
      case 'error': return <span className="text-red-500">🔴 연결 실패</span>
      case 'disconnected': return <span className="text-gray-500">⚪ 연결 안됨</span>
    }
  }

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (isAnalyzing) {
        cleanup()
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-black flex flex-col p-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <button 
          className="flex items-center text-white hover:text-gray-300 p-2 rounded-lg hover:bg-gray-800 transition-colors"
          onClick={() => window.history.back()}
        >
          ← 돌아가기
        </button>
        
        <div className="text-sm">
          {getConnectionStatusDisplay()}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">
          실시간 보이스피싱 분석
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
          {/* 분석 컨트롤 */}
          <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-lg">
            <div className="p-6 text-center">
              <div className="mb-6">
                <button
                  onClick={isAnalyzing ? stopAnalysis : startAnalysis}
                  disabled={connectionStatus === 'connecting'}
                  className={`w-32 h-32 rounded-full text-white font-semibold text-lg shadow-lg transition-all duration-200 ${
                    connectionStatus === 'connecting' 
                      ? "bg-gray-600 cursor-not-allowed opacity-50"
                      : isAnalyzing 
                      ? "bg-red-600 hover:bg-red-700 animate-pulse" 
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {connectionStatus === 'connecting' ? (
                    <div className="flex flex-col items-center">
                      <span className="text-3xl mb-2">🔄</span>
                      <span className="text-xs">연결 중...</span>
                    </div>
                  ) : isAnalyzing ? (
                    <div className="flex flex-col items-center">
                      <span className="text-3xl mb-2">🔇</span>
                      <span className="text-xs">통화 종료</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <span className="text-3xl mb-2">🎤</span>
                      <span className="text-xs">녹음 & 분석</span>
                    </div>
                  )}
                </button>
              </div>

              {isAnalyzing && (
                <>
                  <div className="mb-4">
                    <p className="text-white text-lg font-mono">
                      {formatTime(recordingTime)}
                    </p>
                    <p className="text-gray-400 text-xs">녹음 시간</p>
                  </div>

                  <div className="mt-4">
                    <p className="text-white text-sm mb-2">음성 레벨 ({audioLevel}%)</p>
                    <div className="w-full bg-gray-700 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all duration-100 ${
                          audioLevel > 70 ? 'bg-red-500' : 
                          audioLevel > 30 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(audioLevel, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-gray-400 text-xs mt-1">🔴 실시간 분석 중...</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 분석 결과 */}
          <div className={`border rounded-lg shadow-lg transition-all duration-300 ${getRiskBgColor(analysisResult.riskScore)}`}>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4">분석 결과</h2>
              
              <div className="space-y-4">
                {/* 위험도 점수 */}
                <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                  <div className="flex items-center">
                    {getRiskIcon(analysisResult.risk)}
                    <span className="text-white ml-2">위험도</span>
                  </div>
                  <div className="text-right">
                    <span className={`font-bold text-2xl ${getRiskColor(analysisResult.risk)}`}>
                      {analysisResult.riskScore}
                    </span>
                    <span className="text-gray-400 text-sm ml-1">/100</span>
                  </div>
                </div>

                {/* 신뢰도 */}
                <div className="p-3 bg-gray-800 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white">신뢰도</span>
                    <span className="text-white font-bold">{analysisResult.confidence}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(analysisResult.confidence, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* 판단 이유 */}
                {analysisResult.reason && (
                  <div className="p-3 bg-gray-800 rounded-lg">
                    <span className="text-white block mb-1">판단 이유</span>
                    <p className="text-gray-300 text-sm">{analysisResult.reason}</p>
                  </div>
                )}

                {/* 감지된 키워드 */}
                {analysisResult.keywords.length > 0 && (
                  <div className="p-3 bg-gray-800 rounded-lg">
                    <span className="text-white block mb-2">감지된 키워드</span>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.keywords.map((keyword, index) => (
                        <span 
                          key={index} 
                          className="px-2 py-1 bg-red-600 text-white text-xs rounded-full"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 하단 정보 */}
        <div className="mt-8 text-center space-y-2">
          <p className="text-gray-400 text-sm">
            🤖 AI가 실시간으로 통화 내용을 분석하여 보이스피싱을 탐지합니다
          </p>
          {isAnalyzing && (
            <p className="text-yellow-400 text-xs">
              ⚠️ 녹음된 음성 데이터는 분석 후 자동으로 처리됩니다
            </p>
          )}
        </div>
      </div>

      {/* 저장 모달 */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg shadow-xl max-w-md w-full mx-4 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">통화 저장</h3>
            <p className="text-gray-300 mb-4">
              위험도가 {analysisResult.riskScore}%로 의심스러운 통화입니다. 
              전화번호를 입력하시면 녹음 파일이 저장됩니다.
            </p>
            
            <div className="mb-4">
              <label className="block text-white text-sm mb-2">상대방 전화번호</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="010-1234-5678"
                className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                disabled={isSaving}
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={saveCall}
                disabled={isSaving}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving ? '업로드 중...' : '녹음 저장'}
              </button>
              <button
                onClick={skipSave}
                disabled={isSaving}
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                건너뛰기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}