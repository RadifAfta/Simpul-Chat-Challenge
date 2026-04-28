import React, { useEffect, useMemo, useRef, useState } from "react"

import { createMessage, createRoom, fetchMessages, fetchRooms } from "../api"
import consumer from "../cable"

const USERNAME_KEY = "simpul_chat_username"

function loadStoredUsername() {
  try {
    return localStorage.getItem(USERNAME_KEY) || ""
  } catch (_error) {
    return ""
  }
}

function saveUsername(value) {
  try {
    localStorage.setItem(USERNAME_KEY, value)
  } catch (_error) {
    // Ignore storage errors and keep username in memory.
  }
}

function sortRooms(rooms) {
  return [...rooms].sort((firstRoom, secondRoom) => firstRoom.name.localeCompare(secondRoom.name))
}

function dedupeMessages(messages) {
  const seenMessageIds = new Set()

  return [...messages]
    .filter((message) => {
      if (seenMessageIds.has(message.id)) {
        return false
      }

      seenMessageIds.add(message.id)
      return true
    })
    .sort((firstMessage, secondMessage) => new Date(firstMessage.created_at) - new Date(secondMessage.created_at))
}

function formatMessageTime(timestamp) {
  if (!timestamp) {
    return ""
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(timestamp))
}

export default function ChatRoom() {
  const [rooms, setRooms] = useState([])
  const [activeRoomId, setActiveRoomId] = useState(null)
  const [messages, setMessages] = useState([])
  const [newRoomName, setNewRoomName] = useState("")
  const [draftMessage, setDraftMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [isBooting, setIsBooting] = useState(true)
  const [isCreatingRoom, setIsCreatingRoom] = useState(false)
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [username, setUsername] = useState(() => loadStoredUsername())
  const [usernameDraft, setUsernameDraft] = useState(() => loadStoredUsername())

  const endOfMessagesRef = useRef(null)
  const subscriptionRef = useRef(null)

  const activeRoom = useMemo(
    () => rooms.find((room) => room.id === activeRoomId) || null,
    [rooms, activeRoomId]
  )

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      try {
        const loadedRooms = await fetchRooms()

        if (cancelled) {
          return
        }

        setRooms(sortRooms(loadedRooms))
        if (loadedRooms.length > 0) {
          setActiveRoomId((currentRoomId) => currentRoomId || loadedRooms[0].id)
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error.message)
        }
      } finally {
        if (!cancelled) {
          setIsBooting(false)
        }
      }
    }

    bootstrap()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!activeRoomId) {
      setMessages([])
      return
    }

    let cancelled = false

    async function loadMessages() {
      try {
        const loadedMessages = await fetchMessages(activeRoomId)

        if (!cancelled) {
          setMessages(dedupeMessages(loadedMessages))
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error.message)
        }
      }
    }

    loadMessages()

    return () => {
      cancelled = true
    }
  }, [activeRoomId])

  useEffect(() => {
    if (!activeRoomId) {
      return undefined
    }

    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe()
    }

    const subscription = consumer.subscriptions.create(
      {
        channel: "ChatChannel",
        room_id: activeRoomId
      },
      {
        received(payload) {
          setMessages((currentMessages) => dedupeMessages([...currentMessages, payload]))
        }
      }
    )

    subscriptionRef.current = subscription

    return () => {
      subscription.unsubscribe()

      if (subscriptionRef.current === subscription) {
        subscriptionRef.current = null
      }
    }
  }, [activeRoomId])

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages])

  async function handleCreateRoom(event) {
    event.preventDefault()

    const normalizedName = newRoomName.trim()
    if (!normalizedName) {
      return
    }

    setIsCreatingRoom(true)
    setErrorMessage("")

    try {
      const room = await createRoom({ name: normalizedName })

      setRooms((currentRooms) => sortRooms([...currentRooms, room]))
      setActiveRoomId(room.id)
      setNewRoomName("")
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsCreatingRoom(false)
    }
  }

  async function handleSendMessage(event) {
    event.preventDefault()

    const normalizedContent = draftMessage.trim()
    if (!normalizedContent || !username || !activeRoomId) {
      return
    }

    setIsSendingMessage(true)
    setErrorMessage("")

    try {
      await createMessage(activeRoomId, {
        content: normalizedContent,
        username
      })

      setDraftMessage("")
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsSendingMessage(false)
    }
  }

  function handleUsernameSubmit(event) {
    event.preventDefault()

    const normalizedUsername = usernameDraft.trim()
    if (!normalizedUsername) {
      return
    }

    saveUsername(normalizedUsername)
    setUsername(normalizedUsername)
  }

  function promptForUsername() {
    setUsername("")
    setUsernameDraft(loadStoredUsername())
  }

  return (
    <div className="chat-page-bg min-h-screen p-3 sm:p-6">
      <div className="chat-panel-shadow mx-auto grid h-[calc(100vh-1.5rem)] max-w-7xl grid-cols-1 overflow-hidden rounded-3xl border border-slate-200/70 bg-white/75 backdrop-blur-sm md:h-[calc(100vh-3rem)] md:grid-cols-[19rem_minmax(0,1fr)]">
        <aside className="flex flex-col border-b border-slate-200/80 bg-white/70 p-5 md:border-b-0 md:border-r md:p-6">
          <div>
            <p className="font-display text-xs uppercase tracking-[0.26em] text-sky-700">Simpul Chat</p>
            <h1 className="font-display mt-2 text-2xl text-slate-900">Rooms</h1>
            <p className="mt-1 text-sm text-slate-500">
              {rooms.length} {rooms.length === 1 ? "room" : "rooms"}
            </p>
          </div>

          <form className="mt-5 space-y-2" onSubmit={handleCreateRoom}>
            <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500" htmlFor="new-room">
              Create Room
            </label>
            <div className="flex items-center gap-2">
              <input
                id="new-room"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
                disabled={isCreatingRoom}
                onChange={(event) => setNewRoomName(event.target.value)}
                placeholder="ex: backend-help"
                type="text"
                value={newRoomName}
              />
              <button
                className="rounded-xl bg-sky-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isCreatingRoom || !newRoomName.trim()}
                type="submit"
              >
                {isCreatingRoom ? "Adding" : "Add"}
              </button>
            </div>
          </form>

          <div className="mt-6 flex-1 overflow-y-auto pr-1">
            {isBooting ? (
              <p className="animate-pulse text-sm text-slate-500">Loading rooms...</p>
            ) : rooms.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                No rooms yet. Create your first room from the form above.
              </p>
            ) : (
              <ul className="space-y-2">
                {rooms.map((room) => {
                  const isActive = room.id === activeRoomId

                  return (
                    <li key={room.id}>
                      <button
                        className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                          isActive
                            ? "border-sky-200 bg-sky-50 text-slate-900 shadow-sm"
                            : "border-transparent bg-white/60 text-slate-700 hover:border-slate-200 hover:bg-white"
                        }`}
                        onClick={() => setActiveRoomId(room.id)}
                        type="button"
                      >
                        <p className="font-display text-sm font-semibold"># {room.name}</p>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </aside>

        <main className="flex min-h-0 flex-col bg-slate-50/85">
          <header className="flex items-center justify-between border-b border-slate-200 bg-white/85 px-5 py-4 backdrop-blur-sm sm:px-8">
            <div>
              <h2 className="font-display text-2xl text-slate-900">
                {activeRoom ? `# ${activeRoom.name}` : "Choose a room"}
              </h2>
              <p className="text-sm text-slate-500">Real-time updates with ActionCable</p>
            </div>

            {username ? (
              <button
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                onClick={promptForUsername}
                type="button"
              >
                {username}
              </button>
            ) : null}
          </header>

          <section className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
            {!activeRoom ? (
              <div className="flex h-full items-center justify-center">
                <p className="rounded-2xl border border-dashed border-slate-300 px-6 py-5 text-sm text-slate-500">
                  Pick a room from the sidebar or create one to start chatting.
                </p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="rounded-2xl border border-dashed border-slate-300 px-6 py-5 text-sm text-slate-500">
                  No messages yet. Be the first one to write in this room.
                </p>
              </div>
            ) : (
              <ul className="space-y-4">
                {messages.map((message) => {
                  const fromCurrentUser = username && message.username.toLowerCase() === username.toLowerCase()

                  return (
                    <li className={`animate-rise-in flex ${fromCurrentUser ? "justify-end" : "justify-start"}`} key={message.id}>
                      <article
                        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                          fromCurrentUser ? "chat-bubble-own" : "chat-bubble-peer"
                        }`}
                      >
                        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                          {message.username}
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
                          {message.content}
                        </p>
                        <time className="mt-2 block text-[11px] text-slate-500">
                          {formatMessageTime(message.created_at)}
                        </time>
                      </article>
                    </li>
                  )
                })}
                <li ref={endOfMessagesRef} />
              </ul>
            )}
          </section>

          <footer className="border-t border-slate-200 bg-white/88 px-4 py-4 sm:px-8">
            {errorMessage ? (
              <p className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {errorMessage}
              </p>
            ) : null}

            <form className="flex items-center gap-3" onSubmit={handleSendMessage}>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
                disabled={!activeRoom || !username || isSendingMessage}
                onChange={(event) => setDraftMessage(event.target.value)}
                placeholder={
                  username
                    ? "Write a message..."
                    : "Choose a username first to start chatting"
                }
                type="text"
                value={draftMessage}
              />
              <button
                className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!activeRoom || !username || !draftMessage.trim() || isSendingMessage}
                type="submit"
              >
                {isSendingMessage ? "Sending" : "Send"}
              </button>
            </form>
          </footer>
        </main>
      </div>

      {!username ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/35 p-4 backdrop-blur-sm">
          <form
            className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
            onSubmit={handleUsernameSubmit}
          >
            <p className="font-display text-xs uppercase tracking-[0.2em] text-sky-700">Welcome</p>
            <h3 className="font-display mt-2 text-2xl text-slate-900">Choose your username</h3>
            <p className="mt-2 text-sm text-slate-500">
              This challenge build keeps auth simple. Your username is stored in local storage.
            </p>

            <label className="mt-5 block text-sm font-medium text-slate-700" htmlFor="username">
              Username
            </label>
            <input
              autoFocus
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
              id="username"
              onChange={(event) => setUsernameDraft(event.target.value)}
              placeholder="ex: radif"
              type="text"
              value={usernameDraft}
            />

            <button
              className="mt-5 w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!usernameDraft.trim()}
              type="submit"
            >
              Enter chat
            </button>
          </form>
        </div>
      ) : null}
    </div>
  )
}