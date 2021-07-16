export type Dictionary<K extends string | number | symbol, V> = {
  [key in K]: V
}

export type PartialDict<K extends string | number | symbol, V> = {
  [key in K]?: V
}

// old notes might not have indentation on them. I could fix some kind of migration script to adress this.
export interface NoteDb {
  id: string
  text: string
  checked: boolean
  indentation?: number
}

export interface Note {
  id: string
  text: string
  checked: boolean
  indentation: number
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
