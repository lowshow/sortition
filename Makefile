ARGS=$(SORTITION_PORT)

init:
	NODE_ENV=production npm i 
	./setupConfig.sh
init-dev:
	NODE_ENV=production npm i 
	./setupConfig.sh dev
run:
	test $(SORTITION_PORT)
	NODE_ENV=production node build/run_server.js $(SORTITION_PORT) $(HOME)/.sortition
