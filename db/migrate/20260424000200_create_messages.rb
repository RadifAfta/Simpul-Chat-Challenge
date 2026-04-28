class CreateMessages < ActiveRecord::Migration[8.1]
  def change
    create_table :messages do |t|
      t.references :room, null: false, foreign_key: true
      t.string :username, null: false
      t.text :content, null: false

      t.timestamps
    end

    add_index :messages, [ :room_id, :created_at ]
  end
end