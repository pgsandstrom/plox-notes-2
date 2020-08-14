import socketio from 'socket.io-client'
import { useRef } from 'react'
import { Note, NotePost } from 'types'
import getServerUrl from 'server/util/serverUrl'
import { WEBSOCKET_COMMAND } from 'server/websocketConstants'

// TODO we could really have a better type system for sending stuff through the websocket.
export default function useWebsocket(
  noteId: string,
  setError: (error?: string) => void,
  setNotes: (notes: Note[]) => void,
  saveComplete: () => void,
  onConnect: () => void,
): (command: string, data: unknown) => void {
  // hax so websocket stuff is not ran on SSR
  if (typeof window === 'undefined') {
    // eslint-disable-next-line
    return {} as any
  }
  /* eslint-disable react-hooks/rules-of-hooks */

  const socketRef = useRef<SocketIOClient.Socket>()

  if (socketRef.current === undefined) {
    const socket = socketio(getServerUrl())
    socketRef.current = socket
    socket.on('connect', () => {
      onConnect()
      socket.emit(WEBSOCKET_COMMAND.SET_ID, noteId)
    })
    socket.on('connect_error', () => {
      setError('Connect error')
    })
    socket.on('connect_timeout', () => {
      setError('Connect timeout')
    })
    socket.on(WEBSOCKET_COMMAND.LOAD, (data: NotePost) => {
      setNotes(data.notes)
    })
    socket.on(WEBSOCKET_COMMAND.SERVER_ERROR, (data: string) => {
      setError(data)
    })
    socket.on('ok', () => {
      saveComplete()
    })
    socket.on('connect_error', () => {
      setError('Connect error 2')
    })
    socket.on('disconnect', () => {
      setError('Disconnected')
    })
    socket.on('error', (errorObj: any) => {
      setError('Connect error')
      console.log(`error: ${JSON.stringify(errorObj)}`)
    })
    socket.on('reconnect_error', (_errorObj: any) => {
      setError('Reconnect error')
    })
    socket.on('reconnect_failed', (_errorObj: any) => {
      setError('Reconnect failed')
    })
  }

  return (command: string, data: unknown) => {
    socketRef.current!.emit(command, data)
  }
}
