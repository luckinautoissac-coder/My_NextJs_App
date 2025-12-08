/**
 * 清理异常的思考消息脚本
 * 
 * 使用方法：
 * 1. 打开浏览器的开发者工具（F12）
 * 2. 切换到 Console 标签
 * 3. 复制并粘贴这段代码
 * 4. 按 Enter 执行
 * 
 * 这个脚本会：
 * - 检查 localStorage 中的聊天记录
 * - 找出所有异常的思考消息（思考时间超过5分钟）
 * - 将它们转换为错误消息
 */

(function() {
  console.log('开始检查并清理异常的思考消息...')
  
  try {
    // 读取 chat-store
    const chatStoreData = localStorage.getItem('chat-store')
    
    if (!chatStoreData) {
      console.log('未找到聊天记录')
      return
    }
    
    const chatStore = JSON.parse(chatStoreData)
    
    if (!chatStore.state || !chatStore.state.messages) {
      console.log('聊天记录格式异常')
      return
    }
    
    let fixedCount = 0
    const now = new Date().getTime()
    
    // 遍历所有消息
    chatStore.state.messages = chatStore.state.messages.map(message => {
      // 检查是否是异常的思考消息
      if (message.messageType === 'thinking' && message.thinkingInfo?.startTime) {
        const startTime = new Date(message.thinkingInfo.startTime).getTime()
        const elapsed = (now - startTime) / 1000 // 秒
        
        if (elapsed > 300) { // 超过5分钟
          console.log(`发现异常消息:`, {
            id: message.id,
            思考时长: `${Math.floor(elapsed / 60)}分${Math.floor(elapsed % 60)}秒`,
            开始时间: new Date(message.thinkingInfo.startTime).toLocaleString()
          })
          
          fixedCount++
          
          // 转换为错误消息
          return {
            ...message,
            content: '❌ 消息加载失败（数据异常已修复）',
            status: 'error',
            messageType: 'normal',
            thinkingInfo: undefined
          }
        }
      }
      
      return message
    })
    
    if (fixedCount > 0) {
      // 保存修复后的数据
      localStorage.setItem('chat-store', JSON.stringify(chatStore))
      console.log(`✅ 成功修复 ${fixedCount} 条异常消息`)
      console.log('请刷新页面以查看修复结果')
    } else {
      console.log('✅ 没有发现异常的思考消息')
    }
    
  } catch (error) {
    console.error('❌ 清理过程出错:', error)
  }
})()

