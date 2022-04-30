/* global ace, Mode, Cookies, define, LZString, codeBlastAce, Toast */

const link = window.location.protocol + "//" + window.location.hostname + ":" + window.location.port + "/"

let isReadyShort = true;
setInterval(() => (isReadyShort = true), 5000);
let byteCount = s => encodeURI(s).split(/%..|./).length - 1;
let errorRegs = [{
		reg: /^{_\w+}/g,
		msg: "You cant use temp variables unless its in an event/command!"
	},
	{
		reg: /^{_\w+}/g,
		msg: "You cant use temp variables unless its in an event/command!"
	},
	{
		reg: /^(\s|)+format slot \d+ of [\w\s]+/g,
		msg: "We reccomend using TuSKe instead of skQuery GUI",
		type: "warning"
	}
];

function create(filename, text) {
	let element = document.createElement("a");
	element.setAttribute(
		"href",
		"data:text/plain;charset=utf-8," + encodeURIComponent(text)
	);
	element.setAttribute("download", filename);
	element.style.display = "none";
	document.body.appendChild(element);
	element.click();
	document.body.removeChild(element);
}

function copyTextToClipboard(text) {
	if (!navigator.clipboard) return;
	navigator.clipboard.writeText(text);
}

window.isUpdateAvailable = new Promise(function (resolve, reject) {
	if ("serviceWorker" in navigator) {
		navigator.serviceWorker
			.register("/sw.js")
			.then(reg => {
				reg.onupdatefound = () => {
					const installingWorker = reg.installing;
					installingWorker.onstatechange = () => {
						switch (installingWorker.state) {
							case "installed":
								if (navigator.serviceWorker.controller) resolve(true);
								else resolve(false);
								break;
						}
					};
				};
			})
			.catch(err => console.error("[SW ERROR]", err));
	}
});

var editor = ace.edit("editor");
codeBlastAce(ace);
editor.setShowPrintMargin(false);
editor.session.setMode("ace/mode/skript");
editor.setValue(`command /hello:
	trigger:
		send "Hello %player%! This is an example coding language for Minecraft!"
		give 1 diamond to the player

command /hellogui:
	trigger:
		# this is using TuSKe for GUIs. You can use skQuery, but we reccomend TuSKe
		open virtual chest inventory with size 1 named "&eHello!"
		format gui slot 0 of player with diamond named "&9Diamond" to do nothing`);
editor.setOptions({
	useSoftTabs: false,
	enableLiveAutocompletion: true
});

var langTools = ace.require("ace/ext/language_tools");
$("#export").click(() => create("skript.sk", editor.getValue()));
$("#theme").change(() => {
	editor.setTheme("ace/theme/" + $("#theme").val());
	Cookies.set("theme", $("#theme").val());
});

setTimeout(() => (window.parseReady = true), 2000);

editor.getSession().on("change", function (e) {
	$("#bytes").html(byteCount(editor.getValue()));
	$("#lines").html(editor.getValue().split(/[\r\n]/g).length);
	Cookies.set("data", editor.getValue());
	if (window.parseReady) {
		editor.getSession().setAnnotations([]);
		if (editor.getValue() == "") {
			editor.getSession().setAnnotations([{
				row: 0,
				column: 0,
				text: "File is empty",
				type: "warning"
			}]);
		} else {
			let annData = [];
			editor
				.getValue()
				.split("\n")
				.forEach((txt, index) => {
					errorRegs.forEach(data => {
						if (txt.match(data.reg))
							annData.push({
								row: index,
								column: 0,
								text: data.msg,
								type: data.type ? data.type : "error"
							});
					});
				});
			editor.getSession().setAnnotations(annData);
		}
	}
});

window["isUpdateAvailable"].then(isAvailable => {
	if (isAvailable) {
		new Toast({
			message: "A new update is available! Refresh to update, or force refresh (CTRL + F5) for a forced update!"
		});
	}
});
$("body").on("dragover", function (e) {
	e.preventDefault();
	e.stopPropagation();
	$("#editor").css("filter", "blur(2px)");
});

$("body").on("dragenter", function (e) {
	e.preventDefault();
	e.stopPropagation();
});

$("body").on("dragleave", function () {
	$("#editor").css("filter", "blur(0px)");
});

$("body").on("drop", function (e) {
	if (
		e.originalEvent.dataTransfer &&
		e.originalEvent.dataTransfer.files.length
	) {
		$("#editor").css("filter", "blur(0px)");
		e.preventDefault();
		e.stopPropagation();
		var reader = new FileReader();
		reader.onload = function (e) {
			var text = e.target.result;
			editor.setValue(text);
		};
		reader.readAsText(e.originalEvent.dataTransfer.files[0]);
	}
});
if (Cookies.get("data") && !location.hash) editor.setValue(Cookies.get("data"));
if (Cookies.get("theme")) editor.setTheme("ace/theme/" + Cookies.get("theme"));
setTimeout(() => {
	try {
		Cookies.get("blastCode") ?
			editor.setOption("blastCode", {
				effect: 1
			}) :
			editor._codeBlast.destroy();
	} catch (e) {}
}, 200);
if (Cookies.get("autocomplete"))
	editor.setOption("enableLiveAutocompletion", Cookies.get("autocomplete"));
if (location.hash)
	editor.setValue(
		LZString.decompressFromBase64(decodeURI(location.hash.substring(1)))
	);
editor.clearSelection();
$(`[value=${editor.getTheme().replace("ace/theme/", "")}]`).prop(
	"selected",
	true
);
$("#bytes").html(byteCount(editor.getValue()));
$("#lines").html(editor.getValue().split(/\r\n|\r|\n/).length);
$("#import").click(() => document.getElementById("fileElem").click());
$("#fileElem").change(function (e) {
	let tempFile = e.target.files[0];
	var reader = new FileReader();
	reader.readAsText(tempFile, "UTF-8");
	reader.onload = evt => editor.setValue(evt.target.result);
});
$("#link").click(() => {
	if (!isReadyShort) return;
	isReadyShort = false;
	$.ajax({
		type: "POST",
		url: "/shorturl",
		data: {
			data: LZString.compressToBase64(editor.getValue())
		},
		success: function (data) {
			let toaster = new Toast({
				message: `Link: ${link + data.url}`,
				type: "success",
				customButtons: [{
					text: "Copy",
					onClick: function () {
						copyTextToClipboard(
							`${link + data.url}`
						);
						toaster._close();
					}
				}]
			});
		}
	});
});

$("#share").click(() => {
	if (!isReadyShort) return;
	isReadyShort = false;
	$.ajax({
		type: "POST",
		url: "/shareurl",
		data: {
			data: LZString.compressToBase64(editor.getValue())
		},
		success: function (data) {
			let toaster = new Toast({
				message: `Link: ${link + data.url}`,
				type: "success",
				customButtons: [{
					text: "Copy",
					onClick: function () {
						copyTextToClipboard(
							`${link + data.url}` + data.url
						);
						toaster._close();
					}
				}]
			});
		}
	});
});

$("#options").click(() => $(".options-modal").addClass("show-modal"));
$("#blast-o").change(() => {
	$("#blast-o").is(":checked") ?
		editor.setOption("blastCode", {
			effect: 1
		}) :
		editor._codeBlast.destroy();
	Cookies.set("blastCode", $("#blast-o").is(":checked"));
});
$("#soft-o").change(() =>
	$("#soft-o").is(":checked") ?
	editor.setOption("useSoftTabs", true) :
	editor.setOption("useSoftTabs", false)
);
$("#autocomplete-o").change(() => {
	editor.setOption(
		"enableLiveAutocompletion",
		$("#autocomplete-o").is(":checked")
	);
	Cookies.set("autocomplete", $("#autocomplete-o").is(":checked"));
});
$("#soft-s").change(() => editor.setOption("tabSize", $("#soft-s").val()));
$(".close-button").click(() => $(".modal").removeClass("show-modal"));