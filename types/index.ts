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

export interface NoteMeta {
  id: string
  text: string
}

export interface NoteMetaPost {
  id: string
  metaList: NoteMeta[]
}
