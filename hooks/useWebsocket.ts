import socketio from "socket.io-client";
import { useEffect } from "react";
import { Note } from "types";

export default (
  noteId: string,
  setError: (error: string) => void,
  setNotes: (notes: Note[]) => void
) => {
  //
  useEffect(() => {
    const socket = socketio(getServerUrl());
    socket.on("connect", () => {
      setError("");
      socket.emit("setId", noteId);
    });
    socket.on("connect_error", () => {
      setError("Connect error");
    });
    socket.on("connect_timeout", () => {
      setError("Connect timeout");
    });
    socket.on("load", (data: any) => {
      console.log("load trough websocket");
      setNotes(data.notes as Note[]);
    });
    socket.on("ok", () => {
      // TODO test this
      console.log("save done");
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
  }, []);
};

const getServerUrl = () => {
  const port = location.port ? `:${location.port}` : "";
  return `${window.location.protocol}//${window.location.hostname}${port}`;
};
