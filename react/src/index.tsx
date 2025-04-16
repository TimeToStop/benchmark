import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// const onRender: ProfilerOnRenderCallback  = (
//   id: string, // the "id" prop of the Profiler tree that has just rendered
//   phase: 'mount' | 'update' | 'nested-update', // either "mount" or "update"
//   actualDuration: number, // time spent rendering the component
//   baseDuration: number, // estimated time to render the entire subtree without memoization
//   startTime: number, // when React began rendering this update
//   commitTime: number // when React committed this update
// ) => {
//   if (phase === 'update')
//     console.log({ id, phase, actualDuration, baseDuration, startTime, commitTime });
// };

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  // <Profiler id="app" onRender={onRender}>
    <React.StrictMode>
      <App />
    </React.StrictMode>
  // </Profiler>
);

// // If you want to start measuring performance in your app, pass a function
// // to log results (for example: reportWebVitals(console.log))
// // or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals(console.log);
