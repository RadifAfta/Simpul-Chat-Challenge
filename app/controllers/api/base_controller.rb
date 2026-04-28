module Api
  class BaseController < ApplicationController
    protect_from_forgery with: :null_session

    rescue_from ActiveRecord::RecordNotFound do
      render json: { error: "Resource not found" }, status: :not_found
    end
  end
end