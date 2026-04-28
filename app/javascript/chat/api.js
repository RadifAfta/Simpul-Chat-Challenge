const JSON_HEADERS = {
  Accept: "application/json",
  "Content-Type": "application/json"
}

function csrfToken() {
  return document.querySelector("meta[name='csrf-token']")?.getAttribute("content") || ""
}

function requestHeaders() {
  const token = csrfToken()

  if (!token) {
    return JSON_HEADERS
  }

  return {
    ...JSON_HEADERS,
    "X-CSRF-Token": token
  }
}

async function parseJson(response) {
  try {
    return await response.json()
  } catch (_error) {
    return null
  }
}

function extractErrors(payload, fallback) {
  if (!payload) {
    return fallback
  }

  if (Array.isArray(payload.errors) && payload.errors.length > 0) {
    return payload.errors.join(", ")
  }

  if (typeof payload.error === "string") {
    return payload.error
  }

  return fallback
}

export async function fetchRooms() {
  const response = await fetch("/api/rooms")
  const payload = await parseJson(response)

  if (!response.ok) {
    throw new Error(extractErrors(payload, "Unable to load rooms."))
  }

  return payload || []
}

export async function createRoom(attributes) {
  const response = await fetch("/api/rooms", {
    method: "POST",
    headers: requestHeaders(),
    body: JSON.stringify({ room: attributes })
  })
  const payload = await parseJson(response)

  if (!response.ok) {
    throw new Error(extractErrors(payload, "Unable to create room."))
  }

  return payload
}

export async function fetchMessages(roomId) {
  const response = await fetch(`/api/rooms/${roomId}/messages`)
  const payload = await parseJson(response)

  if (!response.ok) {
    throw new Error(extractErrors(payload, "Unable to load messages."))
  }

  return payload || []
}

export async function createMessage(roomId, attributes) {
  const response = await fetch(`/api/rooms/${roomId}/messages`, {
    method: "POST",
    headers: requestHeaders(),
    body: JSON.stringify({ message: attributes })
  })
  const payload = await parseJson(response)

  if (!response.ok) {
    throw new Error(extractErrors(payload, "Unable to send message."))
  }

  return payload
}