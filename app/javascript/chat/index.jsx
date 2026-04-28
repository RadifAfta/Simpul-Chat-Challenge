import React from "react"
import { createRoot } from "react-dom/client"

import ChatRoom from "./components/ChatRoom"

function mountChatRoom() {
  const rootElement = document.getElementById("chat-root")
  if (!rootElement || rootElement.dataset.reactMounted === "true") {
    return
  }

  rootElement.dataset.reactMounted = "true"
  createRoot(rootElement).render(<ChatRoom />)
}

document.addEventListener("turbo:load", mountChatRoom)