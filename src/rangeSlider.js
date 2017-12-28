const createDivWithGivenClass = className => {
  const div = document.createElement('div');
  if (className)
    div.classList.add(className);
  return div;
};
let mousedown = 'mousedown';
let mousemove = 'mousemove';
let mouseup = 'mouseup';


export class RangeSlider {
  /**
   *
   * @param node
   * @param option
   */
  constructor(node, option = {
    lowValue: 50,
    highValue: 800,
    min: 0,
    max: 1000,
    useTouch: true,
    title: {
      show: false,
      value: 'Range'
    },
    callback: () => {
    },
  }) {
    if (!node) {
      throw new Error('node 是必须的！');
    }
    if (!option.title) {
      option.title = { value: 'Range', show: false };
    }
    this.rangeSlider = createDivWithGivenClass(this.rangeSlider);
    this.addClass('slider');
    let content = `<div class="values-group">
        <div class="text"><strong>${option.title.value}:</strong>
        <span class="value" id="value1">0</span>
        <span> - </span>
        <span class="value" id="value2">0</span>
        </div>
      </div><div class="track">
        <div class="thumb thumb-min" id="thumb1"></div>
        <div class="thumb thumb-max" id="thumb2"></div>
      </div>`;
    // if (option.title.show) {
    //   content = `<div class="values-group">
    //     <div class="text"><strong>${option.title.value}:</strong>
    //     <span class="value" id="value1">0</span>
    //     <span> - </span>
    //     <span class="value" id="value2">0</span>
    //     </div>
    //   </div>` + content;
    // }
    console.log(content);
    this.useTouch = option.useTouch || true;
    this.lowValue = option.lowValue || 0;
    this.highValue = option.highValue || 100;
    this.callback = option.callback || function () {};
    this.valueRange = [option.min || 0, option.max || 100];
    this.rangeSlider.innerHTML = content;
    if (this.useTouch) {
      mousedown = 'touchstart';
      mousemove = 'touchmove';
      mouseup = 'touchend';
    }
    this.scaleValue = this.scaleValue.bind(this);
    this.valueToPosition = this.valueToPosition.bind(this);
    this.getThumbCenter = this.getThumbCenter.bind(this);
    this.setThumbs = this.setThumbs.bind(this);
    this.appendToNode(node);
  }

  scaleValue(value) {
    const { valueRange } = this;
    return (valueRange[1] - valueRange[0]) * value + valueRange[0];
  }

  valueToPosition(value, width) {
    const { valueRange } = this;
    return width * (value - valueRange[0]) / (valueRange[1] - valueRange[0]);
  }


  getThumbCenter(thumb) {
    const { left, width } = thumb.getBoundingClientRect();
    return left + width / 2;
  }

  setThumbs() {
    const {
      thumb1,
      thumb2,
      value1,
      value2,
      lowValue,
      highValue,
      trackWidth,
      trackStartingX,
      scaleValue,
      getThumbCenter,
      valueToPosition
    } = this;
    const [int1, int2] = [value1, value2].map(v => parseInt(v.textContent));

    thumb1.style.left = `${valueToPosition(int1 || lowValue, trackWidth)}px`;
    value1.textContent = Math.round(
      scaleValue((getThumbCenter(thumb1) - trackStartingX) / trackWidth)
    );

    thumb2.style.left = `${valueToPosition(int2 || highValue, trackWidth)}px`;
    value2.textContent = Math.round(
      scaleValue((getThumbCenter(thumb2) - trackStartingX) / trackWidth)
    );
  }

  appendToNode(node) {
    const {
      rangeSlider,
      getThumbCenter,
      setThumbs,
      scaleValue,
      valueRange
    } = this;

    node.appendChild(rangeSlider);

    const track = rangeSlider.getElementsByClassName('track')[0];
    const { left, width } = track.getBoundingClientRect();

    const trackStartingX = left;
    const trackWidth = width;
    const trackEndingX = trackStartingX + trackWidth;
    const thumb1 = rangeSlider.getElementsByClassName('thumb')[0];
    const thumb2 = rangeSlider.getElementsByClassName('thumb')[1];
    const value1 = rangeSlider.getElementsByClassName('value')[0];
    const value2 = rangeSlider.getElementsByClassName('value')[1];

    this.trackStartingX = trackStartingX;
    this.trackWidth = trackWidth;
    this.trackEndingX = trackEndingX;
    this.thumb1 = thumb1;
    this.thumb2 = thumb2;
    this.value1 = value1;
    this.value2 = value2;

    const moveThumb = (() => {
      const argsCache = {};

      return (selectedThumb, selectedValue) => {
        const key = ''.concat(
          selectedThumb.getAttribute('id'),
          selectedValue.getAttribute('id')
        );
        if (argsCache[key]) return argsCache[key];

        argsCache[key] = event => {
          let clientX = event.clientX;
          if (clientX === undefined) { // 判断是否用于移动端
            clientX = event.changedTouches[0].clientX;
          }
          let newX = clientX - trackStartingX;
          if (clientX > trackEndingX) newX = trackWidth;
          else if (clientX < trackStartingX) newX = 0;
          if (
            selectedThumb.getAttribute('id') === 'thumb1' &&
            clientX > trackStartingX + thumb2.offsetLeft
          ) newX = getThumbCenter(thumb2) - trackStartingX;
          else if (
            selectedThumb.getAttribute('id') === 'thumb2' &&
            clientX < trackStartingX + thumb1.offsetLeft
          ) newX = getThumbCenter(thumb1) - trackStartingX;

          selectedThumb.style.left = `${newX}px`;
          selectedValue.textContent = Math.round(
            scaleValue(newX / trackWidth)
          );

          this.callback([parseInt(value1.textContent), parseInt(value2.textContent)]);
        };

        return argsCache[key];
      };
    })();

    [
      { thumb: thumb1, value: value1 },
      { thumb: thumb2, value: value2 }
    ].forEach(({ thumb, value }) => thumb.addEventListener(mousedown, event => {
      // To get rid of occasional drag behavior
      event.preventDefault();
      thumb.classList.add('active');
      window.addEventListener(mousemove, moveThumb(thumb, value));
    }));

    window.addEventListener(mouseup, () => {
      [thumb1, thumb2].forEach(thumb => thumb.classList.remove('active'));
      [
        { thumb: thumb1, value: value1 },
        { thumb: thumb2, value: value2 }
      ].forEach(({ thumb, value }) => (
        window.removeEventListener(mousemove, moveThumb(thumb, value))
      ));
    });

    setThumbs();

    return this;
  }

  reinit() {
    const parent = this.rangeSlider.parentNode;
    parent.removeChild(this.rangeSlider);
    this.appendToNode(parent);
  }

  addClass(className) {
    this.rangeSlider.classList.add(className);
    return this;
  }
}


// const app = document.getElementById('app');
// const rangeSlider = new RangeSlider().appendToNode(app).addClass('slider');

// window.addEventListener('resize', () => rangeSlider.reinit());