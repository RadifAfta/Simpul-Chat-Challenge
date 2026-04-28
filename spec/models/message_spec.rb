require "rails_helper"

RSpec.describe Message, type: :model do
  let(:room) { Room.create!(name: "general") }

  it "is valid with content and room_id" do
    message = described_class.new(room: room, username: "radif", content: "Hello from Rails")

    expect(message).to be_valid
  end

  it "is invalid without content" do
    message = described_class.new(room: room, username: "radif", content: nil)

    message.valid?

    expect(message.errors[:content]).to include("can't be blank")
  end

  it "is invalid without room_id" do
    message = described_class.new(username: "radif", content: "No room attached")

    message.valid?

    expect(message.errors[:room_id]).to include("can't be blank")
  end
end