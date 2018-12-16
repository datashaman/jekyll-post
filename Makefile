build:
	rm -rf build build.crx
	mkdir -p build
	cp -a icon* manifest.json metadata.js options* package* popup* providers.json scripts/ style.css build

list:
	unzip -l build/extension.crx

.PHONY: build
