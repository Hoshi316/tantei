// src/types/case.ts
import { Timestamp } from 'firebase/firestore';

export interface CaseData {
  id: string;
  createdAt: Timestamp;
  answers: string[];
  foundLocation?: string;
  foundMemo?: string;
   status: 'found' | 'pending';
}