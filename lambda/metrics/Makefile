build-MetricsFunction:
	mkdir -p "$(ARTIFACTS_DIR)"
	npm install --no-package-lock
	./node_modules/.bin/tsc --outDir "$(ARTIFACTS_DIR)"
	npm prune --omit=dev
	cp package.json "$(ARTIFACTS_DIR)/package.json"
	cp -R node_modules "$(ARTIFACTS_DIR)/node_modules"