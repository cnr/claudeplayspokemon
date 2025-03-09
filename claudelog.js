
function clamp(min, max, val) {
  return val < min ? min : val > max ? max : val;
}

function debounce(f, millis) {
  let pending = undefined;
  let resetRunning = false;
  function scheduleReset() {
    resetRunning = true;
    setTimeout(() => {
      resetRunning = false;
      if (pending) {
        f(pending);
        pending = undefined;
        scheduleReset();
      }
    }, millis)
  }
  return (...args) => {
    if (resetRunning) {
      pending = args;
    } else {
      f(args);
      scheduleReset();
    }
  }
}

// ---- Step/screen display

const screen = document.getElementById("screen");
const thinkText = document.getElementById("thinkText");

function fetchAndDisplayStep(step) {
  const image = "./" + step + ".png"
  const text = "./" + step + ".txt"
  screen.src = image;
  fetch(text).then(resp => resp.text()).then(text => {
    thinkText.value = text;
  }).catch(err => {
    thinkText.value = "Failed to fetch log:\n" + err
  });
}
const fetchAndDisplayStepDebounced = debounce(fetchAndDisplayStep, 300);

// ----- Timeline scrubber

const scrubber = document.getElementById("scrubber");
const tooltip = document.getElementById('tooltip');
const tooltipPreview = document.getElementById('tooltip-preview');
const tooltipPreviewText = document.getElementById('tooltip-preview-text');
const stepNum = document.getElementById("step-num");

const tooltipImageDebounced = debounce((step) => {
  tooltipPreview.src = "./" + step + ".png"
}, 300)

function timelineSelect(step) {
  stepNum.value = step;
  fetchAndDisplayStepDebounced(step);
}

function timelineTooltip(step) {
  tooltipPreviewText.textContent = step;
  tooltipImageDebounced(step);
}

scrubber.value = scrubber.max;
timelineSelect(scrubber.max);

setupScrubber(scrubber, tooltip, timelineTooltip, timelineSelect);

// Element -> Element -> (Int -> IO ()) -> (Int -> IO ())
function setupScrubber(scrubber, tooltip, updateTooltip, onSelect) {
  let mouseHeld = false;
  let tooltipValue = scrubber.value;
  let isTouch = false;
  scrubber.ontouchstart = function() {
    isTouch = true;
  }

  scrubber.onmousedown = function() {
    mouseHeld = true;
  }

  scrubber.onmouseup = function() {
    setTimeout(() => {
      mouseHeld = false;
    })
  }

  scrubber.onchange = function(e) {
    if (mouseHeld && !isTouch) {
      this.value = tooltipValue;
    }
    onSelect(scrubber.value);
  }

  scrubber.oninput = function(e) {
    if (mouseHeld && !isTouch) {
      this.value = tooltipValue;
    }
  }

  scrubber.onmousemove = function(e) {
    const rect = scrubber.getClientRects()[0];
    const pxPerStep = (rect.right - rect.left) / (scrubber.max - scrubber.min);
    const relX = e.pageX - rect.left;
    const approxStep = clamp(scrubber.min, scrubber.max, Math.round(relX / pxPerStep) + parseInt(scrubber.min));
    tooltipValue = approxStep;

    updateTooltip(tooltipValue);
    const tooltipRect = tooltip.getClientRects()[0];
    tooltip.style.left = (e.pageX - (tooltipRect.width / 2) - 15) + 'px';
    tooltip.style.top = (rect.top - (tooltipRect.height + 20)) + 'px';
  }
}

