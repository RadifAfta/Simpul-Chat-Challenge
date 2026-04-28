module ApplicationCable
  class Connection < ActionCable::Connection::Base
    identified_by :visitor_id

    def connect
      self.visitor_id = find_or_create_visitor_id
    end

    private

    def find_or_create_visitor_id
      cookies.encrypted[:chat_visitor_id] ||= SecureRandom.uuid
    end
  end
end