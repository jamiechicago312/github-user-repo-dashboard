import { NextRequest, NextResponse } from 'next/server';
import { DataStorage } from '@/lib/dataStorage';

export async function GET(request: NextRequest) {
  try {
    const dataStorage = new DataStorage();
    const analyses = await dataStorage.getAllAnalyses();

    return NextResponse.json({ analyses });

  } catch (error) {
    console.error('Analyses fetch error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred while fetching analyses' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, notes, creditRecommendation } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Analysis ID is required' },
        { status: 400 }
      );
    }

    const dataStorage = new DataStorage();
    
    // Handle notes update
    if (notes !== undefined) {
      const success = await dataStorage.updateAnalysisNotes(id, notes || '');
      if (!success) {
        return NextResponse.json(
          { error: 'Analysis not found or could not be updated' },
          { status: 404 }
        );
      }
    }
    
    // Handle credit recommendation update
    if (creditRecommendation !== undefined) {
      const success = await dataStorage.updateAnalysisCreditRecommendation(id, creditRecommendation);
      if (!success) {
        return NextResponse.json(
          { error: 'Analysis not found or could not be updated' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Analysis update error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred while updating analysis' },
      { status: 500 }
    );
  }
}