module Api
  class RoomsController < BaseController
    def index
      rooms = Room.order(:name)
      render json: rooms.as_json(only: [ :id, :name, :created_at ])
    end

    def create
      room = Room.new(room_params)

      if room.save
        render json: room.as_json(only: [ :id, :name, :created_at ]), status: :created
      else
        render json: { errors: room.errors.full_messages }, status: :unprocessable_entity
      end
    end

    private

    def room_params
      params.require(:room).permit(:name)
    end
  end
end