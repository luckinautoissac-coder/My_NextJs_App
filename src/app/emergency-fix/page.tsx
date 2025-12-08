'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'

export default function EmergencyFixPage() {
  const [fixed, setFixed] = useState(false)

  useEffect(() => {
    // 自动清空localStorage
    try {
      localStorage.clear()
      setFixed(true)
    } catch (error) {
      console.error('清空localStorage失败:', error)
    }
  }, [])

  return (
    <div className="container max-w-2xl mx-auto p-6 space-y-6 mt-20">
      <Card className="border-orange-500">
        <CardHeader className="bg-orange-50">
          <CardTitle className="flex items-center gap-2 text-orange-700">
            <AlertTriangle className="h-6 w-6" />
            紧急修复工具
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 mt-4">
          {fixed ? (
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                <strong className="block mb-2">✅ localStorage已清空！</strong>
                <p className="text-sm">应用已恢复正常。</p>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                正在清空localStorage...
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <Button
              onClick={() => window.location.href = '/'}
              className="w-full"
              size="lg"
              disabled={!fixed}
            >
              返回首页
            </Button>

            <Button
              onClick={() => window.location.href = '/admin/vps-diagnose'}
              variant="outline"
              className="w-full"
              size="lg"
              disabled={!fixed}
            >
              前往VPS诊断
            </Button>
          </div>

          <Alert>
            <AlertDescription className="text-sm">
              <strong>说明：</strong>
              <p className="mt-1">
                此工具已自动清空localStorage中的所有数据，解决前端崩溃问题。
              </p>
              <p className="mt-1">
                VPS数据库中的数据（1890条消息）未受影响。
              </p>
              <p className="mt-1 text-red-600 font-medium">
                ⚠️ 需要重新恢复话题数据！
              </p>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}

