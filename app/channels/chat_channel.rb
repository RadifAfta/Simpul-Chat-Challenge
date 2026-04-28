class ChatChannel < ApplicationCable::Channel
  def subscribed
    room = Room.find_by(id: params[:room_id])
    return reject unless room

    stream_for room
  end
end