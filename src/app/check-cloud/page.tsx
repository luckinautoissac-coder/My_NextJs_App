'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Database, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react'
import { getUserId } from '@/lib/supabase'

export default function CheckCloudPage() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState('')

  const handleCheck = async () => {
    try {
      setLoading(true)
      setError('')
      
      const response = await fetch('/api/check-supabase', {
        headers: {
          'x-user-id': getUserId()
        }
      })
      
      const result = await response.json()
      
      if (result.success) {
        setData(result)
      } else {
        setError(result.error)
      }
    } catch (err) {
      console.error('检查失败:', err)
      setError(err instanceof Error ? err.message : '未知错误')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Database className="h-8 w-8" />
          云端数据检查
        </h1>
        <p className="text-muted-foreground">
          查看Supabase云端数据库中实际存储的数据量
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>检查Supabase数据</CardTitle>
          <CardDescription>
            查询云端数据库中的实际数据总量
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleCheck}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                正在检查...
              </>
            ) : (
              <>
                <Database className="h-4 w-4 mr-2" />
                开始检查云端数据
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>❌ {error}</AlertDescription>
        </Alert>
      )}

      {data && (
        <>
          <Card className="border-green-500 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-700 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                云端数据统计
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-white rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">{data.total.messages}</div>
                  <div className="text-sm text-gray-600">消息总数</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg">
                  <div className="text-3xl font-bold text-green-600">{data.total.topics}</div>
                  <div className="text-sm text-gray-600">话题总数</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>各话题消息分布</CardTitle>
              <CardDescription>
                每个话题下的消息数量统计
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {data.topicStats?.map((topic: any) => (
                  <div key={topic.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div className="flex-1">
                      <div className="font-medium">{topic.title}</div>
                      <div className="text-xs text-gray-500">{topic.agentId}</div>
                    </div>
                    <div className="text-lg font-bold text-blue-600">{topic.messageCount} 条</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {data.total.messages < 1887 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>⚠️ 数据不完整！</strong>
                <p className="mt-2">
                  云端只有 {data.total.messages} 条消息，但备份文件有 1887 条。
                  <br />
                  丢失了约 {1887 - data.total.messages} 条消息。
                </p>
                <p className="mt-2">
                  建议：
                  <br />
                  1. 访问 <a href="/clear-cloud-data" className="underline font-bold">/clear-cloud-data</a> 清空云端数据
                  <br />
                  2. 访问 <a href="/migrate-to-cloud" className="underline font-bold">/migrate-to-cloud</a> 重新迁移
                </p>
              </AlertDescription>
            </Alert>
          )}
        </>
      )}
    </div>
  )
}

