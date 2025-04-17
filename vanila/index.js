
const baseUrl = 'http://localhost:32145/testcase';
const next = `${baseUrl}/next`;
const benchmark = (time) => `${baseUrl}/benchmark?time=${time}`;

var time;

function measureTime() {
  const data = document.getElementById('root');

  console.log('measure');

  if (!data || data.getBoundingClientRect().height < 1000) {
     window.requestAnimationFrame(measureTime);
  } else {
    setTimeout(() => {
      const ttime = performance.now() - time;
      console.log('time = ', ttime);
      fetch(benchmark(ttime)).then((r) => {
        if (200 <= r.status && r.status < 300) {
          setTimeout(() => window.location.reload(), 5 * 1000);
        }
      });
    }, 0);
  }
};

function renderElement(element) {
    const row = document.createElement('div');
    // row.classList.add('container');

    const container = document.createElement('div');
    container.classList.add('container');

    const id = document.createElement('p');
    id.classList.add('data');
    id.innerText = element.id.toString();
    container.appendChild(id);
    const title = document.createElement('p');
    title.classList.add('data');
    title.innerText = element.title;
    container.appendChild(title);
    const text = document.createElement('p');
    text.classList.add('data');
    text.innerText = element.text;
    container.appendChild(text);
    // const icon = document.createElement('img');
    // icon.width = 20;
    // icon.src = element.icon;
    // icon.alt = 'some icon';
    // icon.classList.add('data');
    // icon.classList.add('icon');
    // row.appendChild(icon);

    const children = document.createElement('div');

    for (let child of element.children) {
        const row = renderElement(child);

        children.appendChild(row);
    }

    row.appendChild(container);
    row.appendChild(children);
    return row;
}

function render(data) {
  if (!data) return;

  const root = document.getElementById('root');
    
  if (!root) return;

  const div = document.createDocumentFragment('div');

  const container = renderElement(data);

  div.appendChild(container);
  root.appendChild(div);
}

function run(data) {
    time = performance.now();
    render(data);
    measureTime();
}

function runApp() {    
    fetch(next).then((r) => r.json()).then((data) => { 
      if (data.finished === true) {
        window.__EXPERIMENT_DONE__ = true;
      } else {
        run(data.root);
      }
    }).catch((err) => console.log(err));
}

document.addEventListener('DOMContentLoaded', runApp);