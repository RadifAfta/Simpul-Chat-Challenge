class Message < ApplicationRecord
  belongs_to :room

  validates :content, presence: true
  validates :room_id, presence: true
  validates :username, presence: true

  before_validation :normalize_content
  before_validation :normalize_username
  after_create_commit :broadcast_to_room

  def broadcast_payload
    {
      id: id,
      room_id: room_id,
      username: username,
      content: content,
      created_at: created_at.iso8601
    }
  end

  private

  def normalize_content
    self.content = content.to_s.strip
  end

  def normalize_username
    self.username = username.to_s.strip
  end

  def broadcast_to_room
    ChatChannel.broadcast_to(room, broadcast_payload)
  end
end