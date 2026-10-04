import type { Server } from "socket.io"

import type { NotePost } from "../types/index.ts"
import { loadNote, saveNote } from "./noteController.ts"
import { WEBSOCKET_COMMAND } from "./websocketConstants.ts"

// Every socket joins a room named after its note id, so updates can be sent to everyone on that note.
// socket.io leaves all rooms by itself on disconnect.
export default (io: Server) => {
  // TODO really using the rest interface to update data should trigger all websockets to send out new data... but you know...
  io.on("connection", (socket) => {
    let currentNoteId: string | undefined

    socket.on(WEBSOCKET_COMMAND.SET_ID, (noteId: string) => {
      if (currentNoteId !== undefined) {
        void socket.leave(currentNoteId)
      }
      currentNoteId = noteId
      void socket.join(noteId)
      // When client clarifies who they are, send out the data to them!
      // This is good when a client disconnects and then connects again.
      loadNote(noteId)
        .then((notes) => {
          if (notes) {
            const noteData: NotePost = { id: noteId, notes }
            socket.emit(WEBSOCKET_COMMAND.LOAD, noteData)
          }
        })
        .catch((e: unknown) => {
          console.error(`failed loading note ${noteId}`, e)
          socket.emit(WEBSOCKET_COMMAND.SERVER_ERROR, "Load error")
        })
    })
    socket.on(WEBSOCKET_COMMAND.POST, (data: NotePost) => {
      const { id, notes } = data
      saveNote(id, notes)
        .then(() => {
          // socket.to() sends to everyone in the room except this socket
          const noteData: NotePost = { id, notes }
          socket.to(id).emit(WEBSOCKET_COMMAND.LOAD, noteData)
        })
        .catch((e: unknown) => {
          console.error(`failed saving note ${id}`, e)
          socket.emit(WEBSOCKET_COMMAND.SERVER_ERROR, "Save error")
        })
    })
  })
}
