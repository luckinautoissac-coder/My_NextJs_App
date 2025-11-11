'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2, AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface AgentDataCleanerProps {
  onClean?: () => void
}

export function CleanAgentDataButton({ onClean }: AgentDataCleanerProps) {
  const [open, setOpen] = useState(false)
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])

  const problemAgents = [
    { id: 'fujicl-quotation-optimization-assistant', name: 'FUJICL-报价优化助理' },
    { id: 'mu-annie-business-assistant', name: 'MU-Annie的业务助理' },
  ]

  const toggleAgent = (agentId: string) => {
    setSelectedAgents(prev =>
      prev.includes(agentId)
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    )
  }

  const cleanAgentData = () => {
    try {
      // 1. 清理选中智能体的Topics
      const topicStoreData = localStorage.getItem('topic-store')
      if (topicStoreData) {
        const topicStore = JSON.parse(topicStoreData)
        if (topicStore.state?.topics) {
          topicStore.state.topics = topicStore.state.topics.filter(
            (topic: any) => !selectedAgents.includes(topic.agentId)
          )
          // 如果当前选中的topic属于被清理的智能体，也清除它
          if (topicStore.state.currentTopicId) {
            const currentTopicExists = topicStore.state.topics.some(
              (t: any) => t.id === topicStore.state.currentTopicId
            )
            if (!currentTopicExists) {
              topicStore.state.currentTopicId = null
            }
          }
          localStorage.setItem('topic-store', JSON.stringify(topicStore))
        }
      }

      // 2. 清理选中智能体的Messages
      const chatStoreData = localStorage.getItem('chat-store')
      if (chatStoreData) {
        const chatStore = JSON.parse(chatStoreData)
        if (chatStore.state?.messages) {
          // 获取要删除的topicIds
          const topicsToDelete = topicStoreData
            ? JSON.parse(topicStoreData).state.topics
                .filter((topic: any) => selectedAgents.includes(topic.agentId))
                .map((t: any) => t.id)
            : []

          chatStore.state.messages = chatStore.state.messages.filter(
            (msg: any) => !topicsToDelete.includes(msg.topicId)
          )
          localStorage.setItem('chat-store', JSON.stringify(chatStore))
        }
      }

      toast.success('清理成功', {
        description: `已清理 ${selectedAgents.length} 个智能体的历史数据`,
      })

      setOpen(false)
      setSelectedAgents([])
      onClean?.()

      // 刷新页面以重新加载数据
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      console.error('清理数据失败:', error)
      toast.error('清理失败', {
        description: '请检查控制台以获取详细信息',
      })
    }
  }

  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2"
      >
        <Trash2 className="h-4 w-4" />
        清理问题智能体数据
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              清理智能体历史数据
            </DialogTitle>
            <DialogDescription>
              选择要清理历史数据的智能体。这将删除该智能体的所有对话历史和主题，但不会影响其他智能体。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {problemAgents.map((agent) => (
              <div key={agent.id} className="flex items-center space-x-2">
                <Checkbox
                  id={agent.id}
                  checked={selectedAgents.includes(agent.id)}
                  onCheckedChange={() => toggleAgent(agent.id)}
                />
                <Label
                  htmlFor={agent.id}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {agent.name}
                </Label>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={cleanAgentData}
              disabled={selectedAgents.length === 0}
            >
              确认清理 ({selectedAgents.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

