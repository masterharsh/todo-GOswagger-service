# Go parameters
GOCMD=go
DEP=dep
GOINSTALL=$(GOCMD) install
GOCLEAN=$(GOCMD) clean
GOTEST=$(GOCMD) test
GOTOOL=$(GOCMD) tool
GOGET=$(GOCMD) get
BINARY_NAME=todo-list-server
RUN_SCRIPT=run.sh
COVERAGE_FILE=coverage.out

build:
	$(DEP) ensure
	$(GOINSTALL) ./...
test:
	$(eval export APP_ENV=local)
	$(DEP) ensure 	
	$(GOTEST) -v ./...
clean:
	$(GOCLEAN)
	rm -f $(BINARY_NAME)
	rm -f $(COVERAGE_FILE)
run:
	$(DEP) ensure 
	./$(RUN_SCRIPT)
test_cover:
				$(eval export APP_ENV=local)
				$(DEP) ensure 	
				$(GOTEST) -cover ./... 
test_cover_html:
				$(eval export APP_ENV=local)
				$(DEP) ensure 
				$(GOTEST) -coverprofile=$(COVERAGE_FILE) ./... 
				$(GOTOOL) cover -html=$(COVERAGE_FILE)
dep:
	$(DEP) ensure




