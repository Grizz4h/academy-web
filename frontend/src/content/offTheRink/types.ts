export type OffTheRinkBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; text: string }

export type OffTheRinkColumn = {
  slug: string
  number: number
  title: string
  /** ISO date `YYYY-MM-DD`. */
  date: string
  /** Estimated reading time in minutes. */
  readingTime: number
  teaser: string
  content: OffTheRinkBlock[]
  /** Public path or absolute URL. If set, `imageAlt` should be set too. */
  image?: string
  imageAlt?: string
  imageCaption?: string
}

export const OFF_THE_RINK_PATH = '/off-the-rink'
export const OFF_THE_RINK_TITLE = 'OFF THE RINK'
export const OFF_THE_RINK_SUBTITLE =
  'Gedanken über Hockey. Und über alles, was einem dabei noch so auffällt.'
export const OFF_THE_RINK_AUTHOR = 'Christoph'
export const OFF_THE_RINK_ABOUT =
  'Persönliche Kolumnen, kein Newsfeed. Hockey ist oft der Ausgangspunkt — das Thema darf größer sein: Lernen, Anfänger sein, Fankultur, Entscheidungen, Freundschaft, das Stadtleben. Wer mit Hockey wenig am Hut hat, darf trotzdem weiterlesen.'
