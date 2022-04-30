const { Router }    = require("express");
const router        = Router();
const path          = require("path");
const UglifyJS      = require("uglify-es");
const fs            = require("fs").promises;
const createError   = require("http-errors");

const processCSS    = require("./../utils/processcss");

const FileType = {
	SCRIPT: 1,
	STYLE: 2
};

let pageCache = [];

const loadFile = async (filePath, fileType, next) => {
	try {
		let data;
		if (pageCache[filePath] == null) {
			data = await fs.readFile(filePath, "utf-8");
			if (fileType == FileType.SCRIPT) data = UglifyJS.minify(data).code;
			else if (fileType == FileType.STYLE) {
				data = await processCSS(data);
				data.warnings().map(warn => warn.toString()).forEach(console.warn);
				data = data.css;
			}
			pageCache[filePath] = data;
		} else data = pageCache[filePath];
		return data;
	} catch (e) {
		console.log(e.toString());
		next(createError(404, "File not found!"));
	}
};

router.get("/scripts/:file.js", async (request, response, next) =>
	response.attachment(`${request.params.file}.js`)
		.type("js")
		.send(await loadFile(path.join(__dirname, `../lib/scripts/${request.params.file}.js`), FileType.SCRIPT, next))
);

router.get("/styles/:file.css", async (request, response, next) =>
	response.attachment(`${request.params.file}.css`)
		.type("css")
		.send(await loadFile(path.join(__dirname, `../lib/styles/${request.params.file}.scss`), FileType.STYLE, next))
);

module.exports = router;