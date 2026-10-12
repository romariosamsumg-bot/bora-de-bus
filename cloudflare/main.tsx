import React from 'react';
import {createRoot} from 'react-dom/client';
import BusApp from '../app/bus-app';
import '../app/globals.css';
createRoot(document.getElementById('root')!).render(<BusApp/>);
