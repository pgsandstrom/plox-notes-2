// import { save, load } from './controller/note';
import socketio from 'socket.io'
import { PartialDict, NotePost } from 'types'
import { loadNote, saveNote } from './noteController'
import { WEBSOCKET_COMMAND } from './websocketConstants'

interface NoteConnection {
  noteId: string
  socket: socketio.Socket
}

const activeSockets: PartialDict<string, NoteConnection> = {}

// typing sucks with the websockets, so we disable these rules...
/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call */

export default (io: socketio.Server) => {
  // TODO really using the rest interface to update data should trigger all websockets to send out new data... but you know...
  io.sockets.on('connection', (socket) => {
    activeSockets[socket.id] = { noteId: '', socket }
    socket.on(WEBSOCKET_COMMAND.SET_ID, (noteId: string) => {
      if (activeSockets[socket.id] === undefined) {
        return
      }
      activeSockets[socket.id]!.noteId = noteId
      // When client clarifies who they are, send out the data to them!
      // Is this really necessary? Only matters if data updated between page load and websocket connection
      // Maybe remove this...
      loadNote(noteId)
        .then((notes) => {
          if (notes) {
            const noteData: NotePost = { id: noteId, notes: notes.data }
            socket.emit(WEBSOCKET_COMMAND.LOAD, noteData)
          }
        })
        // TODO send out error to client when loading or saving fails
        .catch(() => {
          console.error(`failed loading note ${noteId}`)
          socket.emit(WEBSOCKET_COMMAND.SERVER_ERROR, 'Load error')
        })
    })
    socket.on(WEBSOCKET_COMMAND.POST, (data: NotePost) => {
      const { id, notes } = data
      saveNote(id, notes)
        .then(() => {
          Object.keys(activeSockets)
            .filter((socketId) => socketId !== socket.id) // Remove own socket
            .filter((socketId) => activeSockets[socketId]?.noteId === id) // Remove users in other notes
            .map((socketId) => activeSockets[socketId]!.socket)
            .forEach((otherSocket) => otherSocket.emit(WEBSOCKET_COMMAND.LOAD, { id, notes }))
          socket.emit('ok')
        })
        .catch(() => {
          console.error(`failed saving note ${id}`)
          socket.emit(WEBSOCKET_COMMAND.SERVER_ERROR, 'Save error')
        })
    })
    socket.on('disconnect', () => {
      delete activeSockets[socket.id]
    })
  })
}
