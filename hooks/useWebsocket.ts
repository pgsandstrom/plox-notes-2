import { useCallback, useEffect, useRef } from "react"
import type { Socket } from "socket.io-client"
import socketio from "socket.io-client"

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
  // hax so websocket stuff is not ran on SSR
  if (typeof window === "undefined") {
    return {} as any
  }
  // hooks are only skipped during SSR, so the call order is stable on the client
  /* oxlint-disable @eslint-react/rules-of-hooks */

  const socketRef = useRef<Socket>(undefined)

  if (socketRef.current === undefined) {
    const socket: Socket = socketio({
      reconnectionDelay: 300,
      reconnectionDelayMax: 1500,
    })
    socketRef.current = socket
    socket.on("connect", () => {
      onConnect()
      socket.emit(WEBSOCKET_COMMAND.SET_ID, noteId)
    })
    socket.on("connect_error", () => {
      setError("Connect error")
    })
    socket.on(WEBSOCKET_COMMAND.LOAD, (data: NotePost) => {
      setNotes(data.notes)
    })
    socket.on(WEBSOCKET_COMMAND.SERVER_ERROR, (data: string) => {
      setError(data)
    })
    socket.on("ok", () => {
      saveComplete()
    })
    socket.on("disconnect", () => {
      setError("Disconnected")
    })
    // reconnection events are emitted by the manager, not the socket
    socket.io.on("reconnect_error", () => {
      setError("Reconnect error")
    })
    socket.io.on("reconnect_failed", () => {
      setError("Reconnect failed")
    })
  }

  // Currently, when returning to a sleeping tab, it takes several seconds to determine that we are disconnected.
  // This useEffect is an attempt to fix this.
  useEffect(() => {
    const visibilityChangeCb = () => {
      if (document.visibilityState === "visible") {
        if (socketRef.current && !socketRef.current.connected) {
          socketRef.current.close().open()
        }
      }
    }
    document.addEventListener("visibilitychange", visibilityChangeCb)
    return () => {
      document.removeEventListener("visibilitychange", visibilityChangeCb)
    }
  }, [])

  return useCallback((command: string, data: unknown) => {
    socketRef.current!.emit(command, data)
  }, [])
}
