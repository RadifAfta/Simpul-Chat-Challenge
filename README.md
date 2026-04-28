# Simpul Chat

Real-time chat challenge app built with Rails, React, Tailwind, PostgreSQL, and ActionCable.

## Stack

- Backend: Rails 8 (Rails-way JSON endpoints + ActionCable)
- Frontend: React via esbuild (inside the Rails app)
- Styling: Tailwind CSS
- Database: PostgreSQL
- Realtime: ActionCable (room-specific streams)
- Tests: RSpec model specs

## Features

- Room management (create/list/select)
- Room-based real-time messaging
- Slack-like layout (sidebar + main chat window)
- Auto-scroll to newest message
- Username prompt without full authentication (stored in local storage)

## Local Development

1. Install Ruby, Bundler, PostgreSQL, and Node.js in your environment.
2. Install dependencies:

```bash
bundle install
npm install
```

3. Prepare databases:

```bash
bin/rails db:prepare
```

4. Run the app (Rails + JS + CSS watchers):

```bash
bin/dev
```

5. Open http://localhost:3000

## API Endpoints

- `GET /api/rooms`
- `POST /api/rooms`
- `GET /api/rooms/:room_id/messages`
- `POST /api/rooms/:room_id/messages`

## ActionCable

- Channel: `ChatChannel`
- Subscription param: `room_id`
- Stream: `ChatChannel.broadcast_to(room, payload)`

## Testing

Run model specs:

```bash
bundle exec rspec spec/models/message_spec.rb
```

Run full suite:

```bash
bundle exec rspec
```

## Deployment Notes (Railway / Render)

1. Ensure PostgreSQL is attached and `DATABASE_URL` is set.
2. Run migrations on deploy (`bin/rails db:prepare`).
3. Set ActionCable environment variables:

- `ACTION_CABLE_URL=wss://<your-domain>/cable`
- `ACTION_CABLE_ALLOWED_ORIGINS=https://<your-domain>`

4. Keep websocket support enabled on your platform (default for both Railway and Render web services).

The app uses Solid Cable in production (`config/cable.yml`) for durable pub/sub backed by PostgreSQL.
