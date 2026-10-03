import { useCallback, useEffect, useRef } from "react"
import socketio, { Socket } from "socket.io-client"

import getServerUrl from "../server/util/serverUrl"
import { WEBSOCKET_COMMAND } from "../server/websocketConstants"
import { Note, NotePost } from "../types"

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
    const socket: Socket = socketio(getServerUrl(), {
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
    socket.on("connect_timeout", () => {
      setError("Connect timeout")
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
    socket.on("error", (errorObj: any) => {
      setError("Connect error")
      console.log(`error: ${JSON.stringify(errorObj)}`)
    })
    socket.on("reconnect_error", (_errorObj: any) => {
      setError("Reconnect error")
    })
    socket.on("reconnect_failed", (_errorObj: any) => {
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
