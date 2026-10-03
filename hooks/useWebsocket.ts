import { useCallback, useEffect, useEffectEvent, useRef } from "react"
import socketio, { type Socket } from "socket.io-client"

import { WEBSOCKET_COMMAND } from "../server/websocketConstants.ts"
import type { Note, NotePost } from "../types/index.ts"

// TODO we could really have a better type system for sending stuff through the websocket.
export default function useWebsocket(
  noteId: string,
  setError: (error?: string) => void,
  setNotes: (notes: Note[]) => void,
  saveComplete: () => void,
  onConnect: () => void,
): (command: string, data: unknown) => void {
  const socketRef = useRef<Socket>(undefined)

  // the socket lives as long as the effect, so these always call the latest callbacks
  const onConnectEvent = useEffectEvent(onConnect)
  const setErrorEvent = useEffectEvent(setError)
  const setNotesEvent = useEffectEvent(setNotes)
  const saveCompleteEvent = useEffectEvent(saveComplete)

  // effects do not run during SSR, so the socket is only created in the browser
  useEffect(() => {
    const socket: Socket = socketio({
      reconnectionDelay: 300,
      reconnectionDelayMax: 1500,
    })
    socketRef.current = socket
    socket.on("connect", () => {
      onConnectEvent()
      socket.emit(WEBSOCKET_COMMAND.SET_ID, noteId)
    })
    socket.on("connect_error", () => {
      setErrorEvent("Connect error")
    })
    socket.on(WEBSOCKET_COMMAND.LOAD, (data: NotePost) => {
      setNotesEvent(data.notes)
    })
    socket.on(WEBSOCKET_COMMAND.SERVER_ERROR, (data: string) => {
      setErrorEvent(data)
    })
    socket.on("ok", () => {
      saveCompleteEvent()
    })
    socket.on("disconnect", () => {
      setErrorEvent("Disconnected")
    })
    // reconnection events are emitted by the manager, not the socket
    socket.io.on("reconnect_error", () => {
      setErrorEvent("Reconnect error")
    })
    socket.io.on("reconnect_failed", () => {
      setErrorEvent("Reconnect failed")
    })

    // Currently, when returning to a sleeping tab, it takes several seconds to determine that we are disconnected.
    // This is an attempt to fix this.
    const visibilityChangeCb = () => {
      if (document.visibilityState === "visible" && !socket.connected) {
        socket.close().open()
      }
    }
    document.addEventListener("visibilitychange", visibilityChangeCb)

    return () => {
      document.removeEventListener("visibilitychange", visibilityChangeCb)
      // remove listeners first, so closing does not report "Disconnected"
      socket.removeAllListeners()
      socket.io.removeAllListeners()
      socket.close()
      socketRef.current = undefined
    }
  }, [noteId])

  return useCallback((command: string, data: unknown) => {
    socketRef.current?.emit(command, data)
  }, [])
}
