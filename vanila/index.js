
const baseUrl = 'http://localhost:31233/testcase';
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

    const container = document.createElement('div');
    container.classList.add('table-row');

    const id = document.createElement('div');
    id.innerText = element.id.toString();
    container.appendChild(id);
    const title = document.createElement('div');
    title.innerText = element.title;
    container.appendChild(title);
    const text = document.createElement('div');
    text.innerText = element.text;
    container.appendChild(text);

    const buttons = document.createElement('div');
    buttons.classList.add('action-buttons');

    const add = document.createElement('button');
    add.innerText = 'Add';
    const del = document.createElement('button');
    del.innerHTML = 'Remove';
    del.classList.add('remove-btn');

    buttons.appendChild(add);
    buttons.appendChild(del);

    container.appendChild(buttons);

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
    }).catch((err) =>  { 
      console.log(err); 
      window.__EXPERIMENT_DONE__ = true;
    });
}

document.addEventListener('DOMContentLoaded', runApp);