import { NextRequest, NextResponse } from 'next/server';
import { DataStorage } from '@/lib/dataStorage';

export async function GET(request: NextRequest) {
  try {
    const dataStorage = new DataStorage();
    const users = await dataStorage.getUniqueUsers();

    return NextResponse.json({ users });

  } catch (error) {
    console.error('Users fetch error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred while fetching users' },
      { status: 500 }
    );
  }
}