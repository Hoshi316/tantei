// src/types/case.ts
import { Timestamp } from 'firebase/firestore';

export interface CaseData {
  createdAt: Timestamp;
  answers: string[];
  foundLocation?: string;
  foundMemo?: string;
}