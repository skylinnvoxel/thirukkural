export interface Kural {
  number: number
  chapterNumber: number
  chapterNameTamil: string
  sectionNameTamil: string
  bookNameTamil: string
  kuralTamil: string
  meaningTamil: string
  audioKuralUrl: string | null
  audioExplanationUrl: string | null
  tags: string[]
}

export interface ChapterSummary {
  chapterNumber: number
  chapterNameTamil: string | null
  sectionNameTamil: string | null
  bookNameTamil: string | null
  kuralStart: number
  kuralEnd: number
  hasData: boolean
}

export const TOTAL_KURALS = 1330
export const TOTAL_CHAPTERS = 133
