"use client"

import { useState, useEffect } from "react"

interface DetailedAnalysisRecord {
  id: string
  date: string
  time: string
  duration: string
  phoneNumber: string
  risk: 'low' | 'medium' | 'high'
  confidence: number
  keywords: string[]
  summary: string
  transcript: string
  suspiciousTimes: Array<{
    startTime: string
    endTime: string
    reason: string
    severity: 'low' | 'medium' | 'high'
  }>
  analysisDetails: {
    voicePattern: string
    speechSpeed: number
    emotionDetection: string
    backgroundNoise: string
  }
  recommendations: string[]
}

export default function AnalysisDetailPage() {
  const [record, setRecord] = useState<DetailedAnalysisRecord | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // URL에서 ID 추출 (간단한 방법)
  const getId = () => {
    if (typeof window !== 'undefined') {
      const pathParts = window.location.pathname.split('/')
      return pathParts[pathParts.length - 1] // 마지막 부분이 ID
    }
    return "1" // 기본값
  }
  
  const id = getId()

  // 더미 상세 데이터 (실제로는 DB에서 가져올 데이터)
  const getDummyDetailData = (id: string): DetailedAnalysisRecord => {
    const baseData = {
      "1": {
        id: "1",
        date: "2024-08-16",
        time: "14:30:22",
        duration: "5:43",
        phoneNumber: "010-1234-5678",
        risk: "high" as const,
        confidence: 87,
        keywords: ["은행", "계좌이체", "긴급", "보안"],
        summary: "금융기관을 사칭하여 계좌이체를 요구하는 의심스러운 통화가 감지되었습니다.",
        transcript: "안녕하세요 고객님, 국민은행 보안팀입니다. 고객님의 계좌에서 의심스러운 거래가 감지되어 연락드렸습니다. 지금 당장 계좌 보안을 위해 계좌번호와 비밀번호를 확인해주셔야 합니다. 만약 지금 확인해주지 않으면 계좌가 동결될 수 있습니다.",
        suspiciousTimes: [
          {
            startTime: "00:45",
            endTime: "01:23",
            reason: "금융기관 사칭 발언 감지",
            severity: "high" as const
          },
          {
            startTime: "02:15",
            endTime: "03:02",
            reason: "개인정보 요구 패턴 감지",
            severity: "high" as const
          },
          {
            startTime: "04:10",
            endTime: "04:45",
            reason: "긴급성을 강조하는 협박성 발언",
            severity: "medium" as const
          }
        ],
        analysisDetails: {
          voicePattern: "기계적이고 빠른 말투, 스크립트를 읽는 패턴",
          speechSpeed: 180,
          emotionDetection: "긴장감, 압박감 조성",
          backgroundNoise: "콜센터 환경 소음 감지"
        },
        recommendations: [
          "즉시 통화를 종료하고 실제 은행에 확인 전화",
          "개인정보는 절대 전화로 제공하지 말 것",
          "112 신고 고려",
          "가족들에게 보이스피싱 주의 알림"
        ]
      },
      "4": {
        id: "4",
        date: "2024-08-13",
        time: "11:45:55",
        duration: "7:28",
        phoneNumber: "070-1111-2222",
        risk: "high" as const,
        confidence: 92,
        keywords: ["검찰청", "체포영장", "계좌확인", "송금"],
        summary: "수사기관을 사칭하여 금전을 요구하는 보이스피싱 통화가 강력히 의심됩니다.",
        transcript: "안녕하세요, 서울중앙지방검찰청 김철수 검사입니다. 고객님과 관련된 금융사기 사건이 접수되어 연락드렸습니다. 고객님 명의로 개설된 계좌가 사기에 악용되고 있어 체포영장이 발부될 예정입니다. 지금 즉시 계좌의 돈을 안전계좌로 이체해주셔야 합니다.",
        suspiciousTimes: [
          {
            startTime: "00:15",
            endTime: "01:10",
            reason: "검찰청 사칭 발언",
            severity: "high" as const
          },
          {
            startTime: "03:20",
            endTime: "04:15",
            reason: "체포영장 협박",
            severity: "high" as const
          },
          {
            startTime: "05:30",
            endTime: "06:45",
            reason: "안전계좌 이체 요구",
            severity: "high" as const
          }
        ],
        analysisDetails: {
          voicePattern: "권위적이고 위협적인 말투",
          speechSpeed: 160,
          emotionDetection: "공포감 조성, 권위적 압박",
          backgroundNoise: "사무실 환경"
        },
        recommendations: [
          "즉시 통화 종료",
          "112 또는 검찰청에 직접 확인",
          "계좌 이체 절대 금지",
          "주변인들에게 상황 공유"
        ]
      }
    }

    return baseData[id as keyof typeof baseData] || baseData["1"]
  }

  useEffect(() => {
    const loadDetailData = async () => {
      setIsLoading(true)
      // API 호출 시뮬레이션
      setTimeout(() => {
        const data = getDummyDetailData(id)
        setRecord(data)
        setIsLoading(false)
      }, 800)
    }

    if (id) {
      loadDetailData()
    }
  }, [id])

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-500'
      case 'medium': return 'text-yellow-500'
      case 'low': return 'text-green-500'
      default: return 'text-gray-500'
    }
  }

  const getRiskBadge = (risk: string, confidence: number) => {
    switch (risk) {
      case 'high':
        return <span className="px-3 py-1 bg-red-600 text-white text-sm rounded-full font-medium">위험 {confidence}%</span>
      case 'medium':
        return <span className="px-3 py-1 bg-yellow-600 text-white text-sm rounded-full font-medium">주의 {confidence}%</span>
      case 'low':
        return <span className="px-3 py-1 bg-green-600 text-white text-sm rounded-full font-medium">안전 {confidence}%</span>
      default:
        return <span className="px-3 py-1 bg-gray-600 text-white text-sm rounded-full font-medium">알 수 없음</span>
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high':
        return <span className="px-2 py-1 bg-red-600 text-white text-xs rounded">높음</span>
      case 'medium':
        return <span className="px-2 py-1 bg-yellow-600 text-white text-xs rounded">보통</span>
      case 'low':
        return <span className="px-2 py-1 bg-green-600 text-white text-xs rounded">낮음</span>
      default:
        return <span className="px-2 py-1 bg-gray-600 text-white text-xs rounded">알 수 없음</span>
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-400">상세 분석 결과를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (!record) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl text-gray-400 mb-4">❌</div>
          <p className="text-gray-400 text-lg">데이터를 찾을 수 없습니다.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black p-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <button 
          className="flex items-center text-white hover:text-gray-300 p-2 rounded-lg hover:bg-gray-800 transition-colors"
          onClick={() => window.history.back()}
        >
          ← 돌아가기
        </button>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">분석 상세 결과</h1>
          <p className="text-gray-400 text-sm">ID: {record.id}</p>
        </div>
        <div></div>
      </div>

      <div className="max-w-6xl mx-auto space-y-6">
        {/* 기본 정보 */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-white mb-2">{record.phoneNumber}</h2>
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <span>📅 {record.date}</span>
                <span>⏰ {record.time}</span>
                <span>📞 {record.duration}</span>
              </div>
            </div>
            {getRiskBadge(record.risk, record.confidence)}
          </div>
          <p className="text-gray-300">{record.summary}</p>
          
          {record.keywords.length > 0 && (
            <div className="mt-4">
              <span className="text-white text-sm mb-2 block">감지된 키워드:</span>
              <div className="flex flex-wrap gap-2">
                {record.keywords.map((keyword, index) => (
                  <span key={index} className="px-2 py-1 bg-red-900 text-red-300 text-xs rounded-full">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 통화 내용 */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">📝 통화 내용</h3>
          <div className="bg-gray-800 p-4 rounded-lg">
            <p className="text-gray-300 leading-relaxed">{record.transcript}</p>
          </div>
        </div>

        {/* 의심 구간 */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">⚠️ 의심 구간 분석</h3>
          <div className="space-y-4">
            {record.suspiciousTimes.map((suspicion, index) => (
              <div key={index} className="bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-white font-medium">
                      {suspicion.startTime} - {suspicion.endTime}
                    </span>
                    {getSeverityBadge(suspicion.severity)}
                  </div>
                </div>
                <p className="text-gray-300 text-sm">{suspicion.reason}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 상세 분석 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">🔍 음성 분석</h3>
            <div className="space-y-3">
              <div>
                <span className="text-gray-400 text-sm">음성 패턴:</span>
                <p className="text-white">{record.analysisDetails.voicePattern}</p>
              </div>
              <div>
                <span className="text-gray-400 text-sm">말하기 속도:</span>
                <p className="text-white">{record.analysisDetails.speechSpeed} WPM</p>
              </div>
              <div>
                <span className="text-gray-400 text-sm">감정 분석:</span>
                <p className="text-white">{record.analysisDetails.emotionDetection}</p>
              </div>
              <div>
                <span className="text-gray-400 text-sm">배경음 분석:</span>
                <p className="text-white">{record.analysisDetails.backgroundNoise}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">💡 권장 조치</h3>
            <div className="space-y-2">
              {record.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <span className="text-blue-400 mt-1">•</span>
                  <p className="text-gray-300 text-sm">{recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 신뢰도 차트 */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">📊 분석 신뢰도</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-white">전체 신뢰도</span>
                <span className="text-white font-bold">{record.confidence}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-300 ${
                    record.confidence >= 80 ? 'bg-red-500' : 
                    record.confidence >= 60 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${record.confidence}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}