import type socketio from "socket.io"

import type { NotePost } from "../types/index.ts"
import { loadNote, saveNote } from "./noteController.ts"
import { WEBSOCKET_COMMAND } from "./websocketConstants.ts"

interface NoteConnection {
  noteId: string
  socket: socketio.Socket
}

const activeSockets = new Map<string, NoteConnection>()

export default (io: socketio.Server) => {
  // TODO really using the rest interface to update data should trigger all websockets to send out new data... but you know...
  io.sockets.on("connection", (socket) => {
    activeSockets.set(socket.id, { noteId: "", socket })
    socket.on(WEBSOCKET_COMMAND.SET_ID, (noteId: string) => {
      const connection = activeSockets.get(socket.id)
      if (connection === undefined) {
        return
      }
      connection.noteId = noteId
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
          Array.from(activeSockets.entries())
            .filter(([socketId]) => socketId !== socket.id) // Remove own socket
            .filter(([, connection]) => connection.noteId === id) // Remove users in other notes
            .map(([, connection]) => connection.socket)
            .forEach((otherSocket) => otherSocket.emit(WEBSOCKET_COMMAND.LOAD, { id, notes }))
        })
        .catch((e: unknown) => {
          console.error(`failed saving note ${id}`, e)
          socket.emit(WEBSOCKET_COMMAND.SERVER_ERROR, "Save error")
        })
    })
    socket.on("disconnect", () => {
      activeSockets.delete(socket.id)
    })
  })
}
