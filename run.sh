export APP_ENV="local"
export Connection_String="root:Optimus123@tcp(127.0.0.1:3306)/todoList"
export PORT=8055
go run src/cmd/todo-list-server/main.go --host "127.0.0.1"