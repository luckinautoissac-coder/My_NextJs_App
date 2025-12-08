import { NextResponse } from 'next/server'
import pool from '@/lib/vps-database'

export async function GET() {
  try {
    // 查询所有不同的userId
    const [rows]: any = await pool.execute(
      'SELECT DISTINCT user_id FROM messages ORDER BY user_id'
    )
    
    const userIds = rows.map((row: any) => row.user_id)
    
    return NextResponse.json({
      success: true,
      userIds,
      count: userIds.length
    })
  } catch (error) {
    console.error('查询userId失败:', error)
    return NextResponse.json(
      { success: false, error: '查询失败' },
      { status: 500 }
    )
  }
}

