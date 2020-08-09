export type Dictionary<K extends string | number | symbol, V> = {
  [key in K]: V
}

export type PartialDict<K extends string | number | symbol, V> = {
  [key in K]?: V
}

export interface Note {
  id: string
  text: string
  checked: boolean
}

export interface NotePost {
  id: string
  notes: Note[]
}
