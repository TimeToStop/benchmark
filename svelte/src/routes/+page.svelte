<script lang="ts">
  import Child from "./child.svelte";
  import { tick } from "svelte";
  import { onMount } from "svelte";
  import { type INode, type IStrategy, type Action } from "./types";

  let time = 0;

  const baseUrl = "http://localhost:32145/testcase";
  const next = `${baseUrl}/next`;
  const benchmark = (time: number) => `${baseUrl}/benchmark?time=${time}`;

  function commitTime(time: number) {
    console.log("commit time ", time);
    fetch(benchmark(time)).then((r) => {
      if (200 <= r.status && r.status < 300) {
        setTimeout(() => window.location.reload(), 5 * 1000);
        // window.location.reload();
        // window.open("http://localhost:3000/", "_blank");
        // window.close();
      }
    });
  }

  function measureTime(callback: (time: number) => void) {
    console.log('measureTime');
    const data = document.getElementById("root");

    if (!data || data?.children?.[0]?.children[1]?.children?.length === 0) {
      window.requestAnimationFrame(() => measureTime(callback));
    } else {
      setTimeout(() => {
        const ttime = performance.now() - time;
        callback(ttime);
      }, 0);
    }
  }

  let first = true;

  function updateReRender(data: INode, setData: (data: INode) => void) {
    const update = (element: INode) => {
      element.id += 123;
      element.title += "update";
      element.text += "called";
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
      data.children[random].title += "update";
      data.children[random].text += "called";
    } else {
      let current = data;

      while (!current.final) {
        const random = getRandomInt(current.children.length);
        current = current.children[random];
      }

      current.id += 100000;
      current.title += "update";
      current.text += "called";
    }

    time = performance.now();
    setData({ ...data });
  }

  function deleteOneNode(data: INode, setData: (data: INode) => void) {
    const isLinear = data.children?.every((child) => child.final);


    // for (let i = 0; i < 1000000; i++) {
    //   for (let j = 0; j < 10000; j++) {
    //     i +j;
    //   }
    // }

    console.log('delete one node');

    if (isLinear) {
      const random = getRandomInt(data.children.length);
      console.log(random);
      data.children.splice(random, 1);
    } else {
      let current = data;

      while (!current.children[0].final) {
        const random = getRandomInt(current.children.length);
        current = current.children[random];
      }

      current.children.splice(0, 1);
    }

    time = performance.now();
    setData({ ...data });
  }

  const strategies: Record<Action, IStrategy> = {
    "first-render": {
      init: () => {
        time = performance.now();
      },
      measure: () => {
        // if (first) {
        measureTime(commitTime);
        // }
      },
    },
    "re-render": {
      init: () => {},
      measure: (data, setData) => {
        updateReRender(data, setData);
      },
    },
    "node-update": {
      init: () => {},
      measure: (data, setData) => {
        updateOneNode(data, setData);
      },
    },
    "node-delete": {
      init: () => {},
      measure: (data, setData) => {
        deleteOneNode(data, setData);
      },
    },
  };

  function getRandomInt(max: number) {
    return Math.floor(Math.random() * max);
  }

  async function getData() {
    return await fetch(next).then((data) => data.json());
  }

  let isLoaded = false;
  let info = {
    id: 0,
    title: "",
    final: true,
    text: "",
    icon: "",
    children: [] as any[],
  } as INode;

  onMount(() => {
    console.log('on mount');
    getData().then((data) => {
      if (data.finished === true) {
        (window as any).__EXPERIMENT_DONE__ = true;
        return;
      }
      
      time = performance.now();
      isLoaded = true;
      info = data.root;

      console.log('set performance');

      if (data.type === "first-render") {
        console.log('measure time');
        measureTime(commitTime);
      } else {
        tick().then(() => {
          measureTime(() => {
            strategies[data.type as Action].measure(data.root, (x) => {
              setTimeout(() => {
                time = performance.now();
                info = x;
                measureTime(commitTime);
              }, 10 * 1000);
            });
          });
        });
      }
    });
  });
</script>

{#if isLoaded }
  <div id="root">
    <Child data={info}></Child>
  </div>
{/if}
