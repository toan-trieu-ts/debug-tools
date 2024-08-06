const viewBoxInput = document.getElementById("viewbox");
const inputArea = document.getElementById("input_area");
const outputArea = document.getElementById("output_area");
const uiBtn = document.getElementById("to_ui");
const nsBtn = document.getElementById("to_ns");
var mode = "";
var viewH = 0.0;
var preP = new Object();
var preCP = new Object();

function outputClose() {
	return "path.close()\n";
}

function outputPoint(pX, pY) {
    let px = Math.round(pX * 10) / 10;
    let py = Math.round((viewH + (mode == "NS" ? -1 : 1) * pY) * 10) / 10;
	return (mode == "UI" ? "CG" : "NS") + "Point(x: " + px + ", y: " + py + ")";
}

function outputRelativePoint(pX, pY) {
    let px = Math.round(pX * 10) / 10;
    let py = Math.round((mode == "NS" ? -1 : 1) * pY * 10) / 10;
    return (mode == "UI" ? "CG" : "NS") + "Point(x: " + px + ", y: " + py + ")";
}

function outputMove(pX, pY, delta) {
	let res = "";
	if (delta) {
		if (mode == "NS") {
			res = "path.relativeMove(to: " + outputRelativePoint(pX, pY) + ")\n";
		} else {
			res = "path.move(to: " + outputPoint(preP.x + pX, preP.y + pY) + ")\n";
		}
		preP.x += pX;
		preP.y += pY;
	} else {
		res = "path.move(to: " + outputPoint(pX, pY) + ")\n";
		preP.x = pX;
		preP.y = pY;
	}
	return res;
}

function outputLine(pX, pY, delta) {
	let res = "";
	if (delta) {
		if (mode == "NS") {
			res = "path.relativeLine(to: " + outputRelativePoint(pX, pY) + ")\n";
		} else {
			res = "path.addLine(to: " + outputPoint(preP.x + pX, preP.y + pY) + ")\n";
		}
		preP.x += pX;
		preP.y += pY;
	} else {
		res = "path." + (mode == "UI" ? "addLine" : "line") + "(to: " + outputPoint(pX, pY) + ")\n";
		preP.x = pX;
		preP.y = pY;
	}
	return res;
}

function outputH(pX, delta) {
	if (delta) {
		return outputLine(pX, 0.0, delta);
	} else {
		return outputLine(pX, preP.y, delta);
	}
}

function outputV(pY, delta) {
	if (delta) {
		return outputLine(0.0, pY, delta);
	} else {
		return outputLine(preP.x, pY, delta);
	}
}

function outputCurve(pX, pY, p1X, p1Y, p2X, p2Y, delta) {
	let res = "path.";
	if (delta) {
		if (mode == "NS") {
			res += "relativeCurve(to: " + outputRelativePoint(pX, pY) + ", ";
			res += "controlPoint1: " + outputRelativePoint(p1X, p1Y) + ", ";
			res += "controlPoint2: " + outputRelativePoint(p2X, p2Y) + ")\n";
		} else {
			res += "addCurve(to: " + outputPoint(preP.x + pX, preP.y + pY) + ", ";
			res += "controlPoint1: " + outputPoint(preP.x + p1X, preP.y + p1Y) + ", ";
			res += "controlPoint2: " + outputPoint(preP.x + p2X, preP.y + p2Y) + ")\n";
		}
		preCP.x = preP.x + p2X;
		preCP.y = preP.y + p2Y;
		preP.x += pX;
		preP.y += pY;
	} else {
		res += (mode == "UI" ? "addCurve" : "curve");
		res += "(to: " + outputPoint(pX, pY) + ", ";
		res += "controlPoint1: " + outputPoint(p1X, p1Y) + ", ";
		res += "controlPoint2: " + outputPoint(p2X, p2Y) + ")\n";
		preCP.x = p2X;
		preCP.y = p2Y;
		preP.x = pX;
		preP.y = pY;
	}
	return res;
}

function outputS(pX, pY, p2X, p2Y, delta) {
	if (delta) {
		return outputCurve(pX, pY, preP.x - preCP.x, preP.y - preCP.y, p2X, p2Y, delta);
	} else {
		return outputCurve(pX, pY, 2.0 * preP.x - preCP.x, 2.0 * preP.y - preCP.y, p2X, p2Y, delta);
	}
}

function outputQ(pX, pY, p1X, p1Y, delta) {
	return outputCurve(pX, pY, p1X, p1Y, p1X, p1Y, delta);
}

function outputT(pX, pY, delta) {
	if (delta) {
		let poX = preP.x - preCP.x;
		let poY = preP.y - preCP.y;
		return outputCurve(pX, pY, poX, poY, poX, poY, delta);
	} else {
		let poX = 2.0 * preP.x - preCP.x;
		let poY = 2.0 * preP.y - preCP.y;
		return outputCurve(pX, pY, poX, poY, poX, poY, delta);
	}
}

function output(mode_) {
    mode = mode_;
    viewH = 0.0;
    if (mode === "NS") {
        let viewbox = viewBoxInput.value.match(/\d+(\.\d+)?/g);
        if (viewbox != null && viewbox.length == 4) {
            viewH = parseFloat(viewbox[3]);
        }
    }
	let code = inputArea.value;
	code = code.replace(/\r?\n/g, "");
    let codes = code.match(/[a-zA-Z]|((\s|,|-)?\d+(\.\d+)?)/g);
    if (codes == null) return;
	let types = [];
	let points = [];
	let paths = [];

	for (let i = 0; i < codes.length; i++) {
		let c = codes[i].replace(/\s|,/, "");
		if (c.match(/[a-zA-Z]/) != null) {
			if (points.length > 0) {
				paths.push(points);
			}
			types.push(c);
			points = [];
			if (c.toLowerCase() == "z") {
				paths.push([0]);
			}
		} else if (c.match(/-?\d+(\.\d+)?/) != null) {
			points.push(parseFloat(c));
		}
	}

    preCP = {x: 0.0, y: 0.0};
	preP = {x: 0.0, y: 0.0};
    let result = "let path = " + mode + "BezierPath()\n";
	for (let i = 0; i < types.length; i++) {
		switch (types[i]) {
			case "m": result += outputMove(paths[i][0], paths[i][1], true); break;
			case "M": result += outputMove(paths[i][0], paths[i][1], false); break;
			case "l": result += outputLine(paths[i][0], paths[i][1], true); break;
			case "L": result += outputLine(paths[i][0], paths[i][1], false); break;
			case "h": result += outputH(paths[i][0], true); break;
			case "H": result += outputH(paths[i][0], false); break;
			case "v": result += outputV(paths[i][0], true); break;
			case "V": result += outputV(paths[i][0], false); break;
			case "c": result += outputCurve(paths[i][4], paths[i][5], paths[i][0], paths[i][1], paths[i][2], paths[i][3], true); break;
			case "C": result += outputCurve(paths[i][4], paths[i][5], paths[i][0], paths[i][1], paths[i][2], paths[i][3], false); break;
			case "s": result += outputS(paths[i][2], paths[i][3], paths[i][0], paths[i][1], true); break;
			case "S": result += outputS(paths[i][2], paths[i][3], paths[i][0], paths[i][1], false); break;
			case "q": result += outputQ(paths[i][2], paths[i][3], paths[i][0], paths[i][1], true); break;
			case "Q": result += outputQ(paths[i][2], paths[i][3], paths[i][0], paths[i][1], false); break;
			case "t": result += outputT(paths[i][0], paths[i][1], true); break;
			case "T": result += outputT(paths[i][0], paths[i][1], false); break;
			case "z":
			case "Z": result += outputClose(); break;
			default: break;
		}
	}
	outputArea.innerHTML = result;
}

window.onload = function() {
	uiBtn.addEventListener("click", function(){
		output("UI");
	}, false);

	nsBtn.addEventListener("click", function(){
		output("NS");
	}, false);
}
