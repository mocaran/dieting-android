import React from 'react';
import {createRoot} from 'react-dom/client';
import './style.css';
import './new-style.css';

const app = import.meta.env.MODE === 'android-offline'
  ? import('./ModernApp')
  : import('./AccountShell');

void app.then(({default: App}) => {
  createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
});
