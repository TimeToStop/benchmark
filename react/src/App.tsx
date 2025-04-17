import { useEffect, useLayoutEffect, useState } from 'react';

import './App.css';

let time = 0;

const baseUrl = 'http://localhost:31232/testcase';
const next = `${baseUrl}/next`;
const benchmark = (time: number) => `${baseUrl}/benchmark?time=${time}`;

function commitTime(time: number) {
  console.log('commit time = ', time);
  // console.log('commit time ', time);
  fetch(benchmark(time)).then((r) => {
    if (200 <= r.status && r.status < 300) {
      setTimeout(() => window.location.reload(), 5 * 1000);
      // window.open("http://localhost:3000/", "_blank");
      // window.close();
    }
  });
}

function measureTime(callback: (time: number) => void) {
  console.log('measure time');
  const data = document.getElementsByClassName('data-container')[0];

  if (!data || data?.children[1]?.children?.length === 0) {
      window.requestAnimationFrame(() => measureTime(callback));
  } else {
    setTimeout(() => {
      const ttime = performance.now() - time;
      callback(ttime);
    }, 0);
  }
};

type Action = 'first-render' | 're-render' | 'node-update' | 'node-delete';

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

export interface INode {
  id: number;
  title: string;
  text: string;
  icon: string;
  final: boolean;
  children: INode[];
}

export interface ITestCase {
  type: Action;
  childrenAmount: number;
  root: INode;
}

let timeStamp = Date.now();

function timeLog() {
  let last = Date.now();
  console.log('d = ', last - timeStamp);
  timeStamp = last;
}

function Row({ data }: { data: INode }) {
  return (
    <div className="container">
      <p className="data">{ data?.id }</p>
      <p className="data">{ data?.title }</p>
      <p className="data">{ data?.text }</p>
    </div>
  );
}

function Child({ data }: { data: INode }) {
  return (
    <div className="data-container">
      <Row data={data}></Row>
      <div>
        { data.children.map(child => <Child key={child.id} data={child}></Child>) }
      </div>
    </div>
  );
}

let once = false;

function App() {
  const [loading, setLoading] = useState<boolean>(true);
  const [strategy, setStrategy] = useState<IStrategy | null>(null);
  const [data, setData] = useState<INode | null>(null);

  useEffect(() => {
    const getData = async () => {
      try {
        const response = await fetch(next);
        if (once) {
          return;
        }
        once = true;
        if (!response.ok) {
          throw new Error(`HTTP error: Status ${response.status}`);
        }

        const x = await response.json() as any;
        if (x.finished === true) {
          console.log('finished');
          (window as any).__EXPERIMENT_DONE__ = true;
          return;
        }

        console.log('next testcase ');
        const testcase: ITestCase = x as ITestCase;
        const strategyFound = strategies[testcase.type];

        if (!strategyFound) {
          console.error('strategy not found for type ', testcase.type);
        } else {
          strategyFound.init();
        }

        setStrategy(strategyFound);
        setData(testcase.root);
        setLoading(false);
      } catch (err) {
        setLoading(false);
        setData(null);
      }
    }

    getData();
  }, []);

  useLayoutEffect(() => {
    console.log('update layout');
    timeLog();
    if (loading  || data === null) return;
    setTimeout(() => {
      strategy?.measure(data, setData);
      first = false;
    }, 0);
  }, [loading, strategy, data, setData]);

  if (loading) 
    return (<div>Loading</div>);

  if (data === null)
    return (<div>Error</div>);

  return (
    <div className='data'>
      <Child data={data}></Child>
    </div>
  );
}

export default App;
