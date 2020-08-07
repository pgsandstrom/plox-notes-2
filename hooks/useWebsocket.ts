import socketio from "socket.io-client";
import { useRef } from "react";
import { Note, WEBSOCKET_COMMAND } from "types";
import getServerUrl from "server/util/serverUrl";

export default function useWebsocket(
  noteId: string,
  setError: (error?: string) => void,
  setNotes: (notes: Note[]) => void,
  saveComplete: () => void
): (command: string, notes: Note[]) => void {
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
      console.log("receive ok");
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
      console.log(JSON.stringify(errorObj));
    });
    socket.on("reconnect_error", (_errorObj: any) => {
      setError("Reconnect error");
    });
    socket.on("reconnect_failed", (_errorObj: any) => {
      setError("Reconnect failed");
    });
  }

  // TODO use typescript and types for "command"
  return (command: string, notes: Note[]) => {
    console.log(`emitting ${command} with ${JSON.stringify(notes)}`);
    socketRef.current!.emit(command, notes);
  };
}
