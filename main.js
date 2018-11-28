const robot = require("robotjs"),
	  log = require('fancy-log'),
	  color = require('ansi-colors');

const WAITING = rgb(101, 69, 0),
	  FISHING = rgb(75, 156, 213),
	  GOTFISH = rgb(0, 204, 0);

function rgb(r, g, b) {
	return {r: r, g: g, b: b};
}

function hex2rgb(hex) {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function rgb2hex(r, g, b) {
	if (typeof r === "object") { g = r.g; b = r.b; r = r.r; }
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

function isQuasiEqual(c1, c2) {
	const abs = Math.abs,
		  d = rgb(abs(c1.r - c2.r), abs(c1.g - c2.g), abs(c1.b - c2.b));

	return Math.max(d.r, d.g, d.b);
}

function findBox(y, STATEMENT) {
	let img = robot.screen.capture(0, y, 1920, 1);

	let finds = [], str = "", c = 0;
	for (let i = 0, color, delta, last = false; i < img.width; i++) {
		color = hex2rgb(img.colorAt(i, 0));
		delta = isQuasiEqual(color, STATEMENT);

		if (delta <= 1) {
			if (!last) {
				finds.push([]);
				last = true;
			}
			finds[finds.length - 1].push(i);
			c++;
		} else {
			last = false;
		}
	}

	if (finds.length === 0) {
		return false;
	}

	const mapLength = finds.map(arr => Math.abs(64 - arr.length)),
		  minLength = Math.min(...mapLength),
		  theBox = finds[mapLength.indexOf(minLength)];
	
	log(`Box on y:${y} and x: {x0:${theBox[0]}, x1:${theBox[theBox.length - 1]}}.`);
	return {
		y: y,
		x0: theBox[0],
		x1: theBox[theBox.length - 1]
	};
}

function main() {
	var theBox = false;

	lines:
	for (let y = 0, box; y < 6; y++) {
		for (let s = 0, box; s < 2; s++) {
			box = findBox(y, (s) ? WAITING : FISHING);
			if (box) {
				theBox = box;
				break lines;
			}
		}
		log("ui not detected on y:" + y + ".");
	}

	if (!theBox)
		return log("ui not detected.");

	setInterval(loop, 500);

	return theBox;
}

const boxCorner = main();

function getState() {
	const box = boxCorner;
	let img = robot.screen.capture(box.x0 + (box.x1 - box.x0) / 2, box.y, 1, 1),
		color = hex2rgb(img.colorAt(0, 0));
	
	if (isQuasiEqual(color, WAITING) <= 1)
		return "WAITING";

	if (isQuasiEqual(color, FISHING) <= 1)
		return "FISHING";

	if (isQuasiEqual(color, GOTFISH) <= 1)
		return "GOT";

	return "UNKNOW";
}

let lastChange = +new Date(),
	tryChange = 0,
	currentState = "WAITING";

function loop() {
	let state = getState();

	if (currentState !== state) {
		log(`State : ${color.yellow(state)}`);
		if (state === "GOT") {
			press("e");
		} else if (state === "WAITING") {
			setTimeout(() => press("e"), 1500 + Math.random() * 500);
		}

		lastChange = +new Date() + 2000;
		tryChange = 0;
	}

	if (state === "WAITING" && tryChange <= 4 && (new Date() - lastChange) > 3250 + Math.random() * 2000) {
		setTimeout(() => press("e"), 1500 + Math.random() * 500);
		lastChange = +new Date();
		tryChange++;
	}

	currentState = state;
}

function press(key) {
	robot.keyTap(key);
	log(`Keypress : ${color.cyan(key)}`);
}