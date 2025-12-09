// 清理备份文件中的异常思考消息
const fs = require('fs');

console.log('🔧 开始修复备份文件...\n');

// 读取备份文件
const backupData = JSON.parse(fs.readFileSync('backup-data.json', 'utf8'));

console.log(`📊 原始数据统计:`);
console.log(`   消息总数: ${backupData.data.messages.length}`);
console.log(`   话题总数: ${backupData.data.topics.length}\n`);

// 统计异常消息
let removedCount = 0;
let fixedCount = 0;

// 过滤消息
const cleanedMessages = backupData.data.messages.filter(msg => {
  // 删除空内容且状态为sending的thinking消息
  if (msg.messageType === 'thinking' && 
      msg.status === 'sending' && 
      (!msg.content || msg.content.trim() === '')) {
    console.log(`❌ 删除异常思考消息: ${msg.id.substring(0, 8)}... (话题: ${msg.topicId?.substring(0, 8)}...)`);
    removedCount++;
    return false;
  }
  
  // 修复status为sending但不是thinking的消息
  if (msg.status === 'sending' && msg.messageType !== 'thinking') {
    console.log(`🔧 修复发送中消息: ${msg.id.substring(0, 8)}... 改为sent`);
    msg.status = 'sent';
    fixedCount++;
  }
  
  // 修复没有messageType的消息
  if (!msg.messageType) {
    msg.messageType = 'normal';
  }
  
  return true;
});

// 更新数据
backupData.data.messages = cleanedMessages;

// 保存修复后的文件
fs.writeFileSync('backup-data-fixed.json', JSON.stringify(backupData, null, 2));

console.log(`\n✅ 修复完成！`);
console.log(`   删除异常消息: ${removedCount} 条`);
console.log(`   修复状态: ${fixedCount} 条`);
console.log(`   剩余消息: ${cleanedMessages.length} 条`);
console.log(`\n📁 已保存到: backup-data-fixed.json`);
console.log(`\n🎯 下一步:`);
console.log(`   1. 用 backup-data-fixed.json 替换原来的备份文件`);
console.log(`   2. 在前台导入 backup-data-fixed.json`);
console.log(`   3. 测试是否还会崩溃`);

