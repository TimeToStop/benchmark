import { AfterViewChecked, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { Action, INode, ITestCase } from './common';


let time = 0;
let commited = false;

const baseUrl = 'http://localhost:9999/testcase';
const next = `${baseUrl}/next`;
const benchmark = (time: number) => `${baseUrl}/benchmark?time=${time}`;

function commitTime(time: number) {
  if (commited) return;
  console.log('commit time ', time);
  commited = true;
  fetch(benchmark(time)).then((r) => {
    if (200 <= r.status && r.status < 300) {
      setTimeout(() => window.location.reload(),  5 * 1000);
    }
  });
}

function measureTime(callback: (time: number) => void) {
  const data = document.getElementById('data')?.children[0]?.children[0];

  if (!data || data?.children?.length === 0) {
      window.requestAnimationFrame(() => measureTime(callback));
  } else {
    // console.log('commiting with =', data?.children?.length);
    setTimeout(() => {
      // console.log('callbakc');
      const ttime = performance.now() - time;
      callback(ttime);
    }, 0);
  }
};

interface IStrategy {
  init: () => void;
  measure: (data: INode, setData: (data: INode) => void) => void;
}

let first = true;

function updateReRender(data: INode, setData: (data: INode) => void) {
  const update = (element: INode) => {
    element.id += 123;
    element.title += 'update';
    element.text += 'called';
    element.children = element.children.map(update);
    
    return element;
  };

  data = update(data);
  time = performance.now();
  setData({ ...data });
}

function updateOneNode(data: INode, setData: (data: INode) => void) {
  const isLinear = data.children?.every((child) => child.final);

  if (isLinear) {
    const random = getRandomInt(data.children.length);
    data.children[random].id += 100000;
    data.children[random].title += 'update';
    data.children[random].text += 'called';
  } else {
    let current = data;

    while(!current.final) {
      const random = getRandomInt(current.children.length);
      current = current.children[random];
    }

    current.id += 100000;
    current.title += 'update';
    current.text += 'called';
  }

  time = performance.now();
  setData({ ...data });
}


function deleteOneNode(data: INode, setData: (data: INode) => void) {
  const isLinear = data.children?.every((child) => child.final);

  if (isLinear) {
    const random = getRandomInt(data.children.length);
    data.children.splice(random, 1);
  } else {
    let current = data;

    while(!current.children[0].final) {
      const random = getRandomInt(current.children.length);
      current = current.children[random];
    }

    current.children.splice(0, 1);
  }

  time = performance.now();
  setData({ ...data });
}

const strategies: Record<Action, IStrategy> = {
  'first-render': {
    init: () => {
      time = performance.now();
    },
    measure: () => {
      if (first) {
        measureTime(commitTime);
      }
    }
  },
  're-render': {
    init: () => {

    },
    measure: (data, setData) => {
      measureTime(first ? () => updateReRender(data, setData) : commitTime);
    }
  },
  'node-update': {
    init: () => {

    },
    measure: (data, setData) => {
      measureTime(first ? () => updateOneNode(data, setData) : commitTime);
    }
  },
  'node-delete': {
    init: () => {
    },
    measure: (data, setData) => {
      measureTime(first ? () => deleteOneNode(data, setData) : commitTime);
    }
  }
}; 

function getRandomInt(max: number) {
  return Math.floor(Math.random() * max);
}


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewChecked {
  data: ITestCase | null = null;
  cd = inject(ChangeDetectorRef);

  ngOnInit(): void {
    fetch(next).then((r) => r.json()).then((data) => { 
      if (data.finished === true) {
        console.log('data finished got');
        (window as any).__EXPERIMENT_DONE__ = true;
      } else {
        this.data = data;
        time = performance.now();
        this.cd.detectChanges();
      }
    }).catch((err) => console.log(err));
  }

  ngAfterViewChecked(): void {
    if (this.data) {
      strategies[this.data?.type]?.measure(this.data?.root, (data) => {
        if (this.data && !commited) {
          this.data.root = data;
          time = performance.now();
          this.cd.detectChanges();
        }
      });
      first = false;
    }
  }
}
