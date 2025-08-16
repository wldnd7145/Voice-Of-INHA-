"use client"

import { useState, useEffect } from "react"


interface AnalysisRecord {
  id: string
  date: string
  time: string
  duration: string
  phoneNumber: string
  risk: 'low' | 'medium' | 'high'
  confidence: number
  keywords: string[]
  summary: string
}

export default function PastListPage() {
  const [records, setRecords] = useState<AnalysisRecord[]>([])
  const [filteredRecords, setFilteredRecords] = useState<AnalysisRecord[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRisk, setFilterRisk] = useState<'all' | 'high' | 'medium' | 'low'>('all')
  const [isLoading, setIsLoading] = useState(true)

  // 더미 데이터 (실제로는 DB에서 가져올 데이터)
  const dummyData: AnalysisRecord[] = [
    {
      id: "1",
      date: "2024-08-16",
      time: "14:30:22",
      duration: "5:43",
      phoneNumber: "010-1234-5678",
      risk: "high",
      confidence: 87,
      keywords: ["은행", "계좌이체", "긴급", "보안"],
      summary: "금융기관을 사칭하여 계좌이체를 요구하는 의심스러운 통화가 감지되었습니다."
    },
    {
      id: "2",
      date: "2024-08-15",
      time: "09:15:33",
      duration: "2:11",
      phoneNumber: "02-9876-5432",
      risk: "medium",
      confidence: 64,
      keywords: ["당첨", "상금", "개인정보"],
      summary: "상금 당첨을 빌미로 개인정보를 요구하는 통화가 감지되었습니다."
    },
    {
      id: "3",
      date: "2024-08-14",
      time: "16:22:11",
      duration: "1:35",
      phoneNumber: "010-5555-1234",
      risk: "low",
      confidence: 23,
      keywords: [],
      summary: "정상적인 업무 통화로 판단됩니다."
    },
    {
      id: "4",
      date: "2024-08-13",
      time: "11:45:55",
      duration: "7:28",
      phoneNumber: "070-1111-2222",
      risk: "high",
      confidence: 92,
      keywords: ["검찰청", "체포영장", "계좌확인", "송금"],
      summary: "수사기관을 사칭하여 금전을 요구하는 보이스피싱 통화가 강력히 의심됩니다."
    },
    {
      id: "5",
      date: "2024-08-12",
      time: "20:33:44",
      duration: "3:17",
      phoneNumber: "010-7777-8888",
      risk: "medium",
      confidence: 71,
      keywords: ["대출", "신용", "급전"],
      summary: "불법 대출업체로 의심되는 통화가 감지되었습니다."
    },
    {
      id: "6",
      date: "2024-08-11",
      time: "13:12:08",
      duration: "4:55",
      phoneNumber: "010-3333-4444",
      risk: "low",
      confidence: 15,
      keywords: [],
      summary: "친구와의 일반적인 통화로 판단됩니다."
    }
  ]

  useEffect(() => {
    // 실제 환경에서는 API 호출
    const loadData = async () => {
      setIsLoading(true)
      // API 호출 시뮬레이션
      setTimeout(() => {
        setRecords(dummyData)
        setFilteredRecords(dummyData)
        setIsLoading(false)
      }, 1000)
    }
    
    loadData()
  }, [])

  useEffect(() => {
    let filtered = records

    // 검색어 필터
    if (searchTerm) {
      filtered = filtered.filter(record => 
        record.phoneNumber.includes(searchTerm) ||
        record.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.keywords.some(keyword => keyword.includes(searchTerm))
      )
    }

    // 위험도 필터
    if (filterRisk !== 'all') {
      filtered = filtered.filter(record => record.risk === filterRisk)
    }

    setFilteredRecords(filtered)
  }, [searchTerm, filterRisk, records])

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

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'high': return <span className="text-red-500 text-xl">⚠️</span>
      case 'medium': return <span className="text-yellow-500 text-xl">🛡️</span>
      case 'low': return <span className="text-green-500 text-xl">✅</span>
      default: return <span className="text-gray-400 text-xl">🛡️</span>
    }
  }

  return (
    <div className="min-h-screen bg-black p-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button 
            className="flex items-center text-white hover:text-gray-300 p-2 rounded-lg hover:bg-gray-800 transition-colors"
            onClick={() => window.history.back()}
          >
            ← 돌아가기
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">
          과거 분석 이력
        </h1>

        {/* 검색 및 필터 */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="전화번호나 키워드로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterRisk('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterRisk === 'all' 
                  ? 'bg-gray-600 text-white' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setFilterRisk('high')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterRisk === 'high' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-800 text-red-400 hover:bg-red-600 hover:text-white border border-red-600'
              }`}
            >
              위험
            </button>
            <button
              onClick={() => setFilterRisk('medium')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterRisk === 'medium' 
                  ? 'bg-yellow-600 text-white' 
                  : 'bg-gray-800 text-yellow-400 hover:bg-yellow-600 hover:text-white border border-yellow-600'
              }`}
            >
              주의
            </button>
            <button
              onClick={() => setFilterRisk('low')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterRisk === 'low' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-800 text-green-400 hover:bg-green-600 hover:text-white border border-green-600'
              }`}
            >
              안전
            </button>
          </div>
        </div>

        {/* 로딩 상태 */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            <p className="text-gray-400 mt-4">데이터를 불러오는 중...</p>
          </div>
        )}

        {/* 결과 없음 */}
        {!isLoading && filteredRecords.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl text-gray-400 mb-4">🛡️</div>
            <p className="text-gray-400 text-lg">검색 결과가 없습니다.</p>
          </div>
        )}

        {/* 분석 이력 목록 */}
        {!isLoading && filteredRecords.length > 0 && (
          <div className="space-y-4">
            {filteredRecords.map((record) => (
              <div 
                key={record.id} 
                className="bg-gray-900 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors shadow-lg cursor-pointer"
                onClick={() => window.location.href = `/pastlist/${record.id}`}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {getRiskIcon(record.risk)}
                      <div>
                        <h3 className="text-white text-lg font-semibold">{record.phoneNumber}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-400 mt-1">
                          <div className="flex items-center">
                            <span className="mr-1">📅</span>
                            {record.date}
                          </div>
                          <div className="flex items-center">
                            <span className="mr-1">⏰</span>
                            {record.time}
                          </div>
                          <div className="flex items-center">
                            <span className="mr-1">📞</span>
                            {record.duration}
                          </div>
                        </div>
                      </div>
                    </div>
                    {getRiskBadge(record.risk, record.confidence)}
                  </div>
                  <p className="text-gray-300 mb-3">{record.summary}</p>
                  {record.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {record.keywords.map((keyword, index) => (
                        <span 
                          key={index}
                          className="px-2 py-1 bg-red-900 text-red-300 text-xs rounded-full"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 text-right">
                    <span className="text-gray-400 text-sm">클릭하여 상세보기 →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 통계 정보 */}
        {!isLoading && records.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white mb-1">
                {records.length}
              </div>
              <div className="text-sm text-gray-400">총 분석 건수</div>
            </div>
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-400 mb-1">
                {records.filter(r => r.risk === 'high').length}
              </div>
              <div className="text-sm text-gray-400">위험 탐지</div>
            </div>
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400 mb-1">
                {records.filter(r => r.risk === 'low').length}
              </div>
              <div className="text-sm text-gray-400">안전 확인</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}