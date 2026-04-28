class CreateRooms < ActiveRecord::Migration[8.1]
  def change
    create_table :rooms do |t|
      t.string :name, null: false

      t.timestamps
    end

    add_index :rooms, "lower(name)", unique: true, name: "index_rooms_on_lower_name"
  end
end