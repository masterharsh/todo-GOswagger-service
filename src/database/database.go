package database

import (
	"HarshCoding/todo-GOswagger-service/src/models"

	_ "github.com/go-sql-driver/mysql" //using mysql package in gorm.open()
	"github.com/jinzhu/gorm"
)

// Db connection
var Db *gorm.DB

// Init function for migration
func Init() {
	//open a db connection
	var err error
	Db, err = gorm.Open("mysql", "root:Optimus123@tcp(127.0.0.1:3306)/todoList?charset=utf8&parseTime=True&loc=Local")
	if err != nil {
		panic("failed to connect database")
	}

	//Migrate the schema
	Db.AutoMigrate(&models.TodoModel{})
}
