module Api
  class MessagesController < BaseController
    before_action :set_room

    def index
      messages = @room.messages.order(:created_at).limit(200)
      render json: messages.map(&:broadcast_payload)
    end

    def create
      message = @room.messages.new(message_params)

      if message.save
        render json: message.broadcast_payload, status: :created
      else
        render json: { errors: message.errors.full_messages }, status: :unprocessable_entity
      end
    end

    private

    def set_room
      @room = Room.find(params[:room_id])
    end

    def message_params
      params.require(:message).permit(:content, :username)
    end
  end
end