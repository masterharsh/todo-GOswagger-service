package models

import "github.com/jinzhu/gorm"

// TodoModel describes a todoModel typeT
type TodoModel struct {
	gorm.Model          //this field will embed a Model struct for us which contains four fields “ID, CreatedAt, UpdatedAt, DeletedAt”
	Description *string `json:"description"`
	Completed   bool    `json:"completed"`
	TodoID      int64   `json:"todoID"`
}
