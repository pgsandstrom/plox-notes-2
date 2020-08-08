import socketio from "socket.io-client";
import { useRef } from "react";
import { Note } from "types";
import getServerUrl from "server/util/serverUrl";
import { WEBSOCKET_COMMAND } from "server/websocketConstants";

// TODO we could really have a better type system for sending stuff through the websocket.
export default function useWebsocket(
  noteId: string,
  setError: (error?: string) => void,
  setNotes: (notes: Note[]) => void,
  saveComplete: () => void
): (command: string, data: {}) => void {
  // hax so websocket stuff is not ran on SSR
  if (typeof window === "undefined") {
    return {} as any;
  }

  const socketRef = useRef<SocketIOClient.Socket>();

  if (socketRef.current === undefined) {
    const socket = socketio(getServerUrl());
    socketRef.current = socket;
    socket.on("connect", () => {
      setError();
      socket.emit(WEBSOCKET_COMMAND.SET_ID, noteId);
    });
    socket.on("connect_error", () => {
      setError("Connect error");
    });
    socket.on("connect_timeout", () => {
      setError("Connect timeout");
    });
    socket.on(WEBSOCKET_COMMAND.LOAD, (data: any) => {
      setNotes(data.notes as Note[]);
    });
    socket.on("ok", () => {
      saveComplete();
    });
    socket.on("connect_error", () => {
      setError("Connect error 2");
    });
    socket.on("disconnect", () => {
      setError("Disconnected");
    });
    socket.on("error", (errorObj: any) => {
      setError("Connect error");
      console.log(`error: ${JSON.stringify(errorObj)}`);
    });
    socket.on("reconnect_error", (_errorObj: any) => {
      setError("Reconnect error");
    });
    socket.on("reconnect_failed", (_errorObj: any) => {
      setError("Reconnect failed");
    });
  }

  // TODO use typescript and types for "command"
  return (command: string, data: {}) => {
    socketRef.current!.emit(command, data);
  };
}
