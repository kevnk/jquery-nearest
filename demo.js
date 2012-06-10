// can be overwritten in console
var opts = {
	includeSelf: false,
	checkHoriz: true,
	checkVert: true,
	showGuides: true,
	tolerance: 1
};

$(function () {
	function rand(min, max) {
		return Math.round(Math.random() * (max - min)) + min;
	}

	// Setup random elements
	var elemCount = 10,
		minSize = 50,
		maxSize = 150,
		$menu = $('#menu'),
		$container = $('#container'),
		$footer = $('#footer'),
		menuWidth = $menu.outerWidth(),
		contWidth = $container.width(),
		contHeight = $container.height(),
		footerHeight = $footer.outerHeight(),
		size, x, y, $blocks;
	while (elemCount--) {
		size = rand(minSize, maxSize);
		x = rand(menuWidth, contWidth - size);
		y = rand(0, contHeight - size - footerHeight);
		$('<div class="block"><div></div></div>').css({
			width: size,
			height: size,
			left: x,
			top: y
		}).appendTo($container);
	}
	$blocks = $('.block');

	var $guidePointHoriz = $('#pointHoriz'),
		$guidePointVert  = $('#pointVert'),
		$guidePointDiag  = $('.guidePointDiag'),
		$guideBlockHoriz = $('#blockHoriz'),
		$guideBlockVert  = $('#blockVert'),
		$guideTextDiag   = $('.guideText'),
		$guidePointAll   = $('.guidePoint, .guideText, .guideTol'),
		$guideBlockAll   = $('.guideBlock'),
		$guideTolAll     = $('.guideTol'),
		$guideTolInner   = $('#tolInner'),
		$guideTolOuter   = $('#tolOuter');

	function updatePointGuideDisplay() {
		if (opts.showGuides) {
			$guidePointHoriz.toggle(opts.checkHoriz);
			$guidePointVert.toggle(opts.checkVert);
			$guidePointDiag.add($guideTextDiag).toggle(opts.checkHoriz && opts.checkVert);
			(opts.checkHoriz && !opts.checkVert) || $guideBlockHoriz.hide();
			(opts.checkVert && !opts.checkHoriz) || $guideBlockVert.hide();
			$guideTolAll.show();
		} else {
			$guidePointAll.hide();
			$guideBlockAll.hide();
		}
	}

	// Controls
	$('#menu input').click(function () {
		if (this.type === 'checkbox') {
			opts[this.name] = this.checked;
			updatePointGuideDisplay();
		}
	});
	updatePointGuideDisplay();
	var $toleranceRange = $('#toleranceRange'),
		$toleranceValue = $('#toleranceValue');
	$toleranceRange.change(function () {
		var tolerance = $toleranceRange.val();
		$toleranceValue.text(tolerance);
		opts.tolerance = +tolerance;
	});

	// Calculate a tolerance circle
	function showTolerance($elem, x, y, dist, invert) {
		var wh = dist * 2, // Needs to change
			tol = opts.tolerance,
			wh2
		// if (invert) {
		// 	wh -= tol;
		// }
		wh2 = (wh + tol * 2) / 2;
		$elem.css({
			borderWidth: tol,
			left: x - wh2,
			top: y - wh2,
			width: wh,
			height: wh
		});
	}

	// Demo for $.nearest
	//*
	var lastLineCount = 0;
	$(document).mousemove(function (e) {
		var x = e.pageX,
			y = e.pageY,
			point = $.extend({x: x, y: y}, opts);
		if (opts.showGuides) {
			opts.checkHoriz && $guidePointHoriz.css({top: y});
			opts.checkVert && $guidePointVert.css({left: x});
		}
		var $nearest = $blocks.removeClass('nearestFilter nearestFind furthestFind')
			.nearest(point)
			.addClass('nearestFilter');
		$.nearest(point, $blocks).addClass('nearestFind');
		$.furthest(point, $blocks).addClass('furthestFind');

		// Add an indicator line
		if (opts.showGuides && opts.checkHoriz && opts.checkVert) {
			var minDist = Infinity,
				maxDist = 0;
			$nearest.each2(function (i, $n) {
				var off = $n.offset(),
					nx1 = off.left,
					ny1 = off.top,
					nx2 = nx1 + $n.outerWidth(),
					ny2 = ny1 + $n.outerHeight(),
					maxX1 = Math.max(x, nx1),
					minX2 = Math.min(x, nx2),
					maxY1 = Math.max(y, ny1),
					minY2 = Math.min(y, ny2),
					intersectX = minX2 >= maxX1,
					intersectY = minY2 >= maxY1,
					from = {x:x, y:y},
					to = {
						x: intersectX ? x : nx2 < x ? nx2 : nx1,
						y: intersectY ? y : ny2 < y ? ny2 : ny1
					},
					$lineElem = $('#pointDiag' + i).show(),
					$lineText = $('#textDiag' + i).show(),
					lineProps;
				// Make sure the line guide exists
				if (!$lineElem.length) {
					$lineElem = $('#pointDiag0')
						.clone()
						.attr('id', 'pointDiag' + i)
						.insertAfter('#pointDiag0');
				}
				// Make sure the distance text exists
				if (!$lineText.length) {
					$lineText = $('#textDiag0')
						.clone()
						.attr('id', 'textDiag' + i)
						.insertAfter('#textDiag0');
				}
				// Draw the line and cache its properties
				lineProps = $.line(from, to, {
					elem: $lineElem,
					lineColor: 'red',
					lineWidth: 3,
					returnValues: true
				});

				// Add distance text
				var distX = to.x - from.x,
					distY = to.y - from.y,
					hypot = Math.sqrt(distX * distX + distY * distY);
				$lineText.text((Math.round(hypot * 100) / 100) + 'px');
				var pointX = lineProps.center.x,
					pointY = lineProps.center.y,
					textW = $lineText.outerWidth(),
					textH = $lineText.outerHeight(),
					textW2 = textW / 2,
					textH2 = textH / 2;
				$lineText.css({
					left: pointX - textW2,
					top: pointY - textH2
				});
				if (hypot < minDist) {
					minDist = hypot;
				}
				if (hypot > maxDist) {
					maxDist = hypot;
				}
			});
			// Add tolerance guides
			showTolerance($guideTolInner, x, y, minDist);
			// showTolerance($guideTolOuter, x, y, maxDist, true);
		}
		// Hide any unwanted lines/text
		for (var i = $nearest.length; i < lastLineCount; i++) {
			$('#pointDiag' + i).add('#textDiag' + i).add('#tolDiag' + i).hide();
		}
		lastLineCount = (opts.showGuides && opts.checkHoriz && opts.checkVert) ? $nearest.length : 0;
	});

	// Demo for $.fn.nearest
	$blocks.click(function () {
		var $this = $(this);
		if (opts.showGuides) {
			opts.checkHoriz && !opts.checkVert && $guideBlockHoriz.css({top: $this.css('top'), height: $this.outerHeight()}).show();
			opts.checkVert && !opts.checkHoriz && $guideBlockVert.css({left: $this.css('left'), width: $this.outerWidth()}).show();
		}
		$blocks.removeClass('nearestClick furthestClick').children().text('');
		$this.addClass('nearestClick').children().text('CLICKED');
		$this.nearest($blocks, opts).addClass('nearestClick').children().text('nearest');
		$this.furthest($blocks, opts).addClass('furthestClick').children().text('furthest');
	});
	//*/

	// Test for chaining
	/*
	$('<div/>').css({
		width:1,
		height:1,
		backgroundColor:'#900',
		position:'absolute',
		left:500,
		top:100
	}).appendTo('body');
	$blocks
		.css('backgroundColor','#066')
		.filter(':odd')
			.css('backgroundColor','#0FF')
			.nearest({x:500, y:100})
				.text('Nearest')
				.end()
			.css('color','#F90')
			.end()
		.css('opacity', 0.5);
	//*/
});
