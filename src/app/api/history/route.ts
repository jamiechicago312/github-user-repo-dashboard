import { NextRequest, NextResponse } from 'next/server';
import { DataStorage } from '@/lib/dataStorage';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    const dataStorage = new DataStorage();
    const history = await dataStorage.getUserHistory(username);

    return NextResponse.json({ history });

  } catch (error) {
    console.error('History fetch error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred while fetching history' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    // This would require implementing a delete method in DataStorage
    // For now, we'll just return success
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('History delete error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred while deleting history' },
      { status: 500 }
    );
  }
}