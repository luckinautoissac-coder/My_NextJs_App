import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/vps-database'

export async function POST(request: NextRequest) {
  try {
    // 检查数据库表结构
    const [columns]: any = await pool.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'messages'
    `, [process.env.DB_NAME])

    const existingColumns = columns.map((col: any) => col.COLUMN_NAME)
    const updates: string[] = []

    // 检查并添加缺失的列
    if (!existingColumns.includes('model_responses')) {
      await pool.execute('ALTER TABLE messages ADD COLUMN model_responses JSON NULL')
      updates.push('添加 model_responses 列')
    }

    if (!existingColumns.includes('selected_model_id')) {
      await pool.execute('ALTER TABLE messages ADD COLUMN selected_model_id VARCHAR(255) NULL')
      updates.push('添加 selected_model_id 列')
    }

    if (!existingColumns.includes('thinking_info')) {
      await pool.execute('ALTER TABLE messages ADD COLUMN thinking_info JSON NULL')
      updates.push('添加 thinking_info 列')
    }

    if (updates.length === 0) {
      return NextResponse.json({
        success: true,
        message: '✅ 数据库表结构已是最新，无需更新',
        alreadyUpToDate: true
      })
    }

    return NextResponse.json({
      success: true,
      message: `✅ 数据库表结构更新成功！`,
      updates
    })

  } catch (error: any) {
    console.error('Database setup error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error.sqlMessage || error.toString()
    }, { status: 500 })
  }
}

